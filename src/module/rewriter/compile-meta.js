const compileTargetMap = require('./compile-target-map');

// todo: write separate test
module.exports = (plugins, fields) => {
  const pluginsByType = {
    FILTER: [],
    INJECT: [],
    SORT: []
  };

  const requiredFields = new Set(fields);
  requiredFields.forEach((field) => {
    plugins.forEach((plugin) => {
      if (
        plugin.targets.includes(field)
        || (
          (plugin.type !== 'INJECT' || plugin.targetRel === '*')
          && (`${field}.` === plugin.target || field.startsWith(plugin.target))
        )
      ) {
        plugin.requires.forEach((f) => requiredFields.add(f));
        pluginsByType[plugin.type].push(plugin);
      }
    });
  });

  const injectedFields = new Set();
  pluginsByType.INJECT
    .forEach((p) => {
      p.targets
        .filter((target) => !p.requires.includes(target))
        .forEach((t) => injectedFields.add(t));
    });

  return {
    filterCbs: compileTargetMap('FILTER', pluginsByType.FILTER),
    injectCbs: compileTargetMap('INJECT', pluginsByType.INJECT),
    sortCbs: compileTargetMap('SORT', pluginsByType.SORT),
    fieldsToRequest: [...requiredFields].filter((e) => !injectedFields.has(e))
  };
};
