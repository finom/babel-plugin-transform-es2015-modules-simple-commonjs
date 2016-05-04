"use strict";

var foo = require("foo2");

var _foo = require("foo3");

var foo2 = _foo;

var _foo2 = require("foo4");

var bar = _foo2.bar;

var _foo3 = require("foo5");

var bar2 = _foo3.foo;

require("foo");

require("foo-bar");

require("./directory/foo-bar");

exports.
/* comment 1*/
test = test;
var test = exports.test = 5;

bar(foo, bar2);

/* my comment */
bar2;
foo;
