(function () {

	'use strict';
	
	var foo = require('foo');
	require('polyfills');
	
	module.exports = 'baz';

}).call(global);