import compileTargetMap from './compile-target-map.js';

// todo: write separate test
export default (plugins, fields, initContext, logger) => {
  const pluginsByType = {
    FILTER: [],
    INJECT: [],
    SORT: []
  };

  const activeLookup = new Map();

  const activePlugins = new Set();
  const inactivePlugins = [...plugins];
  const requiredFields = [...new Set(fields)];

  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    for (let j = 0; j < inactivePlugins.length; j += 1) {
      const plugin = inactivePlugins[j];
      if (!activeLookup.has(plugin.self)) {
        activeLookup.set(plugin.self, plugin.self.meta.onInit(initContext, logger));
      }
      if (
        activeLookup.get(plugin.self) === true
        && (
          plugin.targets.includes(field)
          || (
            (plugin.type !== 'INJECT' || plugin.targetRel === '*')
            && (`${field}.` === plugin.target || field.startsWith(plugin.target))
          )
        )
      ) {
        const requires = [...plugin.requires(initContext)];
        for (let x = requiredFields.length - 1; x >= 0; x -= 1) {
          const idx = requires.indexOf(requiredFields[x]);
          if (idx !== -1) {
            if (x > i) {
              requiredFields.splice(x, 1);
            } else {
              requires.splice(idx, 1);
            }
          }
        }
        requiredFields.splice(i + 1, 0, ...requires);
        pluginsByType[plugin.type].push(plugin);
        activePlugins.add(plugin.self.meta);
        inactivePlugins.splice(j, 1);
        j -= 1;
      }
    }
  }

  const injectedFields = new Set();
  pluginsByType.INJECT
    .forEach((p) => {
      p.targets
        .filter((target) => !p.requires(initContext).includes(target))
        .forEach((t) => injectedFields.add(t));
    });

  ['FILTER', 'INJECT', 'SORT'].forEach((f) => {
    pluginsByType[f].sort((a, b) => a.prefixIndex - b.prefixIndex);
  });

  return {
    filterMap: compileTargetMap('FILTER', pluginsByType.FILTER, initContext),
    injectMap: compileTargetMap('INJECT', pluginsByType.INJECT, initContext),
    sortMap: compileTargetMap('SORT', pluginsByType.SORT, initContext),
    fieldsToRequest: requiredFields.filter((e) => !injectedFields.has(e)),
    activePlugins: [...activePlugins]
  };
};
