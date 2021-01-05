module.exports = (map, context) => {
  const result = {};
  const plugins = new Map();
  Object.entries(map).forEach(([prefix, pls]) => {
    result[prefix] = pls.filter((pl) => {
      if (!plugins.has(pl.self)) {
        plugins.set(pl.self, pl.self.init(context));
      }
      return plugins.get(pl.self) === true;
    });
  });
  return result;
};
