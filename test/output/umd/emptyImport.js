(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['polyfills', 'foo'], factory);
	} else if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		// node/browserify
		module.exports = factory(require('polyfills'), require('foo'));
	} else {
		// browser global
		global.myModule = factory(global.__polyfills, global.__foo);
	}

}(typeof window !== 'undefined' ? window : this, function (__polyfills, __foo) {

	'use strict';
	
	var foo = __foo.default;

}));