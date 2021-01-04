module.exports = (map, context) => {
  const result = {};
  Object.entries(map).forEach(([k, v]) => {
    result[k] = v.filter((p) => p.init(context) === true);
  });
  return result;
};
