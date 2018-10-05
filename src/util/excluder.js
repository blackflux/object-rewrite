const assert = require("assert");
const isPlainObject = require("lodash.isplainobject");

const EXCLUDED = Symbol("excluded");
const isExcluded = input => input[EXCLUDED] === true;

const excludeRecursive = (input) => {
  if (input instanceof Object) {
    const isArray = Array.isArray(input);
    Object.entries(input).forEach(([k, v]) => {
      if (isExcluded(v)) {
        if (isArray) {
          input.splice(parseInt(k, 10), 1);
        } else {
          // eslint-disable-next-line no-param-reassign
          delete input[k];
        }
      } else {
        excludeRecursive(v);
      }
    });
  }
};

module.exports.markExcluded = input => Object
  .defineProperty(input, EXCLUDED, { value: true, writable: false });

module.exports.excludeRecursive = (input) => {
  assert(isPlainObject(input));
  excludeRecursive(input);
};
