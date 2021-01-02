const assert = require('assert');
const objectScan = require('object-scan');
const objectFields = require('object-fields');
const cmpFn = require('../util/cmp-fn');
const compileMeta = require('./rewriter/compile-meta');

const mkInjectRewriter = (injectCbs) => objectScan(Object.keys(injectCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    matchedBy.forEach((m) => {
      const promises = injectCbs[m].fn({
        key, value, parents, context: context.context
      });
      context.promises.push(...promises);
    });
    return true;
  }
});

const mkFilterRewriter = (filterCbs) => objectScan(Object.keys(filterCbs), {
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

const mkSortRewriter = (sortCbs) => objectScan(Object.keys(sortCbs), {
  useArraySelector: false,
  filterFn: ({
    key, value, parents, matchedBy, context
  }) => {
    assert(Array.isArray(parents[0]), 'Sort must be on "Array" type.');
    if (context.lookups[key.length - 1] === undefined) {
      context.lookups[key.length - 1] = new Map();
    }
    const lookup = context.lookups[key.length - 1];
    lookup.set(value, sortCbs[matchedBy[0]].fn({
      key, value, parents, context: context.context
    }));
    if (key[key.length - 1] === 0) {
      parents[0].sort((a, b) => cmpFn(lookup.get(a), lookup.get(b)));
      const limits = sortCbs[matchedBy[0]].plugins
        .filter((p) => p.limit !== undefined)
        .map((p) => p.limit({ context: context.context }))
        .filter((l) => l !== undefined);
      if (limits.length !== 0) {
        assert(limits.every((l) => Number.isInteger(l) && l >= 0));
        parents[0].splice(Math.min(...limits));
      }
      context.lookups.splice(key.length - 1);
    }
    return true;
  }
});

module.exports = (pluginMap, dataStoreFields_) => {
  assert(pluginMap instanceof Object && !Array.isArray(pluginMap));
  assert(Array.isArray(dataStoreFields_) && dataStoreFields_.every((e) => typeof e === 'string'));

  const plugins = Object.entries(pluginMap).reduce((prev, [prefix, ps]) => {
    ps.forEach((p) => prev.push(p(prefix)));
    return prev;
  }, []);
  const dataStoreFields = new Set(dataStoreFields_);
  const allowedFields = plugins
    .filter((p) => p.type === 'INJECT')
    .reduce((p, c) => {
      c.targets.forEach((t) => p.add(t));
      return p;
    }, new Set(dataStoreFields));

  return {
    allowedFields: [...allowedFields],
    init: (fields) => {
      assert(Array.isArray(fields));

      if (!fields.every((f) => allowedFields.has(f))) {
        throw new Error(`Bad field requested: ${fields.filter((f) => !allowedFields.has(f)).join(', ')}`);
      }

      const {
        injectCbs,
        filterCbs,
        sortCbs,
        fieldsToRequest
      } = compileMeta(plugins, fields);

      if (!fieldsToRequest.every((f) => dataStoreFields.has(f))) {
        throw new Error(`Bad Field Requested: ${fieldsToRequest.filter((f) => !dataStoreFields.has(f))}`);
      }

      const injectRewriter = mkInjectRewriter(injectCbs);
      const filterRewriter = mkFilterRewriter(filterCbs);
      const sortRewriter = mkSortRewriter(sortCbs);
      const retainResult = objectFields.Retainer(fields);

      const rewriteStart = (input, context) => {
        assert(context instanceof Object && !Array.isArray(context));
        const { promises } = injectRewriter(input, { context, promises: [] });
        return promises;
      };
      const rewriteEnd = (input, context) => {
        filterRewriter(input, { input, context });
        sortRewriter(input, { lookups: [], context });
        retainResult(input);
      };
      return {
        fieldsToRequest,
        rewrite: (input, context = {}) => {
          const promises = rewriteStart(input, context);
          assert(promises.length === 0, 'Please use rewriteAsync() for async logic');
          rewriteEnd(input, context);
        },
        rewriteAsync: async (input, context = {}) => {
          const promises = rewriteStart(input, context);
          await Promise.all(promises.map((p) => p()));
          rewriteEnd(input, context);
        }
      };
    }
  };
};
