export default (input) => {
  const result = input.filter((e) => !!e).join('.');
  if (result === '*') {
    return '';
  }
  if (result.endsWith('.*')) {
    return result.slice(0, -1);
  }
  return result;
};
