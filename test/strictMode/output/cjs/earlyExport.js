(function () {

	'use strict';

	exports.default = foo;
	
	function foo () {
		console.log( 'fooing' );
	}

}).call(global);