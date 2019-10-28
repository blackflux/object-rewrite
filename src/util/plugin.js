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
        fn: Joi.function()
      })
    })
  );

  const { target, requires, fn } = options;
  return (prefix) => ({
    prefix,
    target: join([prefix, target]),
    targetRel: target,
    requires: requires.map((f) => join([prefix, f])),
    type,
    fn
  });
};

module.exports = pluginTypes.reduce((prev, t) => Object.assign(prev, {
  [`${t.toLowerCase()}Plugin`]: (options) => plugin(t, options)
}), { pluginTypes });
