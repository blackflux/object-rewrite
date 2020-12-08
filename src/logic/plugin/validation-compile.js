const assert = require('assert');

const validationCompile = (input) => {
  if (typeof input === 'function') {
    return input;
  }
  if (Array.isArray(input)) {
    const compiled = input.map((v) => validationCompile(v));
    return (r) => (
      Array.isArray(r)
      && r.every((e) => compiled.some((v) => v(e) === true))
    );
  }
  assert(input instanceof Object);
  const compiled = Object.entries(input).map(([k, v]) => [k, validationCompile(v)]);
  return (r) => (
    r instanceof Object
    && !Array.isArray(r)
    && Object.keys(r).length === compiled.length
    && compiled.every(([k, v]) => v(r[k]) === true)
  );
};
module.exports = validationCompile;
