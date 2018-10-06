[![Build Status](https://circleci.com/gh/blackflux/object-rewrite.png?style=shield)](https://circleci.com/gh/blackflux/object-rewrite)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/object-rewrite/master.svg)](https://coveralls.io/github/blackflux/object-rewrite?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/object-rewrite)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/object-rewrite/status.svg)](https://david-dm.org/blackflux/object-rewrite)
[![NPM](https://img.shields.io/npm/v/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Downloads](https://img.shields.io/npm/dt/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

# object-rewrite

Rewrite an Object by defining exactly what gets excluded, injected and retained.

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
  active: true,
  tags: [{ id: 1 }, { id: 2 }, { id: 3 }]
}, {
  guid: "4409fb72-36e3-4385-b3da-b4944d028dcb",
  count: 4,
  active: true,
  tags: [{ id: 2 }, { id: 3 }, { id: 4 }]
}, {
  guid: "96067a3c-caa2-4018-bcec-6969a874dad9",
  count: 5,
  active: false,
  tags: [{ id: 3 }, { id: 4 }, { id: 5 }]
}];

const rewriter = objectRewrite({
  exclude: {
    "": (key, value, parents) => value.active !== true,
    tags: (key, value, parents) => value.id !== 4
  },
  inject: {
    "": (key, value, parents) => ({ count: value.count + 100 })
  },
  retain: ["count", "active", "tags.id"]
});

rewriter(data);

// => data is now modified
/*
[{
  "count": 103,
  "active": true,
  "tags": []
}, {
  "count": 104,
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

### Exclude

Takes object where keys are needles and values are functions. The matches for a needle are removed from the object iff the corresponding function execution returns true.

### Inject

Takes object where keys are needles and values are functions. For every match the corresponding function is executed and the result merged into the match. The match and the function response are expected to be objects.

### Retain

Array of needles. Matches are kept if not excluded previously. All entries not matched are excluded.
