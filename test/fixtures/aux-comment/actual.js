import "foo";
import "foo-bar";
import "./directory/foo-bar";
import foo from "foo2";
import * as foo2 from "foo3";
import {bar} from "foo4";
import {foo as bar2} from "foo5";
/* comment 1*/
export {test};
var test = 5;
export var test2 = 42;

bar(foo, bar2);

/* my comment */
bar2;
foo;
