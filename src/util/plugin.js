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

const plugin = (type, options) => {
  Joi.assert(
    { type, options },
    Joi.object({
      type: Joi.string().valid(...pluginTypes),
      options: Joi.object({
        target: Joi.string(), // target can not be "", use "*" instead
        requires: Joi.array().items(Joi.string()),
        fn: Joi.function(),
        schema: type === 'INJECT' ? Joi.object() : Joi.forbidden(),
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
      const isSchema = Joi.isSchema(schema);
      result.schema = isSchema ? schema : Joi.object().keys(schema);
      if (!isSchema) {
        result.targets = Object.keys(schema).map((key) => `${targetAbs}.${key}`);
      }
    }
    return result;
  };
};

module.exports = pluginTypes.reduce((prev, t) => Object.assign(prev, {
  [`${t.toLowerCase()}Plugin`]: (options) => plugin(t, options)
}), { pluginTypes });
