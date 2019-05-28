const assert = require('assert');
const plugin = require('./util/plugin');

const plugins = {};

module.exports = {
  filterPlugin: plugin.filter,
  injectPlugin: plugin.inject,
  sortPlugin: plugin.sort,
  register: (pluginName, pluginCode) => {
    assert(plugins[pluginName] === undefined);
    plugins[pluginName] = pluginCode;
  }
};
