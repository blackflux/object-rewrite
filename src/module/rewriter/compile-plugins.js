const assert = require('assert');
const set = require('lodash.set');

module.exports = (type, plugins) => (kwargs) => {
  switch (type) {
    case 'INJECT':
      return plugins.reduce((promises, plugin) => {
        const exec = (r) => {
          assert(plugin.schema(r) === true);
          if (plugin.targetRel === '*') {
            Object.assign(kwargs.value, r);
          } else {
            set(kwargs.value, plugin.targetRel, r);
          }
        };
        const result = plugin.fn(kwargs);
        if (result instanceof Promise) {
          promises.push(async () => exec(await result));
        } else {
          exec(result);
        }
        return promises;
      }, []);
    case 'FILTER':
      return plugins.every((plugin) => plugin.fn(kwargs));
    case 'SORT':
    default:
      return plugins.map((plugin) => plugin.fn(kwargs));
  }
};
