[![Build Status](https://circleci.com/gh/blackflux/object-rewrite.png?style=shield)](https://circleci.com/gh/blackflux/object-rewrite)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/object-rewrite/master.svg)](https://coveralls.io/github/blackflux/object-rewrite?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/object-rewrite)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/object-rewrite/status.svg)](https://david-dm.org/blackflux/object-rewrite)
[![NPM](https://img.shields.io/npm/v/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Downloads](https://img.shields.io/npm/dt/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

# object-rewrite

Rewrite an Object by defining exactly what gets filtered, injected and retained.

## Install

```bash
npm i --save object-rewrite
```

## Getting Started

Modifies the data object in place. If you need to create a copy consider using [_.deepClone()](https://lodash.com/docs/#cloneDeep).

<!-- eslint-disable-next-line import/no-unresolved -->
```js
const objectRewrite = require("object-rewrite");

const data = [{
  guid: "aad8b948-a3de-4bff-a50f-3d59e9510aa9",
  count: 3,
  active: "yes",
  tags: [{ id: 1 }, { id: 2 }, { id: 3 }]
}, {
  guid: "4409fb72-36e3-4385-b3da-b4944d028dcb",
  count: 4,
  active: "yes",
  tags: [{ id: 2 }, { id: 3 }, { id: 4 }]
}, {
  guid: "96067a3c-caa2-4018-bcec-6969a874dad9",
  count: 5,
  active: "no",
  tags: [{ id: 3 }, { id: 4 }, { id: 5 }]
}];

const rewriter = objectRewrite({
  filter: {
    "": (key, value, parents) => value.active === "yes",
    tags: (key, value, parents) => value.id === 4
  },
  inject: {
    "": (key, value, parents) => ({ countNext: value.count + 1 })
  },
  overwrite: {
    active: (key, value) => value === "yes"
  },
  retain: ["count", "countNext", "active", "tags.id"]
});

rewriter(data);

// => data is now modified
/*
[{
  "count": 3,
  "countNext": 4,
  "active": true,
  "tags": []
}, {
  "count": 4,
  "countNext": 5,
  "active": true,
  "tags": [{"id": 4}]
}]
*/
```

The empty needle `""` matches top level object(s).  

## Modifiers

Needles are specified according to [object-scan](https://github.com/blackflux/object-scan).

Internally the option `useArraySelector` is set to false.

Functions have signature `Fn(key, value, parents)` as specified by *object-scan*. Keys are split (`joined` is false),

### Filter

Takes object where keys are needles and values are functions. The matches for a needle are removed from the object iff the corresponding function execution returns false.

### Inject

Takes object where keys are needles and values are functions. For every match the corresponding function is executed and the result merged into the match. The match and the function response are expected to be objects.

### Overwrite

Takes object where keys are needles and values are functions. For every match the corresponding function is executed and the result is assigned to the key.

### Retain

Array of needles. Matches are kept if not filtered previously. All entries not matched are removed. Defaults to `["**"]` which matches all entries.

## Options

### retainEmptyParents

Type: `boolean`<br>
Default: `true`

When `false`, empty "parents" are only retained when exactly matched by `retain` array entry. When `true`, empty parents are also retained if a `retain` array entry targets a "child".

## Deficiencies

Problems when different matchers are used between filter, inject, overwrite, retain that target the same elements.
E.g. using `**` for retain, but `*.field` for inject.
