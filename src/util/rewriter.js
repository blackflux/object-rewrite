const assert = require('assert');
const objectScan = require('object-scan');
const objectFields = require('object-fields');
const sortFn = require('../util/sort-fn');
const { pluginTypes } = require('./plugin');

const defineProperty = (target, k, v) => Object.defineProperty(target, k, { value: v, writable: false });
const SORT_VALUE = Symbol('sortValue');
const setSortValue = (input, value) => defineProperty(input, SORT_VALUE, value);
const getSortValue = input => input[SORT_VALUE];

const compileTargetToCallback = (type, plugins) => {
  assert(plugins.every(p => p.type === type));

  const targetToPlugins = plugins
    .reduce((prev, plugin) => {
      const target = plugin.target.endsWith('.') ? plugin.target.slice(0, -1) : plugin.target;
      const key = type === 'INJECT' ? target.split('.').slice(0, -1).join('.') : target;
      if (prev[key] === undefined) {
        Object.assign(prev, { [key]: [] });
      }
      prev[key].push(plugin);
      return prev;
    }, {});

  return Object
    .entries(targetToPlugins)
    .reduce((prev, [target, ps]) => Object.assign(prev, {
      [target]: (key, value, parents, context) => {
        const args = {
          key, value, parents, context
        };
        switch (type) {
          case 'INJECT':
            ps.forEach(p => Object.assign(value, { [p.target.split('.').pop()]: p.fn(args) }));
            return value;
          case 'FILTER':
            return ps.every(p => p.fn(args));
          case 'SORT':
          default:
            assert(ps.length === 1, 'Only one sort plugin per target allowed!');
            return ps[0].fn(args);
        }
      }
    }), {});
};

const compileMeta = (plugins, fields) => {
  const pluginsByType = pluginTypes.reduce((p, c) => Object.assign(p, { [c]: [] }), {});

  const inactivePlugins = [...plugins];
  const requiredFields = [...fields];
  const ignoredFields = new Set();

  for (let i = 0; i < requiredFields.length; i += 1) {
    const field = requiredFields[i];
    for (let j = 0; j < inactivePlugins.length; j += 1) {
      const plugin = inactivePlugins[j];
      if (
        field === plugin.target
        || (plugin.type !== 'INJECT' && field.startsWith(plugin.target))
      ) {
        requiredFields.push(...plugin.requires);
        inactivePlugins.splice(j, 1);
        j -= 1;
        pluginsByType[plugin.type].push(plugin);
        if (plugin.type === 'INJECT' && !plugin.requires.includes(plugin.target)) {
          ignoredFields.add(plugin.target);
        }
      }
    }
  }

  return Object.entries(pluginsByType).reduce((p, [type, ps]) => Object.assign(p, {
    [`${type.toLowerCase()}Cbs`]: compileTargetToCallback(type, ps)
  }), {
    toRequest: [...new Set(requiredFields)].filter(e => !ignoredFields.has(e))
  });
};

module.exports = (pluginMap) => {
  const plugins = Object.entries(pluginMap).reduce((prev, [prefix, ps]) => {
    prev.push(...ps.map(p => p(prefix)));
    return prev;
  }, []);

  return (fields) => {
    assert(Array.isArray(fields));

    const {
      injectCbs,
      filterCbs,
      sortCbs,
      toRequest
    } = compileMeta(plugins, fields);

    const injectRewriter = (input, context) => objectScan(Object.keys(injectCbs), {
      useArraySelector: false,
      joined: false,
      filterFn: (key, value, { matchedBy, parents }) => {
        matchedBy.forEach((m) => {
          Object.assign(value, injectCbs[m](key, value, parents, context));
        });
        return true;
      }
    })(input);
    const filterRewriter = (input, context) => objectScan(Object.keys(filterCbs), {
      useArraySelector: false,
      joined: false,
      filterFn: (key, value, { matchedBy, parents }) => {
        const result = matchedBy.some(m => filterCbs[m](key, value, parents, context) === true);
        if (result === false) {
          const parent = key.length === 1 ? input : parents[0];
          if (Array.isArray(parent)) {
            parent.splice(key[key.length - 1], 1);
          } else {
            delete parent[key[key.length - 1]];
          }
        }
        return result;
      }
    })(input);
    const sortRewriter = (input, context) => objectScan(Object.keys(sortCbs), {
      useArraySelector: false,
      joined: false,
      filterFn: (key, value, { matchedBy, parents }) => {
        assert(Array.isArray(parents[0]), 'Sort must be on "Array" type.');
        assert(matchedBy.length === 1, 'Only one sort plugin per target allowed!');
        setSortValue(value, sortCbs[matchedBy[0]](key, value, parents, context));
        if (key[key.length - 1] === 0) {
          parents[0].sort((a, b) => sortFn(getSortValue(a), getSortValue(b)));
        }
        return true;
      }
    })(input);

    return {
      toRequest,
      rewrite: (input, context = {}) => {
        assert(context instanceof Object && !Array.isArray(context));
        injectRewriter(input, context);
        filterRewriter(input, context);
        sortRewriter(input, context);
        objectFields.retain(input, fields);
      }
    };
  };
};
