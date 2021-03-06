import template from '../../../utils/template';
import packageResult from '../../../utils/packageResult';
import reorderImports from './utils/reorderImports';
import transformBody from './utils/transformBody';

var introTemplate;

introTemplate = template( 'define(<%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

export default function amd ( mod, body, options ) {
	var importPaths = [],
		importNames = [],
		intro,
		i;

	// ensure empty imports are at the end
	reorderImports( mod.imports );

	// gather imports, and remove import declarations
	mod.imports.forEach( ( x, i ) => {
		importPaths[i] = x.path;

		if ( x.specifiers.length ) { // don't add empty imports
			importNames[i] = mod.getName( x.path );
		}
	});

	if ( mod.exports.length ) {
		importPaths.unshift( 'exports' );
		importNames.unshift( 'exports' );
	}

	intro = introTemplate({
		paths: importPaths.length ? '[' + importPaths.map( quote ).join( ', ' ) + '], ' : '',
		names: importNames.join( ', ' )
	}).replace( /\t/g, body.indentStr );

	transformBody( mod, body, {
		intro: intro,
		outro: '\n\n});'
	});

	return packageResult( body, options, 'toAmd' );
}

function quote ( str ) {
	return "'" + str + "'";
}
