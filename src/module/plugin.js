const Joi = require('joi-strict');
const validationCompile = require('../util/validation-compile');
const validationExtractKeys = require('../util/validation-extract-keys');

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
      type: Joi.string().valid('FILTER', 'INJECT', 'SORT'),
      options: Joi.object({
        target: Joi.string(), // target can not be "", use "*" instead
        requires: Joi.array().items(Joi.string()),
        fn: Joi.function(),
        schema: type === 'INJECT' ? Joi.alternatives(Joi.object(), Joi.array(), Joi.function()) : Joi.forbidden(),
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
      result.schema = validationCompile(schema);
      result.targets = validationExtractKeys(targetAbs, schema);
    }
    return result;
  };
};

module.exports = {
  filterPlugin: (opts) => plugin('FILTER', opts),
  injectPlugin: (opts) => plugin('INJECT', opts),
  sortPlugin: (opts) => plugin('SORT', opts)
};
