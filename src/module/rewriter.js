const assert = require('assert');
const objectFields = require('object-fields');
const compileMeta = require('./rewriter/compile-meta');
const mkInjectRewriter = require('./rewriter/mk-inject-rewriter');
const mkFilterRewriter = require('./rewriter/mk-filter-rewriter');
const mkSortRewriter = require('./rewriter/mk-sort-rewriter');

const init = (map, context) => {
  const result = {};
  Object.entries(map).forEach(([k, v]) => {
    result[k] = v.filter((p) => p.init === undefined || p.init({ context }) === true);
  });
  return result;
};

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
        injectMap, filterMap, sortMap, fieldsToRequest
      } = compileMeta(plugins, fields);

      if (!fieldsToRequest.every((f) => dataStoreFields.has(f))) {
        throw new Error(`Bad Field Requested: ${fieldsToRequest.filter((f) => !dataStoreFields.has(f))}`);
      }

      const injectRewriter = mkInjectRewriter(Object.keys(injectMap));
      const filterRewriter = mkFilterRewriter(Object.keys(filterMap));
      const sortRewriter = mkSortRewriter(Object.keys(sortMap));
      const retainResult = objectFields.Retainer(fields);

      const rewriteStart = (input, context) => {
        assert(context instanceof Object && !Array.isArray(context));
        const { promises } = injectRewriter(input, {
          context,
          injectMap: init(injectMap, context),
          promises: []
        });
        return promises;
      };
      const rewriteEnd = (input, context) => {
        filterRewriter(input, {
          context,
          filterMap: init(filterMap, context)
        });
        sortRewriter(input, {
          context,
          sortMap: init(sortMap, context),
          lookups: []
        });
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
