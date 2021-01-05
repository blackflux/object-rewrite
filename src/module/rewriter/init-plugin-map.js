module.exports = (map, context, logger) => {
  const result = {};
  const plugins = new Map();
  Object.entries(map).forEach(([prefix, pls]) => {
    result[prefix] = pls.filter((pl) => {
      if (!plugins.has(pl.self)) {
        const validContext = pl.self.contextSchema(context);
        if (!validContext) {
          logger.warn(`object-rewrite: Context validation failure\n${JSON.stringify(pl.self.options)}`);
          plugins.set(pl.self, false);
        } else {
          plugins.set(pl.self, pl.self.init(context));
        }
      }
      return plugins.get(pl.self) === true;
    });
  });
  return result;
};
