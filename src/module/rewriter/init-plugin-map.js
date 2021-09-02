module.exports = (map, context, logger) => {
  const result = {};
  const plugins = new Map();
  Object.entries(map).forEach(([prefix, pls]) => {
    result[prefix] = pls.filter((pl) => {
      if (!plugins.has(pl.self)) {
        plugins.set(pl.self, pl.self.meta.active(context, logger));
      }
      return plugins.get(pl.self) === true;
    });
  });
  return result;
};
