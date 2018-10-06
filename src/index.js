const objectScan = require("object-scan");
const tree = require("./util/tree");

module.exports = ({ exclude = {}, inject = {}, include = ["**"] }) => {
  const needles = [
    ...Object.keys(exclude),
    ...Object.keys(inject),
    ...include
  ];

  const excluded = [];
  const included = [];

  const scanner = objectScan(needles, {
    useArraySelector: false,
    joined: false,
    breakFn: (key, value, { isMatch, needle, parents }) => {
      if (isMatch && exclude[needle] !== undefined && exclude[needle](key, value, parents) === true) {
        excluded.push(key);
        return true;
      }
      return false;
    },
    callbackFn: (key, value, { isMatch, needle, parents }) => {
      if (isMatch && include.includes(needle)) {
        included.push(key);
      }
      if (isMatch && inject[needle] !== undefined) {
        Object.assign(value, inject[needle](key, value, parents));
      }
    }
  });

  return (input) => {
    scanner(input);

    tree.prune(input, included, excluded);

    excluded.length = 0;
    included.length = 0;
  };
};
