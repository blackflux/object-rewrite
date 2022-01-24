import assert from 'assert';

const fn = (a, b) => {
  if (Array.isArray(a)) {
    assert(Array.isArray(b));
    assert(a.length === b.length);
    for (let idx = 0; idx < a.length; idx += 1) {
      const sign = fn(a[idx], b[idx]);
      if (sign !== 0) {
        return sign;
      }
    }
    return 0;
  }
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};
export default fn;
