var getRowDims = function() {
	return 12 + Math.round( Math.random() * 12 );
}
var getColumnDims = function() {
	return 24 + Math.round( Math.random() * 12 );
}
var getData = function( rowDims, columnDims ) {
	var data = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var row = new Array( columnDims );
		for ( var t = 0; t < columnDims; t++ )
		{
			var scale = Math.random() * 100;
			var value = 1 - Math.random() * 2;
			value = Math.max( 0, value );
			value = Math.pow( value, 3 ) * scale;
			row[t] = value;
		}
		data[s] = row;
	}
	return data;
}
var getOrdering = function( N ) {
	var list = [];
	for ( var i = 0; i < N; i++ )
		list.push( { 'index' : i, 'value' : Math.random() } );
	list.sort( function(a,b) { return a.value - b.value } );
	return list.map( function(d) { return d.index } );
}
var getVisibles = function( N ) {
	var visibles = [];
	for ( var i = 0; i < N; i++ )
		if ( Math.random() < 0.8 )
			visibles.push( i );
	return visibles;
};

var eventLogger = function( source ) {
	return function( e ) {
		var logger = d3.select( "div.EventLogger" );
		if ( e.slice( 0, 8 ) == "updated:" || e.slice( 0, 10 ) == "refreshed:" || e.slice( 0, 6 ) == "fired:" ) {
			logger.append( "div" ).attr( "class", "event" ).text( "[" + source + "] " + e );
			logger[0][0].scrollTop = logger[0][0].scrollHeight;
		}
	}
};

var defineBasicUIs = function( model, vis ) {
	model.listenTo( vis, "fired:enter:row", function(e) { model.highlightRow( e.data.index ) } );
	model.listenTo( vis, "fired:exit:row", function(e) { model.unhighlightAllRows() } );
	model.listenTo( vis, "fired:click:row", function(e) { model.toggleRow( e.data.index ); model.unhighlightAllRows() } );
	model.listenTo( vis, "fired:dragdrop:row", function(e) {
		if ( e.isDropBefore )
			model.moveRowBefore( e.sourceData.index, e.targetData.index );
		else
			model.moveRowAfter( e.sourceData.index, e.targetData.index );
		 model.unhighlightAllRows();
	});
	model.listenTo( vis, "fired:enter:column", function(e) { model.highlightColumn( e.data.index ) } );
	model.listenTo( vis, "fired:exit:column", function(e) { model.unhighlightAllColumns() } );
	model.listenTo( vis, "fired:click:column", function(e) { model.toggleColumn( e.data.index ); model.unhighlightAllColumns() } );
	model.listenTo( vis, "fired:dragdrop:column", function(e) {
		if ( e.isDropBefore )
			model.moveColumnBefore( e.sourceData.index, e.targetData.index );
		else
			model.moveColumnAfter( e.sourceData.index, e.targetData.index );
		 model.unhighlightAllColumns();
	});
	model.listenTo( vis, "fired:enter:cell", function(e) { model.highlightColumn( e.data.columnIndex ) } );
	model.listenTo( vis, "fired:exit:cell", function(e) { model.unhighlightAllColumns() } );
	model.listenTo( vis, "fired:click:cell", function(e) { model.toggleColumn( e.data.columnIndex ); model.unhighlightAllColumns() } );
};
