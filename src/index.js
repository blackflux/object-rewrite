const objectScan = require('object-scan');
const tree = require('./util/tree');

module.exports = ({
  filter = {},
  inject = {},
  overwrite = {},
  retain = ['**'],
  retainEmptyParents = true
}) => {
  const scannerInjectAndOverwrite = objectScan(Object.keys(inject).concat(Object.keys(overwrite)), {
    useArraySelector: false,
    joined: false,
    callbackFn: (key, value, { isMatch, matchedBy, parents }) => {
      matchedBy.sort();
      matchedBy.forEach((n) => {
        if (inject[n] !== undefined) {
          Object.assign(value, inject[n](key, value, parents));
        }
      });
      matchedBy.forEach((n) => {
        if (overwrite[n] !== undefined) {
          const lastStringIndex = key.reduce((p, c, idx) => (typeof c === 'string' ? idx : p), 0);
          const directParent = key.slice(lastStringIndex, -1).reduce((p, c) => p[c], parents[0]);
          // eslint-disable-next-line no-param-reassign
          directParent[key.slice(-1)[0]] = overwrite[n](key, directParent[key.slice(-1)[0]], parents);
        }
      });
    }
  });

  const toRemove = [];
  const toRetain = [];
  const scannerRemoveAndRetain = objectScan(Object.keys(filter).concat(retain), {
    useArraySelector: false,
    joined: false,
    breakFn: (key, value, {
      isMatch, matchedBy, traversedBy, parents
    }) => {
      // mark as removed if:
      // - not targeting array and
      // - it's filtered
      if (
        !Array.isArray(value)
        && matchedBy.some(n => filter[n] !== undefined && filter[n](key, value, parents) === false)
      ) {
        toRemove.push(key);
        return true;
      }
      // mark as retained if:
      // - targeted by retain or
      // - targeting array, we retain empty parents, and traversed by a retain
      if (
        matchedBy.some(n => retain.includes(n))
        || (
          Array.isArray(value)
          && retainEmptyParents === true
          && traversedBy.some(n => retain.includes(n))
        )
      ) {
        toRetain.push(key);
      }
      return false;
    }
  });

  return (input) => {
    scannerInjectAndOverwrite(input);
    scannerRemoveAndRetain(input);
    tree.prune(input, toRemove, toRetain);
    toRemove.length = 0;
    toRetain.length = 0;
  };
};
