"use strict";

var _classCallCheck = require("babel-runtime/helpers/classCallCheck");

var _createClass = require("babel-runtime/helpers/createClass");

var a = exports.a = 1,
    aa = exports.aa = 2;
var b = exports.b = 1,
    bb = exports.bb = 2;
var c = exports.c = 1,
    cc = exports.cc = 3;
function d() {
	doSomething();
}
exports.d = d;

var e = exports.e = function () {
	function e() {
		_classCallCheck(this, e);
	}

	_createClass(e, [{
		key: "doSomething",
		value: function doSomething() {
			doSomethingElse();
		}
	}]);

	return e;
}();

var f = 1;
var h = 1;
var i = 1;
exports.f = f;
exports.g = f;
exports.h = h;
exports.i = i;
