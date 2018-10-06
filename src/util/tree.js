const LEAF = Symbol("leaf");

const markLeaf = input => Object.defineProperty(input, LEAF, { value: true, writable: false });
const isLeaf = input => input[LEAF] === true;

const build = (needles) => {
  const result = {};
  needles.forEach((branch) => {
    let ele = result;
    branch.forEach((seg) => {
      if (ele[seg] === undefined) {
        ele[seg] = {};
      }
      ele = ele[seg];
    });
    markLeaf(ele);
  });
  return result;
};

const pruneRec = (input, retain, exclude) => {
  const isArray = Array.isArray(input);
  const inputEntries = Object.entries(input);
  if (isArray) {
    // sort inverse so array delete matches correct index
    inputEntries.sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10));
  }
  inputEntries.forEach(([key, value]) => {
    if (
      (exclude[key] !== undefined && isLeaf(exclude[key]))
      || (retain[key] === undefined)
    ) {
      if (isArray) {
        input.splice(key, 1);
      } else {
        // eslint-disable-next-line no-param-reassign
        delete input[key];
      }
    } else {
      pruneRec(value, retain[key], exclude[key] || {});
    }
  });
};

module.exports.prune = (input, retain, exclude) => {
  pruneRec(input, build(retain), build(exclude));
};
