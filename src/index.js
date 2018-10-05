const objectScan = require("object-scan");

module.exports = ({ exclude = {} }) => {
  const scanner = objectScan(Object.keys(exclude), {
    useArraySelector: false,
    joined: false,
    breakFn: (key, value, { isMatch, needle, parents }) => {
      if (isMatch && exclude[needle](key, value, parents) === true) {
        // make sure we get the direct parent accounting for arrays
        const parent = key
          .slice(key.reduce((p, c, i) => (typeof c === "number" ? p : i), 0), -1)
          .reduce((p, c) => p[c], parents[parents.length - 1]);
        if (Array.isArray(parent)) {
          parent.splice(key[key.length - 1], 1);
        } else {
          // eslint-disable-next-line no-param-reassign
          delete parent[key[key.length - 1]];
        }
        return true;
      }
      return false;
    }
  });

  return {
    rewrite: input => scanner(input)
  };
};
