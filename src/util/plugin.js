const assert = require('assert');
const Joi = require('joi-strict');

const pluginTypes = ['FILTER', 'INJECT', 'SORT'];

const join = (input) => {
  const result = input.filter((e) => !!e).join('.');
  if (result === '*') {
    return '';
  }
  if (result.endsWith('.*')) {
    return result.slice(0, -1);
  }
  return result;
};

const asSchema = (input) => {
  if (Joi.isSchema(input)) {
    return input;
  }
  if (Array.isArray(input)) {
    return Joi.array().items(...input.map((e) => asSchema(e)));
  }
  assert(input instanceof Object);
  return Joi.object().keys(Object.entries(input).reduce((p, [k, v]) => Object.assign(p, {
    [k]: asSchema(v)
  }), {}));
};

const extractKeys = (prefix, input) => {
  if (Joi.isSchema(input)) {
    return [prefix];
  }
  if (Array.isArray(input)) {
    assert(input.length === 1);
    return extractKeys(prefix, input[0]);
  }
  assert(input instanceof Object);
  return Object.entries(input).reduce((p, [k, v]) => {
    extractKeys(`${prefix}.${k}`, v)
      .forEach((e) => p.push(e));
    return p;
  }, []);
};

const plugin = (type, options) => {
  Joi.assert(
    { type, options },
    Joi.object({
      type: Joi.string().valid(...pluginTypes),
      options: Joi.object({
        target: Joi.string(), // target can not be "", use "*" instead
        requires: Joi.array().items(Joi.string()),
        fn: Joi.function(),
        schema: type === 'INJECT' ? Joi.alternatives(Joi.object(), Joi.array()) : Joi.forbidden(),
        limit: type === 'SORT' ? Joi.function().optional() : Joi.forbidden()
      })
    })
  );

  const {
    target, requires, fn, schema, limit
  } = options;
  return (prefix) => {
    const targetAbs = join([prefix, target]);
    const result = {
      prefix,
      target: targetAbs,
      targets: [targetAbs],
      targetRel: target,
      requires: requires.map((f) => (f.startsWith('/') ? f.slice(1) : join([prefix, f]))),
      type,
      fn,
      limit
    };
    if (type === 'INJECT') {
      result.schema = asSchema(schema);
      result.targets = extractKeys(targetAbs, schema);
    }
    return result;
  };
};

module.exports = pluginTypes.reduce((prev, t) => Object.assign(prev, {
  [`${t.toLowerCase()}Plugin`]: (options) => plugin(t, options)
}), { pluginTypes });
