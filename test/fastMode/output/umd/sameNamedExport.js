(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('./foo')) :
  typeof define === 'function' && define.amd ? define(['./foo'], factory) :
  global.myModule = factory(global.foo)
}(this, function (foo) { 'use strict';


  return {
    foo: foo
  };

}));