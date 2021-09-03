const assert = require('assert');
const Joi = require('joi-strict');
const validationCompile = require('./plugin/validation-compile');
const validationExtractKeys = require('./plugin/validation-extract-keys');
const joinPath = require('./plugin/join-path');

const plugin = (type, options) => {
  assert(['FILTER', 'INJECT', 'SORT'].includes(type));
  Joi.assert(options, Joi.object({
    name: Joi.string(),
    target: Joi.string(), // target can not be "", use "*" instead
    requires: Joi.alternatives(
      Joi.array().items(Joi.string()),
      Joi.function().arity(1)
    ),
    contextSchema: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).optional(),
    valueSchema: Joi.alternatives(Joi.object(), Joi.array(), Joi.function()).optional(),
    onInit: Joi.function().optional(),
    onRewrite: Joi.function().optional(),
    fn: Joi.function(),
    fnSchema: type === 'INJECT' ? Joi.alternatives(Joi.object(), Joi.array(), Joi.function()) : Joi.forbidden(),
    limit: type === 'SORT' ? Joi.function().optional() : Joi.forbidden()
  }));

  const {
    name, target, requires, contextSchema, valueSchema, onInit, onRewrite, fn, fnSchema, limit
  } = options;

  const contextSchemaCompiled = contextSchema === undefined
    ? () => true
    : validationCompile(contextSchema, false);

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
    const schema = validationCompile(fnSchema);
    const validate = (r) => {
      if (schema(r) !== true) {
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
    if (valueSchema === undefined) {
      return wrapped;
    }
    const valueSchemaCompiled = validationCompile(valueSchema, false);
    return (kwargs) => {
      if (valueSchemaCompiled(kwargs.value) !== true) {
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
      result.targets = validationExtractKeys(targetAbs, fnSchema);
    }
    return result;
  };
  self.meta = {
    name,
    contextSchema,
    onInit: (initContext) => {
      localCache = {};
      localContext = initContext;
      if (onInit === undefined) {
        return true;
      }
      return wrap(onInit)();
    },
    onRewrite: (data, context, logger) => {
      if (contextSchemaCompiled(context) === false) {
        logger.warn(`Context validation failure\n${JSON.stringify({
          origin: 'object-rewrite',
          options
        })}`);
        return false;
      }
      localContext = contextSchema instanceof Object && !Array.isArray(contextSchema)
        ? Object.keys(contextSchema).reduce((p, k) => {
          // eslint-disable-next-line no-param-reassign
          p[k] = context[k];
          return p;
        }, {})
        : context;
      return onRewrite === undefined ? true : wrap(onRewrite)();
    }
  };
  return self;
};

module.exports = {
  filterPlugin: (opts) => plugin('FILTER', opts),
  injectPlugin: (opts) => plugin('INJECT', opts),
  sortPlugin: (opts) => plugin('SORT', opts)
};
