import assert from '../../util/assert.js';

const validationExtractKeys = (prefix, input) => {
  if (typeof input === 'function') {
    return [prefix];
  }
  if (Array.isArray(input)) {
    assert(input.length === 1);
    return validationExtractKeys(prefix, input[0]);
  }
  assert(input instanceof Object);
  return Object.entries(input).reduce((p, [k, v]) => {
    validationExtractKeys(`${prefix}.${k}`, v)
      .forEach((e) => p.push(e));
    return p;
  }, []);
};
export default validationExtractKeys;
