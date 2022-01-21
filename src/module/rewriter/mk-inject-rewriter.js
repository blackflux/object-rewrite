import assert from 'assert';
import objectScan from 'object-scan';
import set from 'lodash.set';
import CompareFn from './compare-fn';

export default (keys) => objectScan(keys, {
  useArraySelector: false,
  compareFn: CompareFn(keys),
  filterFn: ({
    matchedBy, getKey, getValue, getParents, context
  }) => {
    assert(matchedBy.length === 1);
    const plugins = context.injectMap[matchedBy[0]];
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
    const promises = [];
    plugins.forEach((plugin) => {
      const exec = (r) => {
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
    });
    context.promises.push(...promises);
    return true;
  }
});
