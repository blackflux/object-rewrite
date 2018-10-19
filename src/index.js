const assert = require("assert");
const objectScan = require("object-scan");
const tree = require("./util/tree");

module.exports = ({
  filter = {},
  inject = {},
  overwrite = {},
  retain = ["**"]
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
    callbackFn: (key, value, { isMatch, needle, parents }) => {
      assert(isMatch === true);
      if (filter[needle] !== undefined && filter[needle](key, value, parents) === false) {
        toRemove.push(key);
      }
      if (retain.includes(needle)) {
        toRetain.push(key);
      }
      if (inject[needle] !== undefined) {
        Object.assign(value, inject[needle](key, value, parents));
      }
      if (overwrite[needle] !== undefined) {
        const lastStringIndex = key.reduce((p, c, idx) => (typeof c === "string" ? idx : p), 0);
        const directParent = key.slice(lastStringIndex, -1).reduce((p, c) => p[c], parents[0]);
        // eslint-disable-next-line no-param-reassign
        directParent[key.slice(-1)[0]] = overwrite[needle](key, value, parents);
      }
    },
    arrayCallbackFn: (key, value, { needle }) => {
      if (retain.includes(needle)) {
        toRetain.push(key);
      }
    }
  });

  return (input) => {
    scanner(input);
    tree.prune(input, toRemove, toRetain);
    toRemove.length = 0;
    toRetain.length = 0;
  };
};
