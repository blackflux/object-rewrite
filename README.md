[![Build Status](https://circleci.com/gh/blackflux/object-rewrite.png?style=shield)](https://circleci.com/gh/blackflux/object-rewrite)
[![Test Coverage](https://img.shields.io/coveralls/blackflux/object-rewrite/master.svg)](https://coveralls.io/github/blackflux/object-rewrite?branch=master)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=blackflux/object-rewrite)](https://dependabot.com)
[![Dependencies](https://david-dm.org/blackflux/object-rewrite/status.svg)](https://david-dm.org/blackflux/object-rewrite)
[![NPM](https://img.shields.io/npm/v/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Downloads](https://img.shields.io/npm/dt/object-rewrite.svg)](https://www.npmjs.com/package/object-rewrite)
[![Semantic-Release](https://github.com/blackflux/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/blackflux/js-gardener/blob/master/assets/badge.svg)](https://github.com/blackflux/js-gardener)

# object-rewrite

Rewrite an Object by defining exactly what gets excluded, rewritten and included.

## Install

```bash
npm i --save object-rewrite
```

## Getting Started

Modify the data object in place. If you need to create a copy consider using [_.deepClone()](https://lodash.com/docs/#cloneDeep).

<!-- eslint-disable-next-line import/no-unresolved -->
```js
const objectRewrite = require("object-rewrite");

const data = {/* ... */};

const rewriter = objectRewrite({
  exclude: {/* ... */},
  inject: {/* ... */},
  include: [/* ... */]
});

rewriter(data);
// => data is now modified
```

## Modifiers

Needles are specified according to [object-scan](https://github.com/blackflux/object-scan).

Internally the option `useArraySelector` is set to false.

Functions have signature `Fn(key, value, parents)` as specified by *object-scan*. Keys are split (`joined = false`),

### Exclude

Takes object where keys are needles and values are functions. The matches for a needle are excluded from the rewritten object iff the function returns true.

### Inject

Takes object where keys are needles and values are functions. The result of the function is merged into every match for the needle. Both, the match and the function response, are expected to be objects.

### Include

Array of all fields that are included in the modified object. All entries not matched are excluded.
