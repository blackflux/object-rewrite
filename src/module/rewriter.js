const assert = require('assert');
const set = require('lodash.set');
const objectScan = require('object-scan');
const objectFields = require('object-fields');
const cmpFn = require('../util/cmp-fn');
const getPluginTargetMap = require('./rewriter/get-plugin-target-map');

const getFn = (type, ps) => (key, value, parents, context) => {
  const args = {
    key, value, parents, context
  };
  switch (type) {
    case 'INJECT':
      return ps.reduce((promises, p) => {
        const exec = (r) => {
          assert(p.schema(r) === true);
          if (p.targetRel === '*') {
            Object.assign(value, r);
          } else {
            set(value, p.targetRel, r);
          }
        };
        const result = p.fn(args);
        if (result instanceof Promise) {
          promises.push(async () => exec(await result));
        } else {
          exec(result);
        }
        return promises;
      }, []);
    case 'FILTER':
      return ps.every((p) => p.fn(args));
    case 'SORT':
    default:
      return ps.map((p) => p.fn(args));
  }
};

const compileTargetToCallback = (type, plugins) => {
  assert(plugins.every((p) => p.type === type));

  const pluginTargetMap = getPluginTargetMap(plugins);

  return Object
    .entries(pluginTargetMap)
    .reduce((prev, [target, ps]) => Object.assign(prev, {
      [target]: {
        fn: getFn(type, ps),
        plugins: ps
      }
    }), {});
};

const compileMeta = (plugins, fields) => {
  const pluginsByType = {
    FILTER: [],
    INJECT: [],
    SORT: []
  };

  const inactivePlugins = [...plugins];
  const requiredFields = [...fields];
  const ignoredFields = new Set();

  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    for (let j = 0; j < inactivePlugins.length; j += 1) {
      const plugin = inactivePlugins[j];
      if (
        plugin.targets.includes(field)
        || (
          (plugin.type !== 'INJECT' || plugin.targetRel === '*')
          && (`${field}.` === plugin.target || field.startsWith(plugin.target))
        )) {
        requiredFields.push(...plugin.requires);
        inactivePlugins.splice(j, 1);
        j -= 1;
        pluginsByType[plugin.type].push(plugin);
        if (plugin.type === 'INJECT') {
          plugin.targets.forEach((target) => {
            if (!plugin.requires.includes(target)) {
              ignoredFields.add(target);
            }
          });
        }
      }
    }
  }

  return Object.entries(pluginsByType).reduce((p, [type, ps]) => Object.assign(p, {
    [`${type.toLowerCase()}Cbs`]: compileTargetToCallback(type, ps)
  }), {
    fieldsToRequest: [...new Set(requiredFields)].filter((e) => !ignoredFields.has(e))
  });
};

module.exports = (pluginMap, dataStoreFields) => {
  assert(pluginMap instanceof Object && !Array.isArray(pluginMap));
  assert(Array.isArray(dataStoreFields) && dataStoreFields.every((e) => typeof e === 'string'));

  const plugins = Object.entries(pluginMap).reduce((prev, [prefix, ps]) => {
    ps.forEach((p) => prev.push(p(prefix)));
    return prev;
  }, []);
  const allowedFields = [...plugins.reduce((p, c) => {
    if (c.type === 'INJECT') {
      c.targets.forEach((t) => p.add(t));
    }
    return p;
  }, new Set(dataStoreFields))];

  return {
    allowedFields,
    init: (fields) => {
      assert(Array.isArray(fields));

      if (!fields.every((f) => allowedFields.includes(f))) {
        throw new Error(`Bad field requested: ${fields.filter((f) => !allowedFields.includes(f)).join(', ')}`);
      }

      const {
        injectCbs,
        filterCbs,
        sortCbs,
        fieldsToRequest
      } = compileMeta(plugins, fields);

      assert(
        fieldsToRequest.every((f) => dataStoreFields.includes(f)),
        `Bad Field Requested: ${fieldsToRequest.filter((f) => !dataStoreFields.includes(f))}`
      );

      const injectRewriter = objectScan(Object.keys(injectCbs), {
        useArraySelector: false,
        joined: false,
        filterFn: ({
          key, value, parents, matchedBy, context
        }) => {
          matchedBy.forEach((m) => {
            const promises = injectCbs[m].fn(key, value, parents, context.context);
            context.promises.push(...promises);
          });
          return true;
        }
      });
      const filterRewriter = objectScan(Object.keys(filterCbs), {
        useArraySelector: false,
        joined: false,
        filterFn: ({
          key, value, parents, matchedBy, context
        }) => {
          const result = matchedBy.some((m) => filterCbs[m].fn(key, value, parents, context.context) === true);
          if (result === false) {
            const parent = key.length === 1 ? context.input : parents[0];
            if (Array.isArray(parent)) {
              parent.splice(key[key.length - 1], 1);
            } else {
              delete parent[key[key.length - 1]];
            }
          }
          return result;
        }
      });
      const sortRewriter = objectScan(Object.keys(sortCbs), {
        useArraySelector: false,
        joined: false,
        filterFn: ({
          key, value, parents, matchedBy, context
        }) => {
          assert(Array.isArray(parents[0]), 'Sort must be on "Array" type.');
          if (context.lookups[key.length - 1] === undefined) {
            context.lookups[key.length - 1] = new Map();
          }
          const lookup = context.lookups[key.length - 1];
          lookup.set(value, sortCbs[matchedBy[0]].fn(key, value, parents, context.context));
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
