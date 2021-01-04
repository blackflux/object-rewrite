const objectScan = require('object-scan');

module.exports = (filterCbs) => objectScan(Object.keys(filterCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, property, parent, matchedBy, context
  }) => {
    const result = matchedBy.some((m) => filterCbs[m].fn({
      key, value, parents, context: context.context
    }) === true);
    if (result === false) {
      if (Array.isArray(parent)) {
        parent.splice(property, 1);
      } else {
        // eslint-disable-next-line no-param-reassign
        delete parent[property];
      }
    }
    return result;
  }
});
