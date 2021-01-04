const assert = require('assert');
const Joi = require('joi-strict');
const validationCompile = require('./plugin/validation-compile');
const validationExtractKeys = require('./plugin/validation-extract-keys');
const joinPath = require('./plugin/join-path');

const plugin = (type, options) => {
  assert(['FILTER', 'INJECT', 'SORT'].includes(type));
  Joi.assert(options, Joi.object({
    target: Joi.string(), // target can not be "", use "*" instead
    requires: Joi.array().items(Joi.string()),
    init: Joi.function().optional(),
    fn: Joi.function(),
    schema: type === 'INJECT' ? Joi.alternatives(Joi.object(), Joi.array(), Joi.function()) : Joi.forbidden(),
    limit: type === 'SORT' ? Joi.function().optional() : Joi.forbidden()
  }));

  const {
    target, requires, init, fn, schema, limit
  } = options;
  return (prefix) => {
    const targetAbs = joinPath([prefix, target]);
    const result = {
      prefix,
      targetNormalized: targetAbs.endsWith('.') ? targetAbs.slice(0, -1) : targetAbs,
      target: targetAbs,
      targets: [targetAbs],
      targetRel: target,
      requires: requires.map((f) => (f.startsWith('/') ? f.slice(1) : joinPath([prefix, f]))),
      type,
      init,
      fn,
      limit
    };
    if (type === 'INJECT') {
      result.targetNormalized = prefix;
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
