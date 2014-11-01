import Source from '../../../Source';
import getIntro from './getIntro';
import getHeader from './getHeader';
import getFooter from './getFooter';
import disallowNames from '../shared/disallowNames';

export default function Module$toAmd ( options ) {
	var source,
		intro,
		header,
		footer,
		outro;

	if ( options.defaultOnly ) {
		disallowNames( this );
	}

	source = new Source( this.source );

	intro = getIntro( this, options );
	header = getHeader( this, options );
	footer = getFooter( this, options );
	outro = '\n\n});';

	// Remove import statements
	this.imports.forEach( x => {
		source.remove( x.start, x.next );
	});

	// Remove export statements
	this.exports.forEach( function ( x ) {
		if ( x.declaration ) {
			source.replace( x.start, x.end, x.value );
		} else {
			source.remove( x.start, x.next );
		}
	});

	source.trim();
	header && source.prepend( header + '\n\n' ).trim();
	footer && source.append( '\n\n' + footer ).trim();
	source.indent();

	source.prepend( intro ).append( outro );

	return source.toString();
}
