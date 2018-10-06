const LEAF = Symbol("leaf");

const markLeaf = input => Object
  .defineProperty(input, LEAF, { value: true, writable: false });
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

const pruneKey = (input, key, isArray) => {
  if (isArray) {
    input.splice(key, 1);
  } else {
    // eslint-disable-next-line no-param-reassign
    delete input[key];
  }
};

// prune either all needles or all not needles
const pruneRec = (input, tree, pruneNeedles) => {
  const isArray = Array.isArray(input);
  const iterable = pruneNeedles ? Object.entries(tree) : Object.entries(input);
  if (isArray) {
    // sort inverse so delete matches correctly
    iterable.sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10));
  }
  if (pruneNeedles) {
    iterable.forEach(([key, value]) => {
      if (input[key] !== undefined) {
        if (isLeaf(value)) {
          pruneKey(input, key, isArray);
        } else {
          pruneRec(input[key], value, pruneNeedles);
        }
      }
    });
  } else {
    iterable.forEach(([key, value]) => {
      if (tree[key] === undefined) {
        pruneKey(input, key, isArray);
      } else {
        pruneRec(value, tree[key], pruneNeedles);
      }
    });
  }
};

module.exports.prune = (input, needles, pruneNeedles) => {
  pruneRec(input, build(needles), pruneNeedles);
};
