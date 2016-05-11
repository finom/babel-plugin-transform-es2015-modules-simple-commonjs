'use strict';

var _classCallCheck = require('babel-runtime/helpers/classCallCheck').default;

var _createClass = require('babel-runtime/helpers/createClass').default;

var a = require('/path/to/a');

doSomething();

var x = function () {
	function x() {
		_classCallCheck(this, x);
	}

	_createClass(x, [{
		key: 'func',
		value: function func() {}
	}]);

	return x;
}();

module.exports = x;
;
doSomethingElse();
