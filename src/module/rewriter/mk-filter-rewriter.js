import objectScan from 'object-scan';
import assert from '../../util/assert.js';
import CompareFn from './compare-fn.js';

export default (keys) => objectScan(keys, {
  useArraySelector: false,
  compareFn: CompareFn(keys),
  filterFn: ({
    matchedBy, getKey, getValue, getParents, context
  }) => {
    assert(matchedBy.length === 1);
    const plugins = context.filterMap[matchedBy[0]];
    if (plugins.length === 0) {
      return true;
    }

    const key = getKey();
    const value = getValue();
    const parents = getParents();
    const kwargs = {
      key,
      value,
      parents
    };
    const result = plugins.every((plugin) => plugin.fn(kwargs)) === true;
    if (result === false) {
      if (Array.isArray(parents[0])) {
        parents[0].splice(key[key.length - 1], 1);
      } else {
        delete parents[0][key[key.length - 1]];
      }
    }
    return result;
  }
});
