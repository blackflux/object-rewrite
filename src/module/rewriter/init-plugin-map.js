export default (map, data, context, logger) => {
  const result = {};
  const activeLookup = new Map();
  Object.entries(map).forEach(([prefix, pls]) => {
    result[prefix] = pls.filter((pl) => {
      if (!activeLookup.has(pl.self)) {
        activeLookup.set(pl.self, pl.self.meta.onRewrite(data, context, logger));
      }
      return activeLookup.get(pl.self) === true;
    });
  });
  return result;
};
