import * as plugins from './module/plugin.js';
import rew from './module/rewriter.js';

export const injectPlugin = plugins.injectPlugin;
export const filterPlugin = plugins.filterPlugin;
export const sortPlugin = plugins.sortPlugin;
export const rewriter = rew;
