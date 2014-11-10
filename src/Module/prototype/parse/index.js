import resolve from '../../../utils/resolve';
import sanitize from '../../../utils/sanitize';
import processImport from './processImport';
import processExport from './processExport';

export default function Module$parse ( options ) {
	var source = this.source,
		getModuleName,
		imports = this.imports,
		exports = this.exports,
		previousDeclaration,
		uid = 0;

	getModuleName = id => {
		var name;

		if ( options.getModuleName ) {
			name = options.getModuleName( id );
		}

		return name ? sanitize( name ) : '__imports_' + uid++;
	};

	this.ast.body.forEach( node => {
		var passthrough, declaration, name;

		if ( previousDeclaration ) {
			previousDeclaration.next = node.start;

			if ( node.type !== 'EmptyStatement' ) {
				previousDeclaration = null;
			}
		}

		if ( node.type === 'ImportDeclaration' ) {
			declaration = processImport( node );

			// give each imported module a name, falling back to
			// __imports_x
			declaration.name = getModuleName( resolve( declaration.path, this.file ) ); // TODO `name` -> `id`

			imports.push( declaration );
		}

		else if ( node.type === 'ExportDeclaration' ) {
			declaration = processExport( node, source );
			exports.push( declaration );

			if ( declaration.default ) {
				if ( this.defaultExport ) {
					throw new Error( 'Duplicate default exports' );
				}
				this.defaultExport = declaration;
			}

			if ( node.source ) {
				// it's both an import and an export, e.g.
				//
				//     `export { foo } from './bar';
				passthrough = processImport( node, true );
				passthrough.name = getModuleName( resolve( passthrough.path, this.file ) );

				passthrough.node = node;
				passthrough.start = node.start;
				passthrough.end = node.end;
				imports.push( passthrough );

				declaration.passthrough = passthrough;
			}
		}

		if ( declaration ) {
			declaration.start = node.start;
			declaration.end = node.end;
			declaration.node = node;

			previousDeclaration = declaration;
		}
	});

	// catch any trailing semicolons
	if ( previousDeclaration ) {
		previousDeclaration.next = source.length;
	}
}
