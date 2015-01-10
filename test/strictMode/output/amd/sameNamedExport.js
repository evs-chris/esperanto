define(['exports', './foo'], function (exports, foo) {

  'use strict';

  exports['default'] = {
    foo: foo['default']
  };

});