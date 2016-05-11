# babel-plugin-transform-es2015-modules-simple-commonjs [![npm version](https://badge.fury.io/js/babel-plugin-transform-es2015-modules-simple-commonjs.svg)](https://badge.fury.io/js/babel-plugin-transform-es2015-modules-simple-commonjs)

Simple transformer for ECMAScript 2015 modules (CommonJS).

Converts this code:
```js
import x from '/path/to/x';
import y from '/path/to/y';
doSomething();
export default x + y;
```

Into this one:
```js
var x = require('/path/to/x');
var y = require('/path/to/y');
doSomething();
module.exports = x + y;
```

Instead of this one (generated with ``babel-plugin-transform-es2015-modules-commonjs``):
```js
Object.defineProperty(exports, "__esModule", {
  value: true
});

var _x = require('/path/to/x');

var _x2 = _interopRequireDefault(_x);

var _y = require('/path/to/y');

var _y2 = _interopRequireDefault(_y);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

doSomething();
exports.default = _x2.default + _y2.default;
```

This supports all standard es2015 import and export code with some caveats.

## Caveats

1. When exporting the final value is used, not the value when writing an export statement. It is not supported to mutate declarations that have been exported. You will not be warned, it will just not work.

2. You cannot export default and export a named item in the same file as `module.exports` assignment will conflict with the `exports` assignment. This transform will error if you attempt to do this.

3. If you mix default imports and importing `*`, it will work, but will not be valid in ES2015. E.g. with the following...

```js
// file a
export default 1;

// file b
import * as a from './a';

// file c
export const c = 3;

// file d
import c from './c';
```

In the official Babel module, `a` in `file b` will be undefined and `c` in `file d` will be undefined. Using this module, they will be `1` and `3` respectively.

4. Updating the exports on-the-fly will not work. This is not supported within commonjs normally anyway, but is supported with the official plugin.

You may want to use a linter (such as eslint with eslint-plugin-import) in order to ensure that your code is standard whilst using this simplified transform.

## Installation

```sh
$ npm install --save-dev babel-plugin-transform-es2015-modules-simple-commonjs
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-es2015-modules-simple-commonjs"]
}
```

### Via Node API

```js
require('babel').transform('code', {
  plugins: ['transform-es2015-modules-simple-commonjs']
});
```

### Usage with other ES2015 plugins

This replaces the functionality in `transform-es2015-modules-commonjs`, but you may be better off using this with the `babel-preset-es2015-webpack` preset, which takes the es2015 preset and removes the commonjs transform.
