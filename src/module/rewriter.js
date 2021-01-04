const assert = require('assert');
const objectFields = require('object-fields');
const compileMeta = require('./rewriter/compile-meta');
const mkInjectRewriter = require('./rewriter/mk-inject-rewriter');
const mkFilterRewriter = require('./rewriter/mk-filter-rewriter');
const mkSortRewriter = require('./rewriter/mk-sort-rewriter');

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
        injectCbs, filterCbs, sortCbs, fieldsToRequest
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
        filterRewriter(input, { context });
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
