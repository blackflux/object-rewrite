import assert from 'assert';
import objectFields from 'object-fields';
import compileMeta from './rewriter/compile-meta.js';
import mkInjectRewriter from './rewriter/mk-inject-rewriter.js';
import mkFilterRewriter from './rewriter/mk-filter-rewriter.js';
import mkSortRewriter from './rewriter/mk-sort-rewriter.js';
import initPluginMap from './rewriter/init-plugin-map.js';

export default (pluginMap, dataStoreFields_, logger = console) => {
  assert(pluginMap instanceof Object && !Array.isArray(pluginMap));
  assert(Array.isArray(dataStoreFields_) && dataStoreFields_.every((e) => typeof e === 'string'));

  const pluginNames = {};
  const plugins = Object.entries(pluginMap).reduce((prev, [prefix, ps], prefixIndex) => {
    ps.forEach((p) => {
      if (p.meta.name in pluginNames && p !== pluginNames[p.meta.name]) {
        throw new Error(`Plugin name "${p.meta.name}" not unique`);
      }
      pluginNames[p.meta.name] = p;
      prev.push(p(prefix, prefixIndex));
    });
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
    init: (fields, initContext = {}) => {
      assert(Array.isArray(fields));

      if (!fields.every((f) => allowedFields.has(f))) {
        throw new Error(`Bad Field Requested: ${fields.filter((f) => !allowedFields.has(f)).join(', ')}`);
      }

      const {
        injectMap, filterMap, sortMap, fieldsToRequest, activePlugins
      } = compileMeta(plugins, fields, initContext, logger);

      if (!fieldsToRequest.every((f) => dataStoreFields.has(f))) {
        throw new Error(`Bad Field Requested: ${fieldsToRequest.filter((f) => !dataStoreFields.has(f))}`);
      }

      const injectRewriter = mkInjectRewriter(Object.keys(injectMap));
      const filterRewriter = mkFilterRewriter(Object.keys(filterMap));
      const sortRewriter = mkSortRewriter(Object.keys(sortMap));
      const retainResult = objectFields.Retainer(fields);

      const rewriteStart = (input, context) => {
        assert(context instanceof Object && !Array.isArray(context));
        const { promises, sync } = injectRewriter(input, {
          injectMap: initPluginMap(injectMap, input, context, logger),
          promises: [],
          sync: []
        });
        return { promises, sync };
      };
      const rewriteEnd = (input, context) => {
        filterRewriter(input, {
          filterMap: initPluginMap(filterMap, input, context, logger)
        });
        sortRewriter(input, {
          sortMap: initPluginMap(sortMap, input, context, logger),
          lookups: []
        });
        retainResult(input);
      };
      return {
        fieldsToRequest,
        activePlugins,
        rewrite: (input, context_ = {}) => {
          const context = { ...context_, ...initContext };
          const { sync, promises } = rewriteStart(input, context);
          assert(promises.length === 0, 'Please use rewriteAsync() for async logic');
          sync.map((f) => f());
          rewriteEnd(input, context);
        },
        rewriteAsync: async (input, context_ = {}) => {
          const context = { ...context_, ...initContext };
          const { sync, promises } = rewriteStart(input, context);
          await Promise.all(promises.map((p) => p()));
          sync.map((f) => f());
          rewriteEnd(input, context);
        }
      };
    }
  };
};
