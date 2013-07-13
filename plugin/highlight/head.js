// START CUSTOM REVEAL.JS INTEGRATION
[].slice.call( document.querySelectorAll( 'pre code' ) ).forEach( function( element ) {
	element.addEventListener( 'focusout', function( event ) {
		hljs.highlightBlock( event.currentTarget );
	}, false );
} );
// END CUSTOM REVEAL.JS INTEGRATION
