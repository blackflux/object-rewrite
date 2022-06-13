import assert from '../../util/assert.js';

const validationCompile = (input, strict = true) => {
  if (typeof input === 'function') {
    return input;
  }
  if (Array.isArray(input)) {
    const compiled = input.map((v) => validationCompile(v, strict));
    return (r) => (
      Array.isArray(r)
      && r.every((e) => compiled.some((v) => v(e) === true))
    );
  }
  assert(input instanceof Object);
  const compiled = Object.entries(input).map(([k, v]) => [k, validationCompile(v, strict)]);
  return (r) => (
    r instanceof Object
    && !Array.isArray(r)
    && (strict === false || Object.keys(r).length === compiled.length)
    && compiled.every(([k, v]) => v(r[k]) === true)
  );
};
export default validationCompile;
