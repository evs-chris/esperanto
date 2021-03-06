(function (global, factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		// export as AMD
		define(['acorn', 'magic-string', 'estraverse'], factory);
	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
		// node/browserify
		module.exports = factory(require('acorn'), require('magic-string'), require('estraverse'));
	} else {
		// browser global
		global.esperanto = factory(global.acorn, global.MagicString, global.estraverse);
	}

}(typeof window !== 'undefined' ? window : this, function (acorn__default, MagicString__default, estraverse__default) {

	'use strict';

	function findImportsAndExports__findImportsAndExports ( mod, source, ast, imports, exports ) {
		var previousDeclaration;
	
		ast.body.forEach( function(node ) {
			var passthrough, declaration;
	
			if ( previousDeclaration ) {
				previousDeclaration.next = node.start;
	
				if ( node.type !== 'EmptyStatement' ) {
					previousDeclaration = null;
				}
			}
	
			if ( node.type === 'ImportDeclaration' ) {
				declaration = findImportsAndExports__processImport( node );
				imports.push( declaration );
			}
	
			else if ( node.type === 'ExportDeclaration' ) {
				declaration = findImportsAndExports__processExport( node, source );
				exports.push( declaration );
	
				if ( declaration.default ) {
					if ( mod.defaultExport ) {
						throw new Error( 'Duplicate default exports' );
					}
					mod.defaultExport = declaration;
				}
	
				if ( node.source ) {
					// it's both an import and an export, e.g.
					// `export { foo } from './bar';
					passthrough = findImportsAndExports__processImport( node, true );
					imports.push( passthrough );
	
					declaration.passthrough = passthrough;
				}
			}
	
			if ( declaration ) {
				previousDeclaration = declaration;
			}
		});
	
		// catch any trailing semicolons
		if ( previousDeclaration ) {
			previousDeclaration.next = source.length;
		}
	}
	var findImportsAndExports__default = findImportsAndExports__findImportsAndExports;
	
	function findImportsAndExports__processImport ( node, passthrough ) {
		var result = {
			node: node,
			start: node.start,
			end: node.end,
			passthrough: !!passthrough,
	
			path: node.source.value,
			specifiers: node.specifiers.map( function(s ) {
				var id;
	
				if ( s.type === 'ImportBatchSpecifier' ) {
					return {
						batch: true,
						name: s.name.name
					};
				}
	
				id = s.id.name;
	
				return {
					default: !!s.default,
					name: s.default ? 'default' : id,
					as: s.name ? s.name.name : id
				};
			})
		};
	
		// TODO have different types of imports - batch, default, named
	
		if ( result.specifiers.length === 1 && result.specifiers[0].default ) {
			result.default = true;
			result.name = result.specifiers[0].as;
		}
	
		return result;
	}
	
	function findImportsAndExports__processExport ( node, source ) {
		var result, d;
	
		result = {
			node: node,
			start: node.start,
			end: node.end
		};
	
		if ( d = node.declaration ) {
			result.value = source.slice( d.start, d.end );
			result.valueStart = d.start;
	
			if ( /Declaration/.test( d.type ) ) {
				// inline declarations, e.g
				//
				//     export var foo = 'bar';
				//     export function baz () {...}
				result.declaration = true; // TODO remove in favour of result.type
				result.type = 'declaration';
				result.default = !!node.default;
				result.name = node.default ? 'default' : findImportsAndExports__getDeclarationName( d );
	
			}
	
			else {
				// literals, e.g. `export default 42`
				result.type = 'literal';
				result.default = true;
				result.name = 'default';
			}
		}
	
		else {
			// named exports, e.g. `export { foo, bar };`
			result.type = 'named';
			result.specifiers = node.specifiers.map( function(s ) {return { name: s.id.name }}  ) // TODO as?
		}
	
		return result;
	}
	
	function findImportsAndExports__getDeclarationName ( declaration ) {
		if ( declaration.type === 'VariableDeclaration' ) {
			return declaration.declarations[0].id.name;
		}
	
		if ( declaration.type === 'FunctionDeclaration' ) {
			return declaration.id.name;
		}
	}

	var sanitize__reserved = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield'.split( ' ' );
	
	function sanitize__sanitize ( name ) {
		name = name.replace( /[^a-zA-Z0-9_$]/g, '_' );
		if ( /[^a-zA-Z_$]/.test( name[0] ) ) {
			name = '_' + name;
		}
	
		if ( ~sanitize__reserved.indexOf( name ) ) {
			name = '_' + name;
		}
	
		return name;
	}
	var sanitize__default = sanitize__sanitize;

	function getModuleNameHelper__moduleNameHelper ( userFn ) {
		var nameByPath = {}, usedNames = {}, getModuleName;
	
		getModuleName = function(moduleId ) {
			var parts, i, name;
	
			// use existing value
			if ( name = nameByPath[ moduleId ] ) {
				return name;
			}
	
			// if user supplied a function, defer to it
			if ( userFn && ( name = userFn( moduleId ) ) ) {
				nameByPath[ moduleId ] = sanitize__default( name );
			}
	
			else {
				parts = moduleId.split( '/' );
				i = parts.length;
	
				while ( i-- ) {
					name = sanitize__default( parts.slice( i ).join( '__' ) );
	
					if ( !usedNames[ name ] ) {
						usedNames[ name ] = true;
						nameByPath[ moduleId ] = name;
	
						break;
					}
				}
			}
	
			return nameByPath[ moduleId ];
		};
	
		return getModuleName;
	}
	var getModuleNameHelper__default = getModuleNameHelper__moduleNameHelper;

	function getStandaloneModule__getStandaloneModule ( options ) {
		var mod;
	
		mod = {
			source: options.source,
			body: new MagicString__default( options.source ),
			ast: acorn__default.parse( options.source, {
				ecmaVersion: 6,
				locations: true
			}),
			imports: [],
			exports: [],
			getName: getModuleNameHelper__default( options.getModuleName )
		};
	
		findImportsAndExports__default( mod, mod.source, mod.ast, mod.imports, mod.exports, options.getModuleName );
	
		return mod;
	}
	var getStandaloneModule__default = getStandaloneModule__getStandaloneModule;

	var amd__template = 'define(__IMPORT_PATHS__function (__IMPORT_NAMES__) {\n\n';
	
	function amd__amd ( mod, body, options ) {
		var importNames = [],
			importPaths = [],
			exportDeclaration,
			exportedValue,
			intro,
			i;
	
		// ensure empty imports are at the end
		i = mod.imports.length;
		while ( i-- ) {
			if ( !mod.imports[i].specifiers.length ) {
				mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
			}
		}
	
		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			var specifier;
	
			importPaths[i] = x.path;
	
			specifier = x.specifiers[0];
			if ( specifier ) {
				importNames[i] = specifier.batch ? specifier.name : specifier.as;
			}
	
			body.remove( x.start, x.next );
		});
	
		exportDeclaration = mod.exports[0];
	
		if ( exportDeclaration ) {
			if ( amd__isFunctionDeclaration( exportDeclaration ) ) {
				// special case - we have a situation like
				//
				//     export default function foo () {...}
				//
				// which needs to be rewritten
				//
				//     function foo () {...}
				//     export default foo
				body.remove( exportDeclaration.start, exportDeclaration.valueStart );
				exportedValue = exportDeclaration.node.declaration.id.name;
			} else {
				body.remove( exportDeclaration.start, exportDeclaration.next );
				exportedValue = exportDeclaration.value;
			}
	
			body.append( '\nreturn ' + exportedValue + ';' );
		}
	
		body.trim();
	
		if ( options.addUseStrict !== 'false' ) {
			body.prepend( "'use strict';\n\n" ).trim();
		}
	
		intro = amd__template
			.replace( '__IMPORT_PATHS__', importPaths.length ? '[' + importPaths.map( amd__quote ).join( ', ' ) + '], ' : '' )
			.replace( '__IMPORT_NAMES__', importNames.join( ', ' ) );
	
		body.indent().prepend( intro ).append( '\n\n});' );
	
		return body.toString();
	}
	var amd__default = amd__amd;
	
	function amd__isFunctionDeclaration ( x ) {
		return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
	}
	
	function amd__quote ( str ) {
		return "'" + str + "'";
	}

	function cjs__cjs ( mod, body, options ) {
		var replacement, exportDeclaration;
	
		mod.imports.forEach( function(x ) {
			var specifier, name;
	
			specifier = x.specifiers[0];
	
			if ( !specifier ) {
				// empty import
				replacement = (("require('" + (x.path)) + "')");
			} else {
				name = specifier.batch ? specifier.name : specifier.as;
				replacement = (("var " + name) + (" = require('" + (x.path)) + "')");
			}
	
			body.replace( x.start, x.end, replacement );
		});
	
		exportDeclaration = mod.exports[0];
	
		if ( exportDeclaration ) {
			if ( cjs__isFunctionDeclaration( exportDeclaration ) ) {
				// special case - we have a situation like
				//
				//     export default function foo () {...}
				//
				// which needs to be rewritten
				//
				//     function foo () {...}
				//     export default foo
				body.remove( exportDeclaration.start, exportDeclaration.valueStart );
				body.replace( exportDeclaration.end, exportDeclaration.end, (("\nmodule.exports = " + (exportDeclaration.node.declaration.id.name)) + ";") );
			} else {
				body.replace( exportDeclaration.start, exportDeclaration.end, (("module.exports = " + (exportDeclaration.value)) + ";") );
			}
		}
	
		body.trim();
	
		if ( options.addUseStrict !== 'false' ) {
			body.prepend( "'use strict';\n\n" ).indent().prepend( '(function () {\n\n' ).append( '\n\n}).call(global);' );
		}
	
		return body.toString();
	}
	var cjs__default = cjs__cjs;
	
	function cjs__isFunctionDeclaration ( x ) {
		return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
	}

	function template__template ( str ) {
		return function ( data ) {
			return str.replace( /\<%=\s*([^\s]+)\s*%\>/g, function ( match, $1 ) {
				return $1 in data ? data[ $1 ] : match;
			});
		};
	}
	var template__default = template__template;

	var umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define(<%= AMD_DEPS %>factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		module.exports = factory(<%= CJS_DEPS %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= NAME %> = factory(<%= GLOBAL_DEPS %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= IMPORT_NAMES %>) {\
\n\
\n") );
	
	function umd__umd ( mod, body, options ) {
		var importNames = [],
			importPaths = [],
			exportDeclaration,
			exportedValue,
			intro,
			i;
	
		// ensure empty imports are at the end
		i = mod.imports.length;
		while ( i-- ) {
			if ( !mod.imports[i].specifiers.length ) {
				mod.imports.splice( mod.imports.length - 1, 0, mod.imports.splice( i, 1 )[0] );
			}
		}
	
		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			var specifier;
	
			importPaths[i] = x.path;
	
			specifier = x.specifiers[0];
			if ( specifier ) {
				importNames[i] = specifier.batch ? specifier.name : specifier.as;
			}
	
			body.remove( x.start, x.next );
		});
	
		exportDeclaration = mod.exports[0];
	
		if ( exportDeclaration ) {
			if ( umd__isFunctionDeclaration( exportDeclaration ) ) {
				// special case - we have a situation like
				//
				//     export default function foo () {...}
				//
				// which needs to be rewritten
				//
				//     function foo () {...}
				//     export default foo
				body.remove( exportDeclaration.start, exportDeclaration.valueStart );
				exportedValue = exportDeclaration.node.declaration.id.name;
			} else {
				body.remove( exportDeclaration.start, exportDeclaration.next );
				exportedValue = exportDeclaration.value;
			}
	
			body.append( '\nreturn ' + exportedValue + ';' );
		}
	
		body.trim();
	
		if ( options.addUseStrict !== 'false' ) {
			body.prepend( "'use strict';\n\n" ).trim();
		}
	
		intro = umd__introTemplate({
			AMD_DEPS: importPaths.length ? '[' + importPaths.map( umd__quote ).join( ', ' ) + '], ' : '',
			CJS_DEPS: importPaths.map( umd__req ).join( ', ' ),
			GLOBAL_DEPS: importNames.map( umd__globalify ).join( ', ' ),
			IMPORT_NAMES: importNames.join( ', ' ),
			NAME: options.name
		}).replace( /\t/g, body.indentStr );
	
		body.indent().prepend( intro ).append( '\n\n}));' );
	
		return body.toString();
	}
	var umd__default = umd__umd;
	
	function umd__isFunctionDeclaration ( x ) {
		return x.node.declaration && x.node.declaration.type === 'FunctionExpression';
	}
	
	function umd__quote ( str ) {
		return "'" + str + "'";
	}
	
	function umd__req ( path ) {
		return (("require('" + path) + "')");
	}
	
	function umd__globalify ( name ) {
		return ("global." + name);
	}

	var defaultsMode__default = {
		amd: amd__default,
		cjs: cjs__default,
		umd: umd__default
	};

	function reorderImports__reorderImports ( imports ) {
		var i;
	
		// ensure empty imports are at the end
		i = imports.length;
		while ( i-- ) {
			if ( !imports[i].specifiers.length ) {
				imports.splice( imports.length - 1, 0, imports.splice( i, 1 )[0] );
			}
		}
	}
	var reorderImports__default = reorderImports__reorderImports;

	function gatherImports__gatherImports ( imports, getName, importedBindings, toRewrite ) {
		imports.forEach( function(x ) {
			x.specifiers.forEach( function(s ) {
				var name, replacement;
	
				if ( s.batch ) {
					name = s.name;
				} else {
					name = s.as;
				}
	
				replacement = s.batch ? s.name : ( getName( x.path ) + '.' + s.name );
	
				importedBindings[ name ] = replacement;
	
				if ( !x.passthrough ) {
					toRewrite[ name ] = replacement;
				}
			});
		});
	}
	var gatherImports__default = gatherImports__gatherImports;

	function getExportNames__getExportNames ( exports ) {
		var result = [];
	
		exports.forEach( function(x ) {
			if ( x.default ) return;
	
			if ( x.declaration ) {
				result.push( x.name );
				return;
			}
	
			x.specifiers.forEach( function(s ) {
				result.push( s.name );
			});
		});
	
		return result;
	}
	var getExportNames__default = getExportNames__getExportNames;

	function disallowIllegalReassignment__disallowIllegalReassignment ( node, names, scope ) {
		var assignee, name, replacement, message;
	
		if ( node.type === 'AssignmentExpression' ) {
			assignee = node.left;
		} else if ( node.type === 'UpdateExpression' ) {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}
	
		if ( assignee.type === 'MemberExpression' ) {
			assignee = assignee.object;
			message = 'Cannot reassign imported binding of namespace ';
		} else {
			message = 'Cannot reassign imported binding ';
		}
	
		if ( assignee.type !== 'Identifier' ) {
			return; // not assigning to a binding
		}
	
		name = assignee.name;
		replacement = names[ name ];
	
		if ( !!replacement && !scope.contains( name ) ) {
			throw new Error( message + '`' + name + '`' );
		}
	}
	var disallowIllegalReassignment__default = disallowIllegalReassignment__disallowIllegalReassignment;

	function rewriteIdentifiers__rewriteIdentifiers ( body, node, toRewrite, scope ) {
		var name, replacement;
	
		if ( node.type === 'Identifier' ) {
			name = node.name;
			replacement = toRewrite[ name ];
	
			if ( replacement && !scope.contains( name ) ) {
				// rewrite
				body.replace( node.start, node.end, replacement );
			}
		}
	}
	var rewriteIdentifiers__default = rewriteIdentifiers__rewriteIdentifiers;

	function transformBody__transformBody ( mod, body, options ) {
		var scope,
			blockScope,
			importedBindings = {},
			toRewrite = {},
			exportNames = [],
			alreadyExported = {},
			shouldExportEarly = {},
			earlyExports,
			lateExports,
			defaultValue,
			capturedUpdates = null,
			indentExclusionRanges = [];
	
		scope = mod.ast._scope;
		blockScope = mod.ast._blockScope;
	
		gatherImports__default( mod.imports, mod.getName, importedBindings, toRewrite );
		exportNames = getExportNames__default( mod.exports );
	
		// scope is now the global scope
		estraverse__default.traverse( mod.ast, {
			enter: function ( node, parent ) {
				// we're only interested in references, not property names etc
				if ( node._skip ) return this.skip();
	
				if ( node._scope ) {
					scope = node._scope;
				} else if ( node._blockScope ) {
					blockScope = node._blockScope;
				}
	
				// Special case: if you have a variable declaration that updates existing
				// bindings as a side-effect, e.g. `var a = b++`, where `b` is an exported
				// value, we can't simply append `exports.b = b` to the update (as we
				// normally would) because that would be syntactically invalid. Instead,
				// we capture the change and update the export (and any others) after the
				// variable declaration
				if ( node.type === 'VariableDeclaration' ) {
					var previous = capturedUpdates;
					capturedUpdates = [];
					capturedUpdates.previous = previous;
				}
	
				// Catch illegal reassignments
				disallowIllegalReassignment__default( node, toRewrite, scope );
	
				// Rewrite assignments to exports
				transformBody__rewriteExportAssignments( body, node, exportNames, scope, alreadyExported, ~mod.ast.body.indexOf( parent ), capturedUpdates );
	
				// Rewrite import identifiers
				rewriteIdentifiers__default( body, node, toRewrite, scope );
	
				// Add multi-line strings to exclusion ranges
				if ( node.type === 'TemplateLiteral' ) {
					indentExclusionRanges.push([ node.start, node.end ]);
				}
			},
	
			leave: function ( node ) {
				// Special case - see above
				if ( node.type === 'VariableDeclaration' ) {
					if ( capturedUpdates.length ) {
						body.replace( node.end, node.end, capturedUpdates.map( function(n ) {return ((" exports." + n) + (" = " + n) + ";")} ).join( '' ) );
					}
	
					capturedUpdates = capturedUpdates.previous;
				}
	
				if ( node._scope ) {
					scope = scope.parent;
				} else if ( node._blockScope ) {
					blockScope = blockScope.parent;
				}
			}
		});
	
		// Remove import statements
		mod.imports.forEach( function(x ) {
			if ( x.passthrough ) return; // this is an `export { foo } from './bar'` statement
			body.remove( x.start, x.next );
		});
	
		// Remove export statements (but keep declarations)
		mod.exports.forEach( function(x ) {
			var name;
	
			if ( x.default ) {
				defaultValue = body.slice( x.valueStart, x.end );
				if ( x.node.declaration && x.node.declaration.id && ( name = x.node.declaration.id.name ) ) {
					// if you have a default export like
					//
					//     export default function foo () {...}
					//
					// you need to rewrite it as
					//
					//     function foo () {...}
					//     exports.default = foo;
					//
					// as the `foo` reference may be used elsewhere
					body.replace( x.start, x.end, defaultValue + '\nexports.default = ' + name + ';' );
				} else {
					body.replace( x.start, x.end, 'exports.default = ' + defaultValue );
				}
	
				return;
			}
	
			if ( x.declaration ) {
				if ( x.node.declaration.type === 'FunctionDeclaration' ) {
					shouldExportEarly[ x.node.declaration.id.name ] = true; // TODO what about `function foo () {}; export { foo }`?
				}
	
				body.remove( x.start, x.valueStart );
			} else {
				body.remove( x.start, x.next );
			}
		});
	
		// Append export block (this is the same for all module types, unlike imports)
		earlyExports = [];
		lateExports = [];
	
		exportNames.forEach( function(name ) {
			var chain;
	
			if ( chain = importedBindings[ name ] ) {
				// special case - a binding from another module
				earlyExports.push( (("Object.defineProperty(exports, '" + name) + ("', { get: function () { return " + chain) + "; }});") );
			} else if ( shouldExportEarly[ name ] ) {
				earlyExports.push( (("exports." + name) + (" = " + name) + ";") );
			} else if ( !alreadyExported[ name ] ) {
				lateExports.push( (("exports." + name) + (" = " + name) + ";") );
			}
		});
	
		if ( lateExports.length ) {
			body.trim().append( '\n\n' + lateExports.join( '\n' ) );
		}
	
		// Prepend require() statements
		if ( options.header ) {
			body.prepend( options.header + '\n\n' );
		}
	
		// Function exports should be exported immediately after 'use strict'
		if ( earlyExports.length ) {
			body.trim().prepend( earlyExports.join( '\n' ) + '\n\n' );
		}
	
		body.trim().indent({
			exclude: indentExclusionRanges.length ? indentExclusionRanges : null
		}).prepend( options.intro ).trim().append( options.outro );
	}
	var transformBody__default = transformBody__transformBody;
	
	function transformBody__rewriteExportAssignments ( body, node, exports, scope, alreadyExported, isTopLevelNode, capturedUpdates ) {
		var assignee, name;
	
		if ( node.type === 'AssignmentExpression' ) {
			assignee = node.left;
		} else if ( node.type === 'UpdateExpression' ) {
			assignee = node.argument;
		} else {
			return; // not an assignment
		}
	
		if ( assignee.type !== 'Identifier' ) {
			return;
		}
	
		name = assignee.name;
		if ( ~exports.indexOf( name ) ) {
			if ( !!capturedUpdates ) {
				capturedUpdates.push( name );
				return;
			}
	
			// special case - increment/decrement operators
			if ( node.operator === '++' || node.operator === '--' ) {
				body.replace( node.end, node.end, ((", exports." + name) + (" = " + name) + "") );
			} else {
				body.replace( node.start, node.start, (("exports." + name) + " = ") );
			}
	
			// keep track of what we've already exported - we don't need to
			// export it again later
			if ( isTopLevelNode ) {
				alreadyExported[ name ] = true;
			}
		}
	}

	var strictMode_amd__introTemplate;
	
	strictMode_amd__introTemplate = template__default( 'define(<%= paths %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );
	
	function strictMode_amd__amd ( mod, body ) {
		var importPaths = [],
			importNames = [],
			intro,
			i;
	
		// ensure empty imports are at the end
		reorderImports__default( mod.imports );
	
		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			importPaths[i] = x.path;
	
			if ( x.specifiers.length ) { // don't add empty imports
				importNames[i] = mod.getName( x.path );// '__imports_' + i;//x.name;
			}
		});
	
		if ( mod.exports.length ) {
			importPaths.unshift( 'exports' );
			importNames.unshift( 'exports' );
		}
	
		intro = strictMode_amd__introTemplate({
			paths: importPaths.length ? '[' + importPaths.map( strictMode_amd__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.indentStr );
	
		transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n});'
		});
	
		return body.toString();
	}
	var strictMode_amd__default = strictMode_amd__amd;
	
	function strictMode_amd__quote ( str ) {
		return "'" + str + "'";
	}

	var strictMode_cjs__intro = '(function () {\n\n\t\'use strict\';\n\n';
	var strictMode_cjs__outro = '\n\n}).call(global);';
	
	function strictMode_cjs__cjs ( mod, body ) {
		var importBlock;
	
		// Create block of require statements
		importBlock = mod.imports.map( function(x ) {
			var specifier, name, replacement;
	
			specifier = x.specifiers[0];
	
			if ( !specifier ) {
				// empty import
				replacement = (("require('" + (x.path)) + "');");
			} else {
				name = specifier.batch ? specifier.name : mod.getName( x.path );
				replacement = (("var " + name) + (" = require('" + (x.path)) + "');");
			}
	
			return replacement;
		}).join( '\n' );
	
		transformBody__default( mod, body, {
			intro: strictMode_cjs__intro.replace( /\t/g, body.indentStr ),
			header: importBlock,
			outro: strictMode_cjs__outro
		});
	
		return body.toString();
	}
	var strictMode_cjs__default = strictMode_cjs__cjs;

	var strictMode_umd__introTemplate;
	
	function strictMode_umd__umd ( mod, body, options ) {
		var importPaths = [],
			importNames = [],
			intro,
			i;
	
		reorderImports__default( mod.imports );
	
		// gather imports, and remove import declarations
		mod.imports.forEach( function( x, i )  {
			importPaths[i] = x.path;
	
			if ( x.specifiers.length ) {
				importNames[i] = mod.getName( x.path );// '__imports_' + i;//x.name;
			}
		});
	
		intro = strictMode_umd__introTemplate({
			amdDeps: [ 'exports' ].concat( importPaths ).map( strictMode_umd__quote ).join( ', ' ),
			cjsDeps: [ 'exports' ].concat( importPaths.map( strictMode_umd__req ) ).join( ', ' ),
			globals: [ ("global." + (options.name)) ].concat( importNames.map( strictMode_umd__globalify ) ).join( ', ' ),
			names: [ 'exports' ].concat( importNames ).join( ', ' ),
			name: options.name
		}).replace( /\t/g, body.indentStr );
	
		transformBody__default( mod, body, {
			intro: intro,
			outro: '\n\n}));'
		});
	
		return body.toString();
	}
	var strictMode_umd__default = strictMode_umd__umd;
	
	function strictMode_umd__quote ( str ) {
		return "'" + str + "'";
	}
	
	function strictMode_umd__req ( path ) {
		return 'require(\'' + path + '\')';
	}
	
	function strictMode_umd__globalify ( name ) {
		return 'global.' + name;
	}
	
	strictMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = {};\
