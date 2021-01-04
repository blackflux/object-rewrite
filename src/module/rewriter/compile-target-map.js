module.exports = (type, plugins) => {
  const result = {};
  for (let i = 0; i < plugins.length; i += 1) {
    const plugin = plugins[i];
    const key = plugin.targetNormalized;
    if (!(key in result)) {
      result[key] = [];
    }
    let insertIdx = result[key].length;
    for (let idx = 0; idx < result[key].length; idx += 1) {
      if (result[key][idx].requires.includes(plugin.target)) {
        insertIdx = idx;
        break;
      }
    }
    result[key].splice(insertIdx, 0, plugin);
  }
  return result;
};
