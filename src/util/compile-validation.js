const assert = require('assert');

const compileValidation = (input) => {
  if (typeof input === 'function') {
    return input;
  }
  if (Array.isArray(input)) {
    const compiled = input.map((v) => compileValidation(v));
    return (r) => (
      Array.isArray(r)
      && r.every((e) => compiled.some((v) => v(e) === true))
    );
  }
  assert(input instanceof Object);
  const compiled = Object.entries(input).map(([k, v]) => [k, compileValidation(v)]);
  return (r) => (
    r instanceof Object
    && !Array.isArray(r)
    && Object.keys(r).length === compiled.length
    && compiled.every(([k, v]) => v(r[k]) === true)
  );
};
module.exports = compileValidation;
