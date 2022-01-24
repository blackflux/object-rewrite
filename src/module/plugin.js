import assert from 'assert';
import Joi from 'joi-strict';
import validationCompile from './plugin/validation-compile.js';
import validationExtractKeys from './plugin/validation-extract-keys.js';
import joinPath from './plugin/join-path.js';

const plugin = (type, options) => {
  assert(['FILTER', 'INJECT', 'SORT'].includes(type));
  Joi.assert(options, Joi.object({
    name: Joi.string(),
    target: Joi.string(), // target can not be "", use "*" instead
    requires: Joi.alternatives(
      Joi.array().items(Joi.string()),
      Joi.function().arity(1)
    ),
    schema: Joi.object({
      initContext: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).optional(),
      rewriteContext: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).optional(),
      fnInput: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).optional(),
      fnOutput: type === 'INJECT' ? Joi.alternatives(Joi.object(), Joi.array(), Joi.function()) : Joi.forbidden()
    })[type === 'INJECT' ? 'required' : 'optional'](),
    onInit: Joi.function().optional(),
    onRewrite: Joi.function().optional(),
    fn: Joi.function(),
    limit: type === 'SORT' ? Joi.function().optional() : Joi.forbidden()
  }));

  const {
    name, target, requires, schema, onInit, onRewrite, fn, limit
  } = options;

  const schemaCompiled = {
    initContext: schema?.initContext ? validationCompile(schema.initContext, false) : () => true,
    rewriteContext: schema?.rewriteContext ? validationCompile(schema.rewriteContext, false) : () => true,
    fnInput: schema?.fnInput ? validationCompile(schema.fnInput, false) : null,
    fnOutput: schema?.fnOutput ? validationCompile(schema.fnOutput) : null
  };

  let localCache;
  let localContext;
  const wrap = (f) => {
    if (f === undefined) {
      return undefined;
    }
    return (kwargs = {}) => {
      // eslint-disable-next-line no-param-reassign
      kwargs.cache = localCache;
      // eslint-disable-next-line no-param-reassign
      kwargs.context = localContext;
      return f(kwargs);
    };
  };
  const wrapInject = (f) => {
    const validate = (r) => {
      if (schemaCompiled.fnOutput(r) !== true) {
        throw new Error(`${name}: bad fn return value "${r}"`);
      }
      return r;
    };
    return (kwargs) => {
      const result = f(kwargs);
      if (result instanceof Promise) {
        return result.then((r) => validate(r));
      }
      return validate(result);
    };
  };
  const fnWrapped = (() => {
    const wrapped = type === 'INJECT' ? wrapInject(wrap(fn)) : wrap(fn);
    if (schemaCompiled.fnInput === null) {
      return wrapped;
    }
    return (kwargs) => {
      if (schemaCompiled.fnInput(kwargs.value) !== true) {
        throw new Error(`Value Schema validation failure\n${JSON.stringify({
          origin: 'object-rewrite',
          value: kwargs.value,
          options
        })}`);
      }
      return wrapped(kwargs);
    };
  })();

  const self = (prefix, prefixIndex = 0) => {
    const targetAbs = joinPath([prefix, target]);
    const result = {
      self,
      prefixIndex,
      name,
      prefix,
      targetNormalized: targetAbs.endsWith('.') ? targetAbs.slice(0, -1) : targetAbs,
      target: targetAbs,
      targets: [targetAbs],
      targetRel: target,
      requires: (initContext) => {
        assert(initContext.constructor === Object);
        let r = requires;
        if (typeof requires === 'function') {
          r = requires(initContext);
          assert(Array.isArray(r));
        }
        return r.map((f) => (f.startsWith('/') ? f.slice(1) : joinPath([prefix, f])));
      },
      type,
      fn: fnWrapped,
      limit: wrap(limit)
    };
    if (type === 'INJECT') {
      result.targetNormalized = prefix;
      result.targets = validationExtractKeys(targetAbs, schema.fnOutput);
    }
    return result;
  };
  const handleCb = ({
    type: cbType,
    before: cbBefore,
    kwargs,
    fn: cbFn,
    context,
    logger
  }) => {
    const fnName = `${cbType}Context`;
    if (schemaCompiled[fnName](context) === false) {
      logger.warn(`${cbType[0].toUpperCase()}${cbType.slice(1)} Context validation failure\n${JSON.stringify({
        origin: 'object-rewrite',
        options
      })}`);
      return false;
    }
    cbBefore();
    localContext = schema?.[fnName] instanceof Object && !Array.isArray(schema?.[fnName])
      ? Object.keys(schema?.[fnName]).reduce((p, k) => {
        // eslint-disable-next-line no-param-reassign
        p[k] = context[k];
        return p;
      }, {})
      : context;
    return cbFn === undefined ? true : wrap(cbFn)(kwargs);
  };
  self.meta = {
    name,
    schema,
    onInit: (context, logger) => handleCb({
      type: 'init',
      before: () => {
        localCache = {};
      },
      kwargs: {},
      fn: onInit,
      context,
      logger
    }),
    onRewrite: (data, context, logger) => handleCb({
      type: 'rewrite',
      before: () => {},
      kwargs: { data },
      fn: onRewrite,
      logger,
      context
    })
  };
  return self;
};

export const filterPlugin = (opts) => plugin('FILTER', opts);
export const injectPlugin = (opts) => plugin('INJECT', opts);
export const sortPlugin = (opts) => plugin('SORT', opts);
