import acorn from 'acorn';
import parse from './prototype/parse';
import toAmd from './prototype/toAmd';
import toCjs from './prototype/toCjs';
import toUmd from './prototype/toUmd';

var Module = function ( options ) {
	this.source = options.source;

	this.ast = acorn.parse( this.source, {
		ecmaVersion: 6,
		locations: true
	});

	this.imports = [];
	this.exports = [];

	this.parse({
		getModuleName: options.getModuleName
	});

	this.hasTrailingExport = (
		this.exports.length === 1 &&
		this.exports[0].node === this.ast.body[ this.ast.body.length - 1 ]
	);
};

Module.prototype = {
	parse: parse,
	toAmd: toAmd,
	toCjs: toCjs,
	toUmd: toUmd
};

export default Module;
