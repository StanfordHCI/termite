
// Node.js: Load required libraries
if ( typeof module != "undefined" )
{
	chai = require( "chai" );
	$ = require( "jquery" );
	_ = require( "underscore" );
	Backbone = require( "backbone" );
	TermTopicMatrixObject = require( "../client_source/js/TermTopicMatrixObject.js" );
}

function eventLogging( source, eventList, eventPrefix ) {
	eventPrefix = eventPrefix || "updated:";
	source.listenTo( source, "all", function(e) {
		if ( e.slice(0, 8) == eventPrefix ) { eventList.push(e) }
	});
} 

describe( "TermTopicMatrixObject:", function() {
	var DELAY = 100;
	var data = [ [ 5, 7, 13, 1 ], [ 0, 11, 2 ] ];
	var rowLabels = [ "alice", "bob" ];
	var columnLabels = [ "first", "second", "third" ];

	describe( "An empty matrix", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject();
		eventLogging( model, eventList );

	    it( "is waiting for "+DELAY+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY, done );
		});
	    it( "should have 0 rows", function() {
			chai.assert.equal( model.get( "rowDims" ), 0 );
		});
	    it( "should have 0 columns", function() {
			chai.assert.equal( model.get( "columnDims" ), 0 );
		});
	    it( "should have 0 matrix entries", function() {
			chai.assert.equal( model.get( "entries" ).length, 0 );
		});
	    it( "should be a 0-by-0 full matrix", function() {
			chai.assert.equal( model.get( "fullMatrix" ).length, 0 );
		});
	    it( "should be a 0-element sparse matrix", function() {
			chai.assert.equal( model.get( "sparseMatrix" ).length, 0 );
		});
	    it( "should have 0 visible rows", function() {
			chai.assert.equal( model.get( "visibleRowDims" ), 0 );
		});
	    it( "should have 0 visible columns", function() {
			chai.assert.equal( model.get( "visibleColumnDims" ), 0 );
		});
	    it( "should have fired 0 update events", function() {
			chai.assert.equal( eventList.length, 0 );
		});
	});
	
	describe( "A 3×5 matrix", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject();
		eventLogging( model, eventList );
		model.importMatrix( data, 3, 5 );
		
	    it( "is waiting for "+DELAY+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY, done );
		});
	    it( "should have 3 rows", function() {
			chai.assert.equal( model.get( "rowDims" ), 3 );
		});
	    it( "should have 5 columns", function() {
			chai.assert.equal( model.get( "columnDims" ), 5 );
		});
	    it( "should have 15 matrix entries", function() {
			chai.assert.equal( model.get( "entries" ).length, 15 );
		});
	    it( "should be a 3-by-5 full matrix", function() {
			chai.assert.equal( model.get( "fullMatrix" ).length, 3 );
			for ( var i = 0; i < 3; i++ )
				chai.assert.equal( model.get( "fullMatrix" )[i].length, 5 );
		});
	    it( "should be a 6-element sparse matrix", function() {
			chai.assert.equal( model.get( "sparseMatrix" ).length, 6 );
		});
	    it( "should have 3 visible rows", function() {
			chai.assert.equal( model.get( "visibleRowDims" ), 3 );
		});
	    it( "should have 5 visible columns", function() {
			chai.assert.equal( model.get( "visibleColumnDims" ), 5 );
		});
	    it( "should have fired 6 update events [ :data, :normalization, :visibility, :ordering, :label, :selection ]", function() {
			var expectedList = [ "updated:data", "updated:normalization", "updated:visibility", "updated:ordering", "updated:label", "updated:selection" ];
			chai.assert.equal( eventList.length, expectedList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert( eventList.indexOf( expectedList[i] ) >= 0, "event '"+expectedList[i]+"' not found" );
		});
	});
	
	describe( "A matrix with user-defined visibility", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject().importMatrix( data, 3, 5 );
		setTimeout( function(f){f()}, DELAY, function() {
			eventLogging( model, eventList );
			model.showRows( [ 0, 1 ] )
				.showColumns( [ 3, 1, 2 ] );
		});
		
	    it( "is waiting for "+DELAY*2+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY*2, done );
		});
	    it( "should have 2 visible rows", function() {
			chai.assert.equal( model.get( "visibleRowDims" ), 2 );
		});
	    it( "should have 3 visible columns", function() {
			chai.assert.equal( model.get( "visibleColumnDims" ), 3 );
		});
	    it( "should contain rowVisibleIndexes = [ 0, 1 ]", function() {
			chai.assert.equal( model.get( "rowVisibleIndexes" ).length, 2 );
			chai.assert.equal( model.get( "rowVisibleIndexes" )[0], 0 );
			chai.assert.equal( model.get( "rowVisibleIndexes" )[1], 1 );
		});
	    it( "should contain columnVisibleIndexes = [ 1, 2, 3 ]", function() {
			chai.assert.equal( model.get( "columnVisibleIndexes" ).length, 3 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[0], 1 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[1], 2 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[2], 3 );
		});
	    it( "should set rowElements.isVisible = [ true, true, false ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].isVisible, true );
			chai.assert.equal( model.get( "rowElements" )[1].isVisible, true );
			chai.assert.equal( model.get( "rowElements" )[2].isVisible, false );
		});
	    it( "should set columnElements.isVisible = [ false, true, true, true, false ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].isVisible, false );
			chai.assert.equal( model.get( "columnElements" )[1].isVisible, true );
			chai.assert.equal( model.get( "columnElements" )[2].isVisible, true );
			chai.assert.equal( model.get( "columnElements" )[3].isVisible, true );
			chai.assert.equal( model.get( "columnElements" )[4].isVisible, false );
		});
	    it( "should have fired 3 update events [ :visibility, :ordering, :selection ]", function() {
			var expectedList = [ "updated:visibility", "updated:ordering", "updated:selection" ];
			chai.assert.equal( expectedList.length, eventList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert.equal( eventList.indexOf( expectedList[i] ) >= 0, true );
		});
	});

	describe( "A matrix with user-defined ordering", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject().importMatrix( data, 3, 5 );
		setTimeout( function(f){f()}, DELAY, function() {
			eventLogging( model, eventList );
			model.orderRows( [ 1, 0 ] )
				.orderColumns( [ 3, 1, 4, 2 ] );
		});
		
	    it( "is waiting for "+DELAY*2+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY*2, done );
		});
	    it( "should have 3 rowOrdering entries", function() {
			chai.assert.equal( model.get( "rowOrdering" ).length, 3 );
		});
	    it( "should have 5 columnOrdering entries", function() {
			chai.assert.equal( model.get( "columnOrdering" ).length, 5 );
		});
	    it( "should contain rowVisibleIndexes = [ 1, 0, 2 ]", function() {
			chai.assert.equal( model.get( "rowVisibleIndexes" ).length, 3 );
			chai.assert.equal( model.get( "rowVisibleIndexes" )[0], 1 );
			chai.assert.equal( model.get( "rowVisibleIndexes" )[1], 0 );
			chai.assert.equal( model.get( "rowVisibleIndexes" )[2], 2 );
		});
	    it( "should contain columnVisibleIndexes = [ 3, 1, 4, 2, 0 ]", function() {
			chai.assert.equal( model.get( "columnVisibleIndexes" ).length, 5 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[0], 3 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[1], 1 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[2], 4 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[3], 2 );
			chai.assert.equal( model.get( "columnVisibleIndexes" )[4], 0 );
		});
	    it( "should set rowElements.position = [ 1, 0, 2 ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].position, 1 );
			chai.assert.equal( model.get( "rowElements" )[1].position, 0 );
			chai.assert.equal( model.get( "rowElements" )[2].position, 2 );
		});
	    it( "should set columnElements.position = [ 4, 1, 3, 0, 2 ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].position, 4 );
			chai.assert.equal( model.get( "columnElements" )[1].position, 1 );
			chai.assert.equal( model.get( "columnElements" )[2].position, 3 );
			chai.assert.equal( model.get( "columnElements" )[3].position, 0 );
			chai.assert.equal( model.get( "columnElements" )[4].position, 2 );
		});
	    it( "should have fired 1 update event [ :ordering ]", function() {
			var expectedList = [ "updated:ordering" ];
			chai.assert.equal( expectedList.length, eventList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert.equal( eventList.indexOf( expectedList[i] ) >= 0, true );
		});
	});

	describe( "A matrix with user-defined selections", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject().importMatrix( data, 3, 5 );
		setTimeout( function(f){f()}, DELAY, function() {
			eventLogging( model, eventList );
			model.selectRow( 1 )
				.selectColumn( 2 )
				.selectColumn( 3 )
				.selectColumn( 0 )
				.deselectColumn( 3 );
		});
		
	    it( "is waiting for "+DELAY*2+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY*2, done );
		});
	    it( "should have 3 rowSelections records", function() {
			chai.assert.equal( model.get( "rowSelections" ).length, 3 );
		});
	    it( "should have 5 columnSelections records", function() {
			chai.assert.equal( model.get( "columnSelections" ).length, 5 );
		});
	    it( "should contain rowSelectedIndexes = [ 1 ]", function() {
			chai.assert.equal( model.get( "rowSelectedIndexes" ).length, 1 );
			chai.assert.equal( model.get( "rowSelectedIndexes" )[0], 1 );
		});
	    it( "should contain columnSelectedIndexes = [ 0, 2 ]", function() {
			chai.assert.equal( model.get( "columnSelectedIndexes" ).length, 2 );
			chai.assert.equal( model.get( "columnSelectedIndexes" )[0], 0 );
			chai.assert.equal( model.get( "columnSelectedIndexes" )[1], 2 );
		});
	    it( "should contain rowSelectIDs = [ -1, 1, -1 ]", function() {
			chai.assert.equal( model.get( "rowSelectIDs" )[0], -1 );
			chai.assert.equal( model.get( "rowSelectIDs" )[1], 1 );
			chai.assert.equal( model.get( "rowSelectIDs" )[2], -1 );
		});
	    it( "should contain columnSelectIDs = [ 3, -1, 1, -1 -1 ]", function() {
			chai.assert.equal( model.get( "columnSelectIDs" )[0], 3 );
			chai.assert.equal( model.get( "columnSelectIDs" )[1], -1 );
			chai.assert.equal( model.get( "columnSelectIDs" )[2], 1 );
			chai.assert.equal( model.get( "columnSelectIDs" )[3], -1 );
			chai.assert.equal( model.get( "columnSelectIDs" )[4], -1 );
		});
	    it( "should set rowElements.isSelected = [ false, true, false ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].isSelected, false );
			chai.assert.equal( model.get( "rowElements" )[1].isSelected, true );
			chai.assert.equal( model.get( "rowElements" )[2].isSelected, false );
		});
	    it( "should match columnElements.isSelected = [ true, false, true, false, false ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].isSelected, true );
			chai.assert.equal( model.get( "columnElements" )[1].isSelected, false );
			chai.assert.equal( model.get( "columnElements" )[2].isSelected, true );
			chai.assert.equal( model.get( "columnElements" )[3].isSelected, false );
			chai.assert.equal( model.get( "columnElements" )[4].isSelected, false );
		});
	    it( "should set rowElements.selectID = [ -1, 1, -1 ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].selectID, -1 );
			chai.assert.equal( model.get( "rowElements" )[1].selectID, 1 );
			chai.assert.equal( model.get( "rowElements" )[2].selectID, -1 );
		});
	    it( "should match columnElements.selectID = [ 3, -1, 1, -1, -1 ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].selectID, 3 );
			chai.assert.equal( model.get( "columnElements" )[1].selectID, -1 );
			chai.assert.equal( model.get( "columnElements" )[2].selectID, 1 );
			chai.assert.equal( model.get( "columnElements" )[3].selectID, -1 );
			chai.assert.equal( model.get( "columnElements" )[4].selectID, -1 );
		});
	    it( "should have fired 1 update event [ :selection ]", function() {
			var expectedList = [ "updated:selection" ];
			chai.assert.equal( eventList.length, expectedList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert.equal( eventList.indexOf( expectedList[i] ) >= 0, true );
		});
	});

	describe( "A matrix with user-defined selections and highlights", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject().importMatrix( data, 3, 5 );
		setTimeout( function(f){f()}, DELAY, function() {
			eventLogging( model, eventList );
			model.selectRow( 1 )
				.selectColumn( 2 )
				.selectColumn( 3 )
				.selectColumn( 0 )
				.deselectColumn( 3 )
				.highlightRow( 4 )
				.highlightColumn( 1 )
				.unhighlightAllRows()
				.orderColumns( [ 4, 3, 2, 1, 0 ] );
		});
		
	    it( "is waiting for "+DELAY*2+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY*2, done );
		});
	    it( "should have 3 rowSelections records", function() {
			chai.assert.equal( model.get( "rowSelections" ).length, 3 );
		});
	    it( "should have 5 columnSelections records", function() {
			chai.assert.equal( model.get( "columnSelections" ).length, 5 );
		});
	    it( "should contain rowSelectedIndexes = [ 1 ]", function() {
			chai.assert.equal( model.get( "rowSelectedIndexes" ).length, 1 );
			chai.assert.equal( model.get( "rowSelectedIndexes" )[0], 1 );
		});
	    it( "should contain columnSelectedIndexes = [ 2, 1, 0 ]", function() {
			chai.assert.equal( model.get( "columnSelectedIndexes" ).length, 3 );
			chai.assert.equal( model.get( "columnSelectedIndexes" )[0], 2 );
			chai.assert.equal( model.get( "columnSelectedIndexes" )[1], 1 );
			chai.assert.equal( model.get( "columnSelectedIndexes" )[2], 0 );
		});
	    it( "should contain rowSelectIDs = [ -1, 1, -1 ]", function() {
			chai.assert.equal( model.get( "rowSelectIDs" )[0], -1 );
			chai.assert.equal( model.get( "rowSelectIDs" )[1], 1 );
			chai.assert.equal( model.get( "rowSelectIDs" )[2], -1 );
		});
	    it( "should contain columnSelectIDs = [ 1, 0, 3, -1, -1 ]", function() {
			chai.assert.equal( model.get( "columnSelectIDs" )[0], 3 );
			chai.assert.equal( model.get( "columnSelectIDs" )[1], 0 );
			chai.assert.equal( model.get( "columnSelectIDs" )[2], 1 );
			chai.assert.equal( model.get( "columnSelectIDs" )[3], -1 );
			chai.assert.equal( model.get( "columnSelectIDs" )[4], -1 );
		});
	    it( "should set rowElements.isSelected = [ false, true, false ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].isSelected, false );
			chai.assert.equal( model.get( "rowElements" )[1].isSelected, true );
			chai.assert.equal( model.get( "rowElements" )[2].isSelected, false );
		});
	    it( "should match columnElements.isSelected = [ true, true, true, false, false ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].isSelected, true );
			chai.assert.equal( model.get( "columnElements" )[1].isSelected, true );
			chai.assert.equal( model.get( "columnElements" )[2].isSelected, true );
			chai.assert.equal( model.get( "columnElements" )[3].isSelected, false );
			chai.assert.equal( model.get( "columnElements" )[4].isSelected, false );
		});
	    it( "should set rowElements.selectID = [ -1, 1, -1 ]", function() {
			chai.assert.equal( model.get( "rowElements" ).length, 3 );
			chai.assert.equal( model.get( "rowElements" )[0].selectID, -1 );
			chai.assert.equal( model.get( "rowElements" )[1].selectID, 1 );
			chai.assert.equal( model.get( "rowElements" )[2].selectID, -1 );
		});
	    it( "should match columnElements.selectID = [ 3, 0, 1, -1, -1 ]", function() {
			chai.assert.equal( model.get( "columnElements" ).length, 5 );
			chai.assert.equal( model.get( "columnElements" )[0].selectID, 3 );
			chai.assert.equal( model.get( "columnElements" )[1].selectID, 0 );
			chai.assert.equal( model.get( "columnElements" )[2].selectID, 1 );
			chai.assert.equal( model.get( "columnElements" )[3].selectID, -1 );
			chai.assert.equal( model.get( "columnElements" )[4].selectID, -1 );
		});
	    it( "should have fired 2 update events [ :selection, :ordering ]", function() {
			var expectedList = [ "updated:selection", "updated:ordering" ];
			chai.assert.equal( eventList.length, expectedList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert( eventList.indexOf( expectedList[i] ) >= 0, "event '"+expectedList[i]+"' not found" );
		});
	});

	describe( "A matrix with labels", function() {
		var eventList = [];
		var model = new TermTopicMatrixObject().importMatrix( data, 3, 5 );
		setTimeout( function(f){f()}, DELAY, function() {
			eventLogging( model, eventList );
			model.labelRows( rowLabels )
				.labelColumns( columnLabels );
		});
		
	    it( "is waiting for "+DELAY+" msec", function(done) {
			setTimeout( function(f){f()}, DELAY, done );
		});
	    it( "should have 3 row labels", function() {
			chai.assert.equal( model.get( "rowLabels" ).length, 3 );
		});
	    it( "should have 5 column labels", function() {
			chai.assert.equal( model.get( "columnLabels" ).length, 5 );
		});
	    it( "should match the 2 user-defined [ alice, bob ] and 1 default [ Term #3 ] row labels", function() {
			for ( var i = 0; i < 2; i++ )
				chai.assert.equal( model.get( "rowLabels" )[i], rowLabels[i] );
			chai.assert.equal( model.get( "rowLabels" )[2], "Term #3" );
		});
	    it( "should match the 3 user-defined [ first, second, third ] and 2 default [ Topic #4, Topic #5 ] column labels", function() {
			for ( var i = 0; i < 3; i++ )
				chai.assert.equal( model.get( "columnLabels" )[i], columnLabels[i] );
			chai.assert.equal( model.get( "columnLabels" )[3], "Topic #4" );
			chai.assert.equal( model.get( "columnLabels" )[4], "Topic #5" );
		});
	    it( "should have fired 1 update event [ :label ]", function() {
			var expectedList = [ "updated:label" ];
			chai.assert.equal( eventList.length, expectedList.length );
			for ( var i = 0; i < expectedList.length; i++ )
				chai.assert( eventList.indexOf( expectedList[i] ) >= 0, "event '"+expectedList[i]+"' not found" );
		});
	});
});