\n		factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var strictMode__default = {
		amd: strictMode_amd__default,
		cjs: strictMode_cjs__default,
		umd: strictMode_umd__default
	};

	// TODO rewrite with named imports/exports
	var moduleBuilders__default = {
		defaultsMode: defaultsMode__default,
		strictMode: strictMode__default
	};

	var defaultsMode_amd__introTemplate = template__default( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );
	
	function defaultsMode_amd__amd ( bundle, body ) {
		var entry = bundle.entryModule,
			x,
			exportStatement,
			intro;
	
		if ( x = entry.exports[0] ) {
			exportStatement = body.indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}
	
		intro = defaultsMode_amd__introTemplate({
			amdDeps: bundle.externalModules.length ? '[' + bundle.externalModules.map( defaultsMode_amd__quoteId ).join( ', ' ) + '], ' : '',
			names: bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} ).join( ', ' )
		}).replace( /\t/g, body.indentStr );
	
		body.prepend( intro ).trim().append( '\n\n});' );
		return body.toString();
	}
	var defaultsMode_amd__default = defaultsMode_amd__amd;
	
	function defaultsMode_amd__quoteId ( m ) {
		return "'" + m.id + "'";
	}

	function defaultsMode_cjs__cjs ( bundle, body ) {
		var importBlock,
			entry = bundle.entryModule,
			x,
			exportStatement,
			intro;
	
		importBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return body.indentStr + (("var " + name) + ("__default = require('" + (x.id)) + "');");
		}).join( '\n' );
	
		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}
	
		if ( x = entry.exports[0] ) {
			exportStatement = body.indentStr + 'module.exports = ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}
	
		intro = '(function () {\n\n' + body.indentStr + "'use strict';\n\n";
	
		body.prepend( intro ).trim().append( '\n\n}).call(global);' );
		return body.toString();
	}
	var defaultsMode_cjs__default = defaultsMode_cjs__cjs;

	var defaultsMode_umd__introTemplate;
	
	function defaultsMode_umd__umd ( bundle, body, options ) {
		var x,
			entry = bundle.entryModule,
			exportStatement,
			amdDeps,
			cjsDeps,
			globals,
			intro;
	
		if ( !options || !options.name ) {
			throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
		}
	
		if ( x = entry.exports[0] ) {
			exportStatement = body.indentStr + 'return ' + bundle.uniqueNames[ bundle.entry ] + '__default;';
			body.append( '\n\n' + exportStatement );
		}
	
		amdDeps = bundle.externalModules.map( defaultsMode_umd__quoteId ).join( ', ' );
		cjsDeps = bundle.externalModules.map( defaultsMode_umd__req ).join( ', ' );
		globals = bundle.externalModules.map( function(m ) {return 'global.' + bundle.uniqueNames[ m.id ]} ).join( ', ' );
	
		intro = defaultsMode_umd__introTemplate({
			amdDeps: amdDeps,
			cjsDeps: cjsDeps,
			globals: globals,
			name: options.name,
			names: bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ] + '__default'} ).join( ', ' )
		}).replace( /\t/g, body.indentStr );
	
		body.prepend( intro ).trim().append( '\n\n}));' );
		return body.toString();
	}
	var defaultsMode_umd__default = defaultsMode_umd__umd;
	
	function defaultsMode_umd__quoteId ( m ) {
		return "'" + m.id + "'";
	}
	
	function defaultsMode_umd__req ( m ) {
		return 'require(\'' + m.id + '\')';
	}
	
	defaultsMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		module.exports = factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var builders_defaultsMode__default = {
		amd: defaultsMode_amd__default,
		cjs: defaultsMode_cjs__default,
		umd: defaultsMode_umd__default
	};

	var getExportBlock__outroTemplate;
	
	function getExportBlock__getExportBlock ( bundle, entry, indentStr ) {
		var exportBlock = '', statements = [], name;
	
		name = bundle.uniqueNames[ bundle.entry ];
	
		// create an export block
		if ( entry.defaultExport ) {
			exportBlock = indentStr + 'exports.default = ' + name + '__default;';
		}
	
		entry.exports.forEach( function(x ) {
			if ( x.default ) {
				return;
			}
	
			if ( x.declaration ) {
				statements.push( indentStr + (("__export('" + (x.name)) + ("', function () { return " + name) + ("__" + (x.name)) + "; });")  );
			}
	
			else {
				x.specifiers.forEach( function(s ) {
					statements.push( indentStr + (("__export('" + (s.name)) + ("', function () { return " + name) + ("__" + (s.name)) + "; });")  );
				});
			}
		});
	
		if ( statements.length ) {
			if ( exportBlock ) {
				exportBlock += '\n\n';
			}
	
			exportBlock += getExportBlock__outroTemplate({
				exportStatements: statements.join( '\n' )
			}).replace( /\t/g, indentStr );
		}
	
		return exportBlock;
	}
	var getExportBlock__default = getExportBlock__getExportBlock;
	
	getExportBlock__outroTemplate = template__default( ("\
\n\
\n	(function (__export) {\
\n	<%= exportStatements %>\
\n	}(function (prop, get) {\
\n		Object.defineProperty(exports, prop, {\
\n			enumerable: true,\
\n			get: get\
\n		});\
\n	}));\
\n\
\n") );

	var builders_strictMode_amd__introTemplate;
	
	function builders_strictMode_amd__amd ( bundle, body ) {
		var defaultsBlock,
			entry = bundle.entryModule,
			exportBlock,
			externalModules = bundle.externalModules,
			importPaths,
			importNames,
			intro;
	
		defaultsBlock = externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return body.indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + (".default : " + name) + ");");
		}).join( '\n' );
	
		if ( defaultsBlock ) {
			body.prepend( defaultsBlock + '\n\n' );
		}
	
		if ( entry.exports.length ) {
			importPaths = [ 'exports' ].concat( externalModules.map( builders_strictMode_amd__getPath ) );
			importNames = [ 'exports' ].concat( externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} ) );
	
			exportBlock = getExportBlock__default( bundle, entry, body.indentStr );
			body.append( '\n\n' + exportBlock );
		} else {
			importPaths = externalModules.map( builders_strictMode_amd__getPath );
			importNames = externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} );
		}
	
		intro = builders_strictMode_amd__introTemplate({
			amdDeps: importPaths.length ? '[' + importPaths.map( builders_strictMode_amd__quote ).join( ', ' ) + '], ' : '',
			names: importNames.join( ', ' )
		}).replace( /\t/g, body.indentStr );
	
		body.prepend( intro ).trim().append( '\n\n});' );
		return body.toString();
	}
	var builders_strictMode_amd__default = builders_strictMode_amd__amd;
	
	function builders_strictMode_amd__quote ( str ) {
		return "'" + str + "'";
	}
	
	function builders_strictMode_amd__getPath ( m ) { return m.id; }
	
	builders_strictMode_amd__introTemplate = template__default( 'define(<%= amdDeps %>function (<%= names %>) {\n\n\t\'use strict\';\n\n' );

	function builders_strictMode_cjs__cjs ( bundle, body ) {
		var importBlock,
			entry = bundle.entryModule,
			exportBlock,
			intro;
	
		importBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
	
			return body.indentStr + (("var " + name) + (" = require('" + (x.id)) + "');\n") +
			       body.indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + (".default : " + name) + ");");
		}).join( '\n' );
	
		if ( importBlock ) {
			body.prepend( importBlock + '\n\n' );
		}
	
		if ( entry.exports.length ) {
			exportBlock = getExportBlock__default( bundle, entry, body.indentStr );
			body.append( '\n\n' + exportBlock );
		}
	
		intro = '(function () {\n\n' + body.indentStr + "'use strict';\n\n";
	
		body.prepend( intro ).trim().append( '\n\n}).call(global);' );
		return body.toString();
	}
	var builders_strictMode_cjs__default = builders_strictMode_cjs__cjs;

	var builders_strictMode_umd__introTemplate;
	
	function builders_strictMode_umd__umd ( bundle, body, options ) {
		var defaultsBlock,
			entry = bundle.entryModule,
			exportBlock,
			importPaths,
			importNames,
			amdDeps,
			cjsDeps,
			globals,
			names,
			intro;
	
		if ( !options || !options.name ) {
			throw new Error( 'You must specify an export name, e.g. `bundle.toUmd({ name: "myModule" })`' );
		}
	
		defaultsBlock = bundle.externalModules.map( function(x ) {
			var name = bundle.uniqueNames[ x.id ];
			return body.indentStr + (("var " + name) + ("__default = ('default' in " + name) + (" ? " + name) + (".default : " + name) + ");");
		}).join( '\n' );
	
		if ( defaultsBlock ) {
			body.prepend( defaultsBlock + '\n\n' );
		}
	
		importPaths = bundle.externalModules.map( builders_strictMode_umd__getId );
		importNames = bundle.externalModules.map( function(m ) {return bundle.uniqueNames[ m.id ]} );
	
		if ( entry.exports.length ) {
			amdDeps = [ 'exports' ].concat( importPaths ).map( builders_strictMode_umd__quote ).join( ', ' );
			cjsDeps = [ 'exports' ].concat( importPaths.map( builders_strictMode_umd__req ) ).join( ', ' );
			globals = [ options.name ].concat( importNames ).map( builders_strictMode_umd__globalify ).join( ', ' );
			names   = [ 'exports' ].concat( importNames ).join( ', ' );
	
			exportBlock = getExportBlock__default( bundle, entry, body.indentStr );
			body.append( '\n\n' + exportBlock );
		} else {
			amdDeps = importPaths.map( builders_strictMode_umd__quote ).join( ', ' );
			cjsDeps = importPaths.map( builders_strictMode_umd__req ).join( ', ' );
			globals = importNames.map( builders_strictMode_umd__globalify ).join( ', ' );
			names   = importNames.join( ', ' );
		}
	
		intro = builders_strictMode_umd__introTemplate({
			amdDeps: amdDeps,
			cjsDeps: cjsDeps,
			globals: globals,
			names: names,
			name: options.name
		}).replace( /\t/g, body.indentStr );
	
		body.prepend( intro ).trim().append( '\n\n});' );
		return body.toString();
	}
	var builders_strictMode_umd__default = builders_strictMode_umd__umd;
	
	function builders_strictMode_umd__getId ( m ) { return m.id; }
	
	function builders_strictMode_umd__quote ( str ) {
		return "'" + str + "'";
	}
	
	function builders_strictMode_umd__req ( path ) {
		return 'require(\'' + path + '\')';
	}
	
	function builders_strictMode_umd__globalify ( name ) {
		return 'global.' + name;
	}
	
	builders_strictMode_umd__introTemplate = template__default( ("(function (global, factory) {\
\n\
\n	'use strict';\
\n\
\n	if (typeof define === 'function' && define.amd) {\
\n		// export as AMD\
\n		define([<%= amdDeps %>], factory);\
\n	} else if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {\
\n		// node/browserify\
\n		factory(<%= cjsDeps %>);\
\n	} else {\
\n		// browser global\
\n		global.<%= name %> = {};\
\n		factory(<%= globals %>);\
\n	}\
\n\
\n}(typeof window !== 'undefined' ? window : this, function (<%= names %>) {\
\n\
\n	'use strict';\
\n\
\n") );

	var builders_strictMode__default = {
		amd: builders_strictMode_amd__default,
		cjs: builders_strictMode_cjs__default,
		umd: builders_strictMode_umd__default
	};

	// TODO rewrite with named imports/exports
	var bundleBuilders__default = {
		defaultsMode: builders_defaultsMode__default,
		strictMode: builders_strictMode__default
	};

	function hasNamedImports__hasNamedImports ( mod ) {
		var i, x;
	
		i = mod.imports.length;
		while ( i-- ) {
			x = mod.imports[i];
	
			if ( !x.specifiers.length ) {
				continue; // ok
			}
	
			if ( x.specifiers.length > 1 ) {
				return true;
			}
	
			if ( !x.specifiers[0].default && !x.specifiers[0].batch ) {
				return true;
			}
		}
	}
	var hasNamedImports__default = hasNamedImports__hasNamedImports;

	function hasNamedExports__hasNamedExports ( mod ) {
		var i;
	
		i = mod.exports.length;
		while ( i-- ) {
			if ( !mod.exports[i].default ) {
				return true;
			}
		}
	}
	var hasNamedExports__default = hasNamedExports__hasNamedExports;

	var annotateAst__Scope = function ( options ) {
		options = options || {};
	
		this.parent = options.parent;
		this.names = options.params || [];
	};
	
	annotateAst__Scope.prototype = {
		add: function ( name ) {
			this.names.push( name );
		},
	
		contains: function ( name ) {
			if ( ~this.names.indexOf( name ) ) {
				return true;
			}
	
			if ( this.parent ) {
				return this.parent.contains( name );
			}
	
			return false;
		}
	};
	
	function annotateAst__annotateAst ( ast ) {
		var scope = new annotateAst__Scope(), blockScope = new annotateAst__Scope();
	
		estraverse__default.traverse( ast, {
			enter: function ( node ) {
				if ( node.type === 'ImportDeclaration' ) {
					node._skip = true;
				}
	
				if ( node._skip ) {
					return this.skip();
				}
	
				if ( annotateAst__createsScope( node ) ) {
					if ( node.id ) {
						scope.add( node.id.name );
					}
	
					scope = node._scope = new annotateAst__Scope({
						parent: scope,
						params: node.params.map( function(x ) {return x.name} ) // TODO rest params?
					});
				}
	
				else if ( annotateAst__createsBlockScope( node ) ) {
					blockScope = node._blockScope = new annotateAst__Scope({
						parent: blockScope
					});
				}
	
				if ( annotateAst__declaresVar( node ) ) {
					scope.add( node.id.name );
				}
	
				else if ( annotateAst__declaresLet( node ) ) {
					blockScope.add( node.id.name );
				}
	
				// Make a note of which children we should skip
				if ( node.type === 'MemberExpression' && !node.computed ) {
					node.property._skip = true;
				}
	
				else if ( node.type === 'Property' ) {
					node.key._skip = true;
				}
			},
			leave: function ( node ) {
				if ( annotateAst__createsScope( node ) ) {
					scope = scope.parent;
				}
	
				else if ( annotateAst__createsBlockScope( node ) ) {
					blockScope = blockScope.parent;
				}
			}
		});
	
		ast._scope = scope;
		ast._blockScope = blockScope;
	}
	var annotateAst__default = annotateAst__annotateAst;
	
	function annotateAst__createsScope ( node ) {
		return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
	}
	
	function annotateAst__createsBlockScope ( node ) {
		return node.type === 'BlockStatement';
	}
	
	function annotateAst__declaresVar ( node ) {
		return node.type === 'VariableDeclarator'; // TODO const, class? (function taken care of already)
	}
	
	function annotateAst__declaresLet ( node ) {
		return false; // TODO
	}

	var esperanto__deprecateMessage = 'options.defaultOnly has been deprecated, and is now standard behaviour. To use named imports/exports, pass `strict: true`.';
	
	function esperanto__transpileMethod ( format ) {
		return function ( source, options ) {
			var module,
				body,
				builder;
	
			options = options || {};
			module = getStandaloneModule__default({ source: source, getModuleName: options.getModuleName });
			body = module.body.clone();
	
			if ( 'defaultOnly' in options ) {
				// TODO link to a wiki page explaining this, or something
				console.log( esperanto__deprecateMessage );
			}
	
			if ( !options.strict ) {
				// ensure there are no named imports/exports. TODO link to a wiki page...
				if ( hasNamedImports__default( module ) || hasNamedExports__default( module ) ) {
					throw new Error( 'You must be in strict mode (pass `strict: true`) to use named imports or exports' );
				}
	
				builder = moduleBuilders__default.defaultsMode[ format ];
			} else {
				// annotate AST with scope info
				annotateAst__default( module.ast );
				builder = moduleBuilders__default.strictMode[ format ];
			}
	
			return builder( module, body, options );
		};
	}
	
	var esperanto__default = {
		toAmd: esperanto__transpileMethod( 'amd' ),
		toCjs: esperanto__transpileMethod( 'cjs' ),
		toUmd: esperanto__transpileMethod( 'umd' ),
	
		bundle: function ( options ) {
			return getBundle__default( options ).then( function ( bundle ) {
				return {
					toAmd: function(options ) {return transpile( 'amd', options )},
					toCjs: function(options ) {return transpile( 'cjs', options )},
					toUmd: function(options ) {return transpile( 'umd', options )}
				};
	
				function transpile ( format, options ) {
					var builder;
	
					options = options || {};
	
					if ( 'defaultOnly' in options ) {
						// TODO link to a wiki page explaining this, or something
						console.log( esperanto__deprecateMessage );
					}
	
					if ( !options.strict ) {
						// ensure there are no named imports/exports
						if ( hasNamedExports__default( bundle.entryModule ) ) {
							throw new Error( 'Entry module can only have named exports in strict mode (pass `strict: true`)' );
						}
	
						builder = bundleBuilders__default.defaultsMode[ format ];
					} else {
						builder = bundleBuilders__default.strictMode[ format ];
					}
	
					return builder( bundle, bundle.body.clone(), options );
				}
			});
		}
	};

	return esperanto__default;

}));