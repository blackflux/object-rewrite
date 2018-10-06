const assert = require("assert");
const objectScan = require("object-scan");
const tree = require("./util/tree");

module.exports = ({ exclude = {}, inject = {}, include = ["**"] }) => {
  const needles = [
    ...Object.keys(exclude),
    ...Object.keys(inject),
    ...include
  ];

  const included = [];
  const excluded = [];

  const scanner = objectScan(needles, {
    useArraySelector: false,
    joined: false,
    callbackFn: (key, value, { isMatch, needle, parents }) => {
      assert(isMatch === true);
      if (include.includes(needle)) {
        included.push(key);
      }
      if (exclude[needle] !== undefined && exclude[needle](key, value, parents) === true) {
        excluded.push(key);
      }
      if (inject[needle] !== undefined) {
        Object.assign(value, inject[needle](key, value, parents));
      }
    }
  });

  return (input) => {
    scanner(input);
    tree.prune(input, included, excluded);
    included.length = 0;
    excluded.length = 0;
  };
};
