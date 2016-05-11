"use strict";

var foo = exports.foo = function foo(gen) {
  var ctx = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
};

var bar = exports.bar = function bar(gen) {
  var ctx = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
};
