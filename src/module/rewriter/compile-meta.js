const compileTargetMap = require('./compile-target-map');

// todo: write separate test
module.exports = (plugins, fields) => {
  const pluginsByType = {
    FILTER: [],
    INJECT: [],
    SORT: []
  };

  const inactivePlugins = [...plugins];
  const requiredFields = new Set(fields);

  requiredFields.forEach((field) => {
    for (let j = 0; j < inactivePlugins.length; j += 1) {
      const plugin = inactivePlugins[j];
      if (
        plugin.targets.includes(field)
        || (
          (plugin.type !== 'INJECT' || plugin.targetRel === '*')
          && (`${field}.` === plugin.target || field.startsWith(plugin.target))
        )
      ) {
        plugin.requires.forEach((f) => requiredFields.add(f));
        pluginsByType[plugin.type].push(plugin);
        inactivePlugins.splice(j, 1);
        j -= 1;
      }
    }
  });

  const injectedFields = new Set();
  pluginsByType.INJECT
    .forEach((p) => {
      p.targets
        .filter((target) => !p.requires.includes(target))
        .forEach((t) => injectedFields.add(t));
    });

  return {
    filterMap: compileTargetMap('FILTER', pluginsByType.FILTER),
    injectMap: compileTargetMap('INJECT', pluginsByType.INJECT),
    sortMap: compileTargetMap('SORT', pluginsByType.SORT),
    fieldsToRequest: [...requiredFields].filter((e) => !injectedFields.has(e))
  };
};
