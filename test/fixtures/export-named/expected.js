"use strict";

var a = exports.a = 1,
    aa = exports.aa = 2;
const b = exports.b = 1,
      bb = exports.bb = 2;
let c = exports.c = 1,
    cc = exports.cc = 3;

function d() {
  doSomething();
}

exports.d = d;

class e {
  doSomething() {
    doSomethingElse();
  }

}

exports.e = e;
var f = 1;
var h = 1;
var i = 1;
exports.f = f;
exports.g = f;
exports.h = h;
exports.i = i;
