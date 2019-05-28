const assert = require('assert');
const { filterPlugin, injectPlugin, sortPlugin } = require('./util/plugin');
const rewriter = require('./util/rewriter');

const plugins = {};
const rewriters = {};

module.exports = {
  filterPlugin,
  injectPlugin,
  sortPlugin,
  registerPlugin: (name, code) => {
    assert(plugins[name] === undefined, 'Plugin Already Registered.');
    plugins[name] = code;
  },
  rewriter,
  registerRewriter: (name, code) => {
    assert(rewriters[name] === undefined, 'Rewriter Already Registered.');
    rewriters[name] = code;
  }
};
