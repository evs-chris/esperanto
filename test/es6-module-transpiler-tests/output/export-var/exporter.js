(function () {

	'use strict';

	/* jshint esnext:true */
	
	var a = 1;
	assert.equal(a, 1);
	
	exports.a = a;

}).call(global);