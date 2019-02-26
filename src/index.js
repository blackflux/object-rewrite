const assert = require('assert');
const objectScan = require('object-scan');
const tree = require('./util/tree');

module.exports = ({
  filter = {},
  inject = {},
  overwrite = {},
  retain = ['**'],
  retainEmptyParents = true
}) => {
  const needles = [
    ...Object.keys(filter),
    ...Object.keys(inject),
    ...Object.keys(overwrite),
    ...retain
  ];

  const toRemove = [];
  const toRetain = [];

  const scanner = objectScan(needles, {
    useArraySelector: false,
    joined: false,
    callbackFn: (key, value, { isMatch, matchedBy, parents }) => {
      assert(isMatch === true);
      matchedBy.sort();
      if (matchedBy.some(n => filter[n] !== undefined && filter[n](key, value, parents) === false)) {
        toRemove.push(key);
      }
      if (matchedBy.some(n => retain.includes(n))) {
        toRetain.push(key);
      }
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
    },
    arrayCallbackFn: (key, value, { matchedBy }) => {
      if (matchedBy.some(n => retain.includes(n))) {
        toRetain.push(key);
      }
    },
    breakFn: (key, value, { traversedBy }) => {
      if (retainEmptyParents === true && traversedBy.some(n => retain.includes(n))) {
        toRetain.push(key);
      }
      return false;
    }
  });

  return (input) => {
    scanner(input);
    tree.prune(input, toRemove, toRetain);
    toRemove.length = 0;
    toRetain.length = 0;
  };
};
