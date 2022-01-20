# object-rewrite

[![Build Status](https://circleci.com/gh/blackflux/object-rewrite.png?style=shield)](https://circleci.com/gh/blackflux/object-rewrite)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/object-rewrite/master.svg)](https://coveralls.io/github/blackflux/object-rewrite?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/object-rewrite)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/object-rewrite/status.svg)](https://david-dm.org/blackflux/object-rewrite)
[![NPM](https://img.shields.io/npm/v/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Downloads](https://img.shields.io/npm/dt/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

Rewrite Object(s) in place using plugins.

This library is used for doing complex in-memory modifications of data. It allows to define use cases
in a dynamic way that allows for powerful abstraction.

## Install

```bash
npm i --save object-rewrite
```

## Getting Started

<!-- eslint-disable import/no-unresolved, import/no-extraneous-dependencies -->
```js
const {
  injectPlugin,
  filterPlugin,
  sortPlugin,
  rewriter
} = require('object-rewrite');

const queryDataStore = (fields) => { /* ... */ };

const inject = injectPlugin({
  target: 'idNeg',
  requires: ['id'],
  fn: ({ value }) => -value.id
});
const filter = filterPlugin({
  target: '*',
  requires: ['idNeg'],
  fn: ({ value }) => [-2, -1].includes(value.idNeg)
});
const sort = sortPlugin({
  target: '*',
  requires: ['idNeg'],
  fn: ({ value }) => value.idNeg
});
const rew = rewriter({ '': [inject, filter, sort] }, ['id']);

const desiredFields = ['id'];
const rewInstance = rew.init(desiredFields, {/* init context */});

const data = queryDataStore(rewInstance.fieldsToRequest);
// data => [{ id: 0 }, { id: 1 }, { id: 2 }]

rewInstance.rewrite(data);
// data => [{ id: 2 }, { id: 1 }]
```

Please see the tests for more in-depth examples on how to use this library.

## Plugins

There are three types of plugins `INJECT`, `FILTER` and `SORT`.

All plugins define:

- `target` _String_: target field relative to the plugin path.
- `required` _Array_: required fields relative to the plugin path. Can specify relative to root by prefixing with `/`. Will influence `fieldsToRequest`. Can be specified as function that takes `initContext` and expected to return array.
- `fn` _Function_: result of this function is used by the plugin. Signature is `fn({ key, value, parents, context, cache })`.
- `onInit({ context, cache })` _Function_ (optional): if present called once per init, used to initialize cache, if returns other than `true`, the plugin is disabled
- `onRewrite({ data, context, cache })` _Function_ (optional): if present called once per rewrite, used to update cache, if returns other than `true`, the plugin is disabled
- `contextSchema`: Object schema structure of form `{ init: {}, rewrite: {} }` of what is expected to be present in corresponding `context` (subset)
- `valueSchema` (optional): Used to validate value before passed into `fn`

where:
- `key`: is the key for the processed entity
- `value` is the value of the processed entity
- `parents` are the parents of the processed entity
- `context` is global as passed into the execution
- `cache = {}` is locally defined per plugin

### Inject Plugin

Used to inject data

- `target`: field that is created or overwritten, can be `'*'`
- `requires`: See above
- `fn`: return value is used for target. Relative to prefix
- `fnSchema`: Object schema structure of what is being injected (strict result of `fn`)

### Filter Plugin

Used to filter arrays

- `target`: array that should be filtered
- `required`: See above
- `fn`: target is removed iff function returns `false`. Similar to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter). Relative to target

### Sort Plugin

Used to sort arrays

- `target`: array that should be sorted
- `required`: See above
- `fn`: called for each object in array. Final array is sorted using the result. Relative to target
- `limit`: optional limit function that takes the `context` object as a kwarg and is expected to return a non-negative integer or undefined. If multiple sort plugins are defined, the smallest limit is used. If the limit function returns undefined it is ignored. If set, after sorting only the first `limit` entries are returned.

Only one sort plugin can be specified per target.

Allows for complex sort comparisons and uses `cmp-fn.js` under the hood (see source code).

## `rewriter(pluginMap: Object, dataStoreFields: Array)`

Used to combine multiple plugins. Plugins can be re-used in different rewriters. Rewriters are then
used to modify input data.

Constructor takes in an object that maps absolute paths to plugins and the available `dataStoreFields`.
Could for example re-use a plugin as

<!-- eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies -->
```js
const { injectPlugin, rewriter } = require('object-rewrite');

const plugin = injectPlugin(/* ... */);

rewriter({
  '': [plugin],
  nodes: [plugin]
}, [/* data store fields */]);
```

### `allowedFields: Array`

Fields that are allowed to be requested.

### `init(fields: Array)`

Initialize the rewriter for a specific set of fields.

#### `fieldsToRequest`

Exposes fields which should be requested from data store. Dynamically computed fields are excluded since they
would not be present in the data store.

#### `rewrite(data: Object/Array, context: Object = {})`

Pass in object that should be rewritten. The context allows for additional data to be made available for all plugins.

## Notes

### Dynamic Keys

Under the hood this library uses [object-scan](https://github.com/blackflux/object-scan).
Please refer to the docs for what key pattern are supported.

### Execution Order

Plugins are executed in the order `INJECT`, `FILTER` and then `SORT`.

Plugins within the same type are evaluated bottom-up. While this is less performant,
it allows plugins to rely on previous executed plugins of the same type.

Plugins of the same type that operate on the same target are executed in order.

### Async

To apply an async rewrite, please use

> rewInstance.rewriteAsync(data);

Only plugin that can use an async `fn` in an Inject plugin.
An async result is evaluated after all inject plugins have run,
and hence can only be used in filter and sort plugins, but not in other inject plugins.
