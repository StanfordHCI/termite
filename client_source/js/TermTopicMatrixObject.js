/**
 * Initialize a TermTopicMatrixObject.
 * @class An object for storing a term-topic matrix and its associated annotations, including
 *   a list of term texts,
 *   a list of topic labels,
 *   the ordering of terms and topics,
 *   the visibilities of terms and topics,
 *   the selections of terms and topics,
 *   and user-defined highlights.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var TermTopicMatrixObject = Backbone.Model.extend({
	defaults: {
		// PARAMETERS
		"normalization" : "none",   // Whether to normalize entries by row, column, or neither
		"rowVisibilities" : [],     // Which rows to display
		"columnVisibilities" : [],  // Which columns to display
		"rowOrdering" : [],         // How to order the rows
		"columnOrdering" : [],      // How to order the columns
									//   [ 1 2 3 4 5 6 ] -> [ 4 2 1 6 5 3 ]
									//   ordering = [ 4 2 1 6 5 3 ] is the mapping from input index to output ordering
									//   positions = [ 3 2 6 1 5 4 ] is the mapping from output ordering to input index
									//   [ 1 2 - - 5 6 ] --> [ 2 1 6 5 ] with partial visibility
									//   ordering = [ 2 1 6 5 ]
									//   positions = [ 2 1 - - 4 3 ]
		"rowSelections" : [],       // Which rows are selected, and their selectID
		"columnSelections" : [],    // Which columns are selected, and their selectID
		"rowHighlights" : [],       // Which rows to highlight
		"columnHighlights" : [],    // Which columns to highlight
		"rowLabels" : [],           // Descriptions for row elements
		"columnLabels" : [],        // Descriptions for column elements
		
		// DATA
		"rowDims" : 0,
		"columnDims" : 0,
		"fullMatrix" : [],      // All entries in the matrix as a 2D array
		"entries" : [],         // All entries in the matrix as an 1D array
		"sparseMatrix" : [],    // All non-zero entries in the matrix as an 1D array
		"rowElements" : [],     // Summary information on the rows in the matrix
		"columnElements" : [],  // Summary information on the columns of the matrix

		// DERIVED PARAMETERS
		"rowVisibleIndexes" : [],     // Ordered list of visible rows
		"columnVisibleIndexes" : [],  // Ordered list of visible columns
		"rowSelectedIndexes" : [],    // Ordered list of selected rows
		"columnSelectedIndexes" : [], // Ordered list of selected columns
		"rowSelectIDs" : [],          // Selection IDs associated with each row
		"columnSelectIDs" : [],       // Selection IDs assocaited with each column
		"rowPositions" : [],          // Row positions, including interpolated non-interger indexes for invisible rows
		"columnPositions" : [],       // Column positions, including interpolated non-integer indexes for invisible columns
				
		// DERIVED DATA
		"visibleRowDims" : [],     // Number of visible rows
		"visibleColumnDims" : [],  // Number of visible columns
		"selectedRowDims" : [],    // Number of selected rows
		"selectedColumnDims" : [], // Number of selected columns
		
		"maxJointProbability" : 0,
		"maxRowMarginalProbability" : 0,
		"maxColumnMarginalProbability" : 0,
		"rowRescaleMultiplier" : 0,
		"columnRescaleMultiplier" : 0,
		"maxValue" : 0,
		"maxRowValue" : 0,
		"maxColumnValue" : 0
	}
});

//--------------------------------------------------------------------------------------------------

/**
 * A list of six events that can be triggered by TermTopicMatrixObject: data, normalization, visibility, ordering, selection, label
 * @constant
 **/
TermTopicMatrixObject.prototype.UPDATE_EVENTS = {
	DATA : "data",
	NORMALIZATION : "normalization",
	VISIBILITY : "visibility",
	ORDERING : "ordering",
	SELECTION : "selection",
	LABEL : "label"
};

/**
 * @constant
 **/
TermTopicMatrixObject.prototype.CONSTANTS = {};

/**
 * Matrix cells whose values are less than this threshold, in all of the three views
 * (joint probability, conditional probability on rows, conditional probability on columns)
 * are excluded in the sparseMatrix representation.
 * @constant
 **/
TermTopicMatrixObject.prototype.CONSTANTS.MIN_VALUE_THRESHOLD = 0.001;

/**
 * Updates applied to the term-topic matrix within the debounce duration are combined
 * into a single update for more efficient computation.
 * @constant
 **/
TermTopicMatrixObject.prototype.CONSTANTS.DEBOUNCE_DURATION = 10;

//--------------------------------------------------------------------------------------------------

/**
 * All public methods write their changes to __pendingUpdates.
 * All pending updates are processed after 10ms of inactivity.
 * @private
 **/
TermTopicMatrixObject.prototype.initialize = function() {
	this.__pendingUpdates = {};
	this.__update = _.debounce( this.__updatePendingStates, this.CONSTANTS.DEBOUNCE_DURATION );
};

//--------------------------------------------------------------------------------------------------

/**
 * Normalize all matrix entries by rows, columns, or neither.
 * Normalization produces a conditional probability distributions P(topic|term) or P(term|topic).
 * Otherwise, joint probability distributions P(term, topic) are generated.
 * @param {string} normalization One of 'row', 'column', or 'none'.
 **/
TermTopicMatrixObject.prototype.normalize = function( normalization )
{
	if ( normalization == "row" || normalization == "column" || normalization == "none" )
	{
		this.__set( "normalization", normalization );
		this.__update();
	}
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetNormalization = function()
{
	this.__set( "normalization", "none" );
	this.__update();
	return this;
};

//--------------------------------------------------------------------------------------------------

/**
 * Define a list of visible rows.
 * @param {Array.<number>} [rowIndexes] An array of integer indexes between 0 and rowDims-1. An empty argument sets all rows visible.
 **/
TermTopicMatrixObject.prototype.showRows = function( rowIndexes )
{
	var rowDims = this.__get( "rowDims" );
	if ( rowIndexes === undefined )
		rowVisibilities = this.__showAll( rowDims );
	else
		rowVisibilities = this.__sanitizeVisibilityIndexes( rowIndexes || [], rowDims );
	this.__set( "rowVisibilities", rowVisibilities );
	this.__update();
	return this;
};

/**
 * Define a list of visible columns.
 * @param {Array.<number>} [columnIndexes] An array of integer indexes between 0 and columnDims-1. An empty argument sets all columns visible.
 **/
TermTopicMatrixObject.prototype.showColumns = function( columnIndexes )
{
	var columnDims = this.__get( "columnDims" );
	if ( columnIndexes === undefined )
		columnVisibilities = this.__showAll( columnDims );
	else
		columnVisibilities = this.__sanitizeVisibilityIndexes( columnIndexes || [], columnDims );	
	this.__set( "columnVisibilities", columnVisibilities );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetVisibilities = function()
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	var rowVisibilities = this.__showAll( rowDims );
	var columnVisibilities = this.__showAll( columnDims );
	this.__set( "rowVisibilities", rowVisibilities );
	this.__set( "columnVisibilities", columnVisibilities );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeVisibilityIndexes = function( list, N )
{
	var visibilities = new Array( N );
	for ( var i = 0; i < visibilities.length; i++ )
		visibilities[ i ] = false;
	for ( var i = 0; i < list.length; i++ )
	{
		var index = parseInt( list[i], 10 );
		if ( 0 <= index  &&  index < N )
			visibilities[ index ] = true;
	}
	return visibilities;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__showAll = function( N )
{
	var visibilities = new Array( N );
	for ( var i = 0; i < visibilities.length; i++ )
		visibilities[ i ] = true;
	return visibilities;
}

//--------------------------------------------------------------------------------------------------

/**
 * Define the ordering of rows (terms).
 * @param {Array.<number>} rowOrdering An array of integer indexes bewteen 0 and rowDims-1.
 **/
TermTopicMatrixObject.prototype.orderRows = function( rowOrdering )
{
	var rowDims = this.__get( "rowDims" );
	rowOrdering = this.__sanitizeAndCompleteOrderingIndexes( rowOrdering || [], rowDims );
	this.__set( "rowOrdering", rowOrdering );
	this.__update();
	return this;
};

/**
 * Define the ordering of columns (topics).
 * @param {Array.<number>} columnOrdering An array of integer indexes bewteen 0 and columnDims-1.
 **/
TermTopicMatrixObject.prototype.orderColumns = function( columnOrdering )
{
	var columnDims = this.__get( "columnDims" );
	columnOrdering = this.__sanitizeAndCompleteOrderingIndexes( columnOrdering || [], columnDims );
	this.__set( "columnOrdering", columnOrdering );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetOrdering = function()
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	var rowOrdering = _.range( 0, rowDims );
	var columnOrdering = _.range( 0, columnDims );
	this.__set( "rowOrdering", rowOrdering );
	this.__set( "columnOrdering", columnOrdering );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndCompleteOrderingIndexes = function( list, N )
{
	var indexes = [];
	var existingIndexes = {};
	for ( var i = 0; i < list.length; i++ )
	{
		var index = parseInt( list[i], 10 );
		if ( ! existingIndexes.hasOwnProperty(index)  &&  0 <= index  &&  index < N )
		{
			existingIndexes[ index ] = true;
			indexes.push( index );
		}
	}
	for ( var index = 0; index < N; index++ )
		if ( ! existingIndexes.hasOwnProperty(index) )
			indexes.push( index );
	return indexes;
};

/**
 * Smooth interpolation of element positions.
 * Invisible elements are placed in between visible elements, instead of assigned arbitrary
 * position such as -1 which causes undesirable animated transitions.
 * @private
 **/
TermTopicMatrixObject.prototype.__interpolateOrderingPositions = function( ordering, visibilities, N )
{
	// Prepare the data structure for storing computed positions.
	var positions = new Array( N );

	// Identify the list of visible elements and their indexes.
	var subOrdering = [];
	var subIndexes = [];
	for ( var i = 0; i < N; i++ )
	{
		var d = ordering[i];
		if ( visibilities[d] )
		{
			subOrdering.push(d);
			subIndexes.push(i);
		}
	}
	
	// Assign all visible elements a position from 0 to N'.
	for ( var i = 0; i < subOrdering.length; i++ )
		positions[ subOrdering[i] ] = i;
		
	// If the first element is not visible, assign it a position of 0.
	if ( subIndexes.indexOf(0) == -1 )
	{
		positions[ ordering[0] ] = 0;
		subIndexes.splice( 0, 0, 0 );
	}
	// If the final element is not visible, assing it a position of N' - 1.
	if ( subIndexes.indexOf(N-1) == -1 )
	{
		positions[ ordering[N-1] ] = subOrdering.length - 1;
		subIndexes.push( N-1 );
	}

	// For all others, linearly interpolate between elements with known positions
	for ( var i = 0; i < subIndexes.length - 1; i++ )
	{
		var a = subIndexes[i];
		var b = subIndexes[i+1];
		var aPosition = positions[ ordering[a] ];
		var bPosition = positions[ ordering[b] ];
		for ( var j = a; j < b; j++ )
		{
			var aFraction = ( b - j ) / ( b - a );
			var bFraction = ( j - a ) / ( b - a );
			var jPosition = aPosition * aFraction + bPosition * bFraction;
			positions[ ordering[j] ] = jPosition;
		}
	}
	return positions;
};

//--------------------------------------------------------------------------------------------------

/**
 * Add a row to the current selection.
 * Assign the next positive avaiable selection ID if none is specified.
 * @param {number} rowIndex An integer between 0 and rowDims-1.
 * @param {number} [selectID] A positive integer.
 **/
TermTopicMatrixObject.prototype.selectRow = function( rowIndex, selectID )
{
	var rowDims = this.__get( "rowDims" );
	var rowSelections = this.__get( "rowSelections" );
	selectID = selectID || this.__getNextAvailableSelectID( rowSelections );
	rowSelections = this.__sanitizeAndInsertSelectionIndex( rowSelections, rowDims, rowIndex, selectID );
	this.__set( "rowSelections", rowSelections );
	this.__update();
	return this;
};

/**
 * Remove a row from the current selection.
 * @param {number} rowIndex An integer between 0 and rowDims-1.
 **/
TermTopicMatrixObject.prototype.deselectRow = function( rowIndex )
{
	var rowDims = this.__get( "rowDims" );
	var rowSelections = this.__get( "rowSelections" );
	rowSelections = this.__sanitizeAndRemoveSelectionIndex( rowSelections, rowDims, rowIndex );
	this.__set( "rowSelections", rowSelections );
	this.__update();
	return this;
};

/**
 * Remove all rows from the current selection.
 **/
TermTopicMatrixObject.prototype.deselectAllRows = function()
{
	var rowDims = this.__get( "rowDims" );
	this.__set( "rowSelections", this.__selectNone( rowDims ) );
	this.__update();
	return this;
};

/**
 * Add a column to the current selection
 * Assign the next positive avaiable selection ID if none is specified.
 * @param {number} columnIndex An integer between 0 and columnDims-1.
 * @param {number} [selectID] A positive integer.
 **/
TermTopicMatrixObject.prototype.selectColumn = function( columnIndex, selectID )
{
	var columnDims = this.__get( "columnDims" );
	var columnSelections = this.__get( "columnSelections" );
	selectID = selectID || this.__getNextAvailableSelectID( columnSelections );
	columnSelections = this.__sanitizeAndInsertSelectionIndex( columnSelections, columnDims, columnIndex, selectID );
	this.__set( "columnSelections", columnSelections );
	this.__update();
	return this;
};

/**
 * Remove a column from the current selection.
 * @param {number} columnIndex An integer between 0 and columnDims-1.
 **/
TermTopicMatrixObject.prototype.deselectColumn = function( columnIndex )
{
	var columnDims = this.__get( "columnDims" );
	var columnSelections = this.__get( "columnSelections" );
	columnSelections = this.__sanitizeAndRemoveSelectionIndex( columnSelections, columnDims, columnIndex );
	this.__set( "columnSelections", columnSelections );
	this.__update();
	return this;
};

/**
 * Remove all columns from the current selection.
 **/
TermTopicMatrixObject.prototype.deselectAllColumns = function()
{
	var columnDims = this.__get( "columnDims" );
	this.__set( "columnSelections", this.__selectNone( columnDims ) );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetSelections = function()
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	this.__set( "rowSelections", this.__selectNone( rowDims ) );
	this.__set( "columnSelections", this.__selectNone( columnDims ) );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__getNextAvailableSelectID = function( selections )
{
	var availableIDs = {};
	for ( var i = 1; i <= selections.length; i++ )
		availableIDs[ i ] = true;
	for ( var i = 0; i < selections.length; i++ )
		availableIDs[ selections[i] ] = false;
	for ( var i = 1; i <= selections.length; i++ )
		if ( availableIDs[ i ] )
			return i;
	return -1;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndInsertSelectionIndex = function( selections, N, index, selectID )
{
	selections = selections.slice(0);
	index = parseInt( index, 10 );
	selectID = parseInt( selectID, 10 );
	if ( 0 <= index  &&  index < N  &&  0 < selectID )
		selections[ index ] = selectID;
	return selections
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndRemoveSelectionIndex = function( selections, N, index )
{
	selections = selections.slice(0);
	index = parseInt( index, 10 );
	if ( 0 <= index  &&  index < N )
		selections[ index ] = -1;
	return selections
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__selectNone = function( N )
{
	var selections = new Array( N );
	for ( var i = 0; i < selections.length; i++ )
		selections[ i ] = -1;
	return selections;
}

/**
 * Generate a list of ordered and unique selectIDs, excluding -1.
 * @private
 **/
TermTopicMatrixObject.prototype.__getUniqueSelectIDs = function( selectIDs )
{
	var sortedKeys = selectIDs.slice(0);
	sortedKeys.sort( function(a,b) { return a - b } );
	var lastKey = -1;
	var sortedUniqueKeys = [];
	for ( var i = 0; i < sortedKeys.length; i++ )
	{
		var currKey = sortedKeys[i];
		if ( currKey == lastKey )
			continue;
		sortedUniqueKeys.push( currKey );
		lastKey = currKey;
	}
	return sortedUniqueKeys;
};


//--------------------------------------------------------------------------------------------------

/**
 * Highlight a row, which receives a selection ID of 0.
 * @param {number} rowIndex An integer between 0 and rowDims-1.
 **/
TermTopicMatrixObject.prototype.highlightRow = function( rowIndex )
{
	var rowDims = this.__get( "rowDims" );
	var rowHighlights = this.__get( "rowHighlights" );
	rowHighlights = this.__sanitizeAndInsertHighlightIndex( rowHighlights, rowDims, rowIndex );
	this.__set( "rowHighlights", rowHighlights );
	this.__update();
	return this;
};

/**
 * Unhighlight all rows.
 **/
TermTopicMatrixObject.prototype.unhighlightAllRows = function()
{
	var rowDims = this.__get( "rowDims" );
	this.__set( "rowHighlights", this.__highlightNone( rowDims ) );
	this.__update();
	return this;
};

/**
 * Highlight a column, which receives a selection ID of 0.
 * @param {number} columnIndex An integer between 0 and columnDims-1.
 **/
TermTopicMatrixObject.prototype.highlightColumn = function( columnIndex )
{
	var columnDims = this.__get( "columnDims" );
	var columnHighlights = this.__get( "columnHighlights" );
	columnHighlights = this.__sanitizeAndInsertHighlightIndex( columnHighlights, columnDims, columnIndex );
	this.__set( "columnHighlights", columnHighlights );
	this.__update();
	return this;
};

/**
 * Unhighlight all columns.
 **/
TermTopicMatrixObject.prototype.unhighlightAllColumns = function()
{
	var columnDims = this.__get( "columnDims" );
	this.__set( "columnHighlights", this.__highlightNone( columnDims ) );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetHighlights = function()
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	this.__set( "rowHighlights", this.__highlightNone( rowDims ) );
	this.__set( "columnHighlights", this.__highlightNone( columnDims ) );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndInsertHighlightIndex = function( highlights, N, index )
{
	highlights = highlights.slice(0);
	index = parseInt( index, 10 );
	if ( 0 <= index  &&  index < N )
		highlights[ index ] = true;
	return highlights
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__highlightNone = function( N )
{
	var highlights = new Array( N );
	for ( var i = 0; i < highlights.length; i++ )
		highlights[ i ] = false;
	return highlights;
}

//--------------------------------------------------------------------------------------------------

/**
 * Set the descriptions for the rows (term texts).
 * @param {Array.<string>} [rowLabels] Descriptions for the rows. If no value is given, a placeholder text is generated for each term.
 **/
TermTopicMatrixObject.prototype.labelRows = function( rowLabels )
{
	var rowDims = this.__get( "rowDims" );
	rowLabels = this.__sanitizeAndGenerateDefaultLabels( rowLabels || [], rowDims, "Term" );
	this.__set( "rowLabels", rowLabels );
	this.__update();
	return this;
};

/**
 * Set the descriptions for the columns (topic labels).
 * @param {Array.<string>} [columnLabels] Descriptions for the columns. If no value is given, a placeholder label is generated for each topic.
 **/
TermTopicMatrixObject.prototype.labelColumns = function( columnLabels )
{
	var columnDims = this.__get( "columnDims" );
	columnLabels = this.__sanitizeAndGenerateDefaultLabels( columnLabels || [], columnDims, "Topic" );
	this.__set( "columnLabels", columnLabels );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__resetLabels = function()
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	var rowLabels = this.__sanitizeAndGenerateDefaultLabels( [], rowDims, "Term" );
	var columnLabels = this.__sanitizeAndGenerateDefaultLabels( [], columnDims, "Topic" );	
	this.__set( "rowLabels", rowLabels );
	this.__set( "columnLabels", columnLabels );
	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndGenerateDefaultLabels = function( labels, N, prefix )
{
	labels = labels.slice( 0, N );
	if ( labels.length < N )
		for ( var index = labels.length; index < N; index++ )
			labels.push( prefix + " #" + (index+1) );
	return labels;
};

//--------------------------------------------------------------------------------------------------

/**
 * Read in an array of matrix entries.
 * Infer row and column dimensions from input data, if necessary.
 * @param {Array.<Object<string,number>>} entries An array of entries in the form of { rowIndex: number, columnIndex: number, value: number }
 * @param {number} [rowDims] Number of rows in the matrix.
 * @param {number} [columnDims] Number of columns in the matrix.
 **/
TermTopicMatrixObject.prototype.importEntries = function( entries, rowDims, columnDims )
{
	// Infer matrix dimensions
	if ( rowDims === undefined )
		rowDims = _.max( entries.map( function(d) { return d.rowIndex } ) ) + 1;
	if ( columnDims === undefined )
		columnDims = _.max( entries.map( function(d) { return d.columnIndex } ) ) + 1;

	// Generate a full matrix of the appropriate dimensions
	var fullMatrix = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var fullRow = new Array( columnDims );
		for ( var t = 0; t < columnDims; t++ )
			fullRow[t] = { 'rowIndex' : s, 'columnIndex' : t, 'absValue' : 0.0 };
		fullMatrix[s] = fullRow;
	}
	// Copy matrix entries
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var s = entry.rowIndex;
		var t = entry.columnIndex;
		if ( entry.rowIndex < rowDims  &&  entry.columnIndex < columnDims )
			fullMatrix[s][t].absValue = entry.value;
	}

	return this.__initMatrix( rowDims, columnDims, fullMatrix );
};

/**
 * Read in a two-dimensional matrix of numbers.
 * Infer row and column dimensions from input data, if necessary.
 * @param {Array.<Array.<number>>} matrix A two dimensional matrix of values for the matrix.
 * @param {number} [rowDims] Number of rows in the matrix.
 * @param {number} [columnDims] Number of columns in the matrix.
 **/
TermTopicMatrixObject.prototype.importMatrix = function( matrix, rowDims, columnDims )
{
	// Infer matrix dimensions
	if ( rowDims === undefined )
		rowDims = matrix.length;
	if ( columnDims === undefined )
		columnDims = _.max( matrix.map( function(d) { return d.length } ) );

	// Generate full matrix of the appropriate dimensions
	var fullMatrix = new Array( rowDims );
	for ( var s = 0; s < rowDims; s++ )
	{
		var fullRow = new Array( columnDims );
		for ( var t = 0; t < columnDims; t++ )
			fullRow[t] = { 'rowIndex' : s, 'columnIndex' : t, 'absValue' : 0.0 };
		fullMatrix[s] = fullRow;
	}
	// Copy matrix values
	var sMax = Math.min( rowDims, matrix.length );
	for ( var s = 0; s < sMax; s++ )
	{
		var tMax = Math.min( columnDims, matrix[s].length );
		for ( var t = 0; t < tMax; t++ )
		{
			fullMatrix[s][t].absValue = matrix[s][t];
		}
	}
	
	return this.__initMatrix( rowDims, columnDims, fullMatrix );
};

//--------------------------------------------------------------------------------------------------

/**
 * Set the dimensions and values of the matrix.
 * @param {number} rowDims
 * @param {number} columnDims
 * @param {Array.<Object<string,number>>} fullMatrix
 * @private
 **/
TermTopicMatrixObject.prototype.__initMatrix = function( rowDims, columnDims, fullMatrix )
{
	this.__set( "rowDims", rowDims );
	this.__set( "columnDims", columnDims );
	this.__set( "fullMatrix", fullMatrix );

	// Initialize entries, rowElements, and columnElements
	this.__initCellElements( rowDims, columnDims, fullMatrix );
	this.__initRowElements( rowDims, columnDims, fullMatrix );
	this.__initColumnElements( rowDims, columnDims, fullMatrix );
	
	// Initialize cell values for the three types of normalizations
	this.__initRelValues();
	this.__initRowRelValues();
	this.__initColumnRelValues();
	
	// Generate a sparse matrix consisting of only cells with sufficiently large values
	this.__initSparseMatrix();

	this.__resetNormalization();
	this.__resetVisibilities();
	this.__resetOrdering();
	this.__resetLabels();
	this.__resetSelections();
	this.__resetHighlights();

	this.__update();
	return this;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initCellElements = function( rowDims, columnDims, fullMatrix )
{
	// Convert full matrix into an 1D array of entries.
	var entries = new Array( rowDims * columnDims );
	var index = 0;
	for ( var s = 0; s < rowDims; s++ )
		for ( var t = 0; t < columnDims; t++ )
			entries[ index++ ] = fullMatrix[s][t];
			
	// Order entries by decreasing weight.
	// Assign entry ranking.
	entries.sort( function(a,b) { return b.absValue - a.absValue } );
	for ( var n = 0; n < entries.length; n++ )
		entries[n].ranking = n;
	
	this.__set( "entries", entries );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initRowElements = function( rowDims, columnDims, fullMatrix )
{
	// Create row elements.
	var rowElements = new Array( rowDims );
	var totalAbsValue = 0.0;
	var maxAbsValue = 0.0;
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = { 'index' : s, 'absValue' : 0.0, 'dataType' : "row" };
		for ( var t = 0; t < columnDims; t++ )
			element.absValue += fullMatrix[s][t].absValue;
		rowElements[s] = element;
		totalAbsValue += element.absValue;
		maxAbsValue = Math.max( maxAbsValue, element.absValue );
	}
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		element.relValue = element.absValue / totalAbsValue;
	}

	// Assign row ranking.
	var orderedElements = rowElements.slice(0);
	orderedElements.sort( function(a,b) { return b.absValue - a.absValue } );
	orderedElements.forEach( function(d,i) { d.ranking = i } );

	// Generate selection elements
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		element.selectElements = new Array( columnDims );
		for ( var i = 0; i < columnDims; i++ )
			element.selectElements[i] = { 'index' : i };
	}

	this.__set( "rowElements", rowElements );
	this.__set( "maxRowMarginalProbability", maxAbsValue / totalAbsValue );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initColumnElements = function( rowDims, columnDims, fullMatrix )
{
	// Create column elements.
	var columnElements = new Array( columnDims );
	var totalAbsValue = 0.0;
	var maxAbsValue = 0.0;
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = { 'index' : t, 'absValue' : 0.0, 'dataType' : "column" };
		for ( var s = 0; s < rowDims; s++ )
			element.absValue += fullMatrix[s][t].absValue;
		columnElements[t] = element;
		totalAbsValue += element.absValue;
		maxAbsValue = Math.max( maxAbsValue, element.absValue );
	}
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		element.relValue = element.absValue / totalAbsValue;
	}
	
	// Assign column ranking.
	var orderedElements = columnElements.slice(0)
	orderedElements.sort( function(a,b) { return b.absValue - a.absValue } );
	orderedElements.forEach( function(d,i) { d.ranking = i } );
	
	// Generate selection elements
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		element.selectElements = new Array( rowDims );
		for ( var i = 0; i < rowDims; i++ )
			element.selectElements[i] = { 'index' : i };
	}

	this.__set( "columnElements", columnElements );
	this.__set( "maxColumnMarginalProbability", maxAbsValue / totalAbsValue );
};

/**
 * Rescale joint probabilities, so that 'maximum' relValue == 1.
 * Note that, in some cases, it might be desirable to have relValue > 1 to emphasize outliers.
 * @private
 **/
TermTopicMatrixObject.prototype.__initRelValues = function()
{
	var entries = this.__get( "entries" );

	// Determine total and maximum entry value.
	var totalAbsValue = 0.0;
	var maxAbsValue = 0.0;
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		totalAbsValue += entry.absValue;
		maxAbsValue = Math.max( maxAbsValue, entry.absValue );
	}
	
	// Assigned a relValue, based on joint probability so that sum(relValue) == 1.
	var maxValue = maxAbsValue / totalAbsValue;
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		entry.relValue = entry.absValue / totalAbsValue;
	}
	this.__set( "maxJointProbability", maxValue );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initRowRelValues = function()
{
	var entries = this.__get( "entries" );
	var rowElements = this.__get( "rowElements" );
	
	// Assign a rowRelValue
	var totalValue = 0.0;
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var s = entry.rowIndex;
		var element = rowElements[s];
		var value = entry.absValue / element.absValue;
		entry.rowRelValue = value;
		totalValue += value;
	}
	this.__set( "rowRescaleMultiplier", totalValue );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initColumnRelValues = function()
{
	var entries = this.__get( "entries" );
	var columnElements = this.__get( "columnElements" );
	
	// Assign a columnRelValue
	var totalValue = 0.0;
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var t = entry.columnIndex;
		var element = columnElements[t];
		var value = entry.absValue / element.absValue;
		entry.columnRelValue = value;
		totalValue += value;
	}
	this.__set( "columnRescaleMultiplier", totalValue );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__initSparseMatrix = function()
{
	var entries = this.__get( "entries" );
	var rowRescaleMultiplier = this.__get( "rowRescaleMultiplier" );
	var columnRescaleMultiplier = this.__get( "columnRescaleMultiplier" );

	var valueThreshold = this.CONSTANTS.MIN_VALUE_THRESHOLD;
	var rowValueThreshold = this.CONSTANTS.MIN_VALUE_THRESHOLD * rowRescaleMultiplier;
	var columnValueThreshold = this.CONSTANTS.MIN_VALUE_THRESHOLD * columnRescaleMultiplier;
	
	var sparseMatrix = [];
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		if ( entry.relValue >= valueThreshold || entry.rowRelValue >= rowValueThreshold || entry.columnRelValue >= columnValueThreshold )
		{
			sparseMatrix.push( entry );
		}
	}
	this.__set( "sparseMatrix", sparseMatrix );
};

//--------------------------------------------------------------------------------------------------

/**
 * Delay any value written using __set() until after the __update() call.
 * @private
 **/
TermTopicMatrixObject.prototype.__set = function( attribute, value )
{
	this.__pendingUpdates[ attribute ] = value;
};

/**
 * Retrieve any value written using __set() before the __update() call.
 * @private
 **/
TermTopicMatrixObject.prototype.__get = function( attribute )
{
	if ( this.__pendingUpdates.hasOwnProperty( attribute ) )
		return this.__pendingUpdates[ attribute ];
	else
		return this.get( attribute );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__isPending = function( attribute )
{
	return this.__pendingUpdates.hasOwnProperty( attribute );
}

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__isPendingAndChanged = function( attribute )
{
	if ( ! this.__pendingUpdates.hasOwnProperty( attribute ) )
		return false;
	var originalValue = this.get( attribute );
	var pendingValue = this.__pendingUpdates[ attribute ];
	var originalType = ( typeof originalValue );
	var pendingType = ( typeof pendingValue );
	if ( originalType != pendingType )
		return true;
	if ( originalType == "string" || originalType == "number" || originalType == "boolean" )
		return originalValue != pendingValue;
	if ( originalValue.length != pendingValue.length )
		return true;
	for ( var i in originalValue )
		if ( originalValue[i] != pendingValue[i] )
			return true;
	for ( var i in originalValue )
		if ( ! pendingValue.hasOwnProperty(i) )
			return true;
	for ( var i in pendingValue )
		if ( ! originalValue.hasOwnProperty(i) )
			return true;
	return false;
};

/**
 * Update the following attributes...
 * For this object: maxValue, maxRowValue, maxColumnValue
 * For matrix entries: value
 * For row and column elements: value
 * @private
 **/
TermTopicMatrixObject.prototype.__updateNormalization = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var normalization = this.__get( "normalization" );
	var maxValue = null;
	var maxRowValue = null;
	var maxColumnValue = null;
	
	// PART I: Update matrix elements
	if ( normalization == "none" )
	{
		for ( var n = 0; n < entries.length; n++ )
		{
			var entry = entries[n];
			entry.value = entry.relValue;
		}
		maxValue = this.__get( "maxJointProbability" );
	}
	else if ( normalization == "row" )
	{
		for ( var n = 0; n < entries.length; n++ )
		{
			var entry = entries[n];
			entry.value = entry.rowRelValue;
		}
		maxValue = this.__get( "maxJointProbability" ) * this.__get( "rowRescaleMultiplier" );
	}
	else if ( normalization == "column" )
	{
		for ( var n = 0; n < entries.length; n++ )
		{
			var entry = entries[n];
			entry.value = entry.columnRelValue;
		}
		maxValue = this.__get( "maxJointProbability" ) * this.__get( "columnRescaleMultiplier" );
	}

	// PART II: Update row and column elements
	if ( normalization == "row" )
	{
		for ( var s = 0; s < rowDims; s++ )
			rowElements[s].value = 1.0;
		maxRowValue = 1.0;
	}
	else
	{
		for ( var s = 0; s < rowDims; s++ )
		{
			var element = rowElements[s];
			element.value = element.relValue;
		}
		maxRowValue = this.__get( "maxRowMarginalProbability" );
	}
	if ( normalization == "column" )
	{
		for ( var t = 0; t < columnDims; t++ )
			columnElements[t].value = 1.0;
		maxColumnValue = 1.0;
	}
	else
	{
		for ( var t = 0; t < columnDims; t++ )
		{
			var element = columnElements[t];
			element.value = element.relValue;
		}
		maxColumnValue = this.__get( "maxColumnMarginalProbability" );
	}	
	this.__set( "maxValue", maxValue );
	this.__set( "maxRowValue", maxRowValue );
	this.__set( "maxColumnValue", maxColumnValue );		
};

/**
 * Update the following attributes...
 * For cross-reference elements: value
 * @private
 **/
TermTopicMatrixObject.prototype.__updateNormalizationOrSelections = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var fullMatrix = this.__get( "fullMatrix" );
	var normalization = this.__get( "normalization" );
	var rowSelectIDs = this.__get( "rowSelectIDs" );
	var columnSelectIDs = this.__get( "columnSelectIDs" );
	
	// PART III: Update cross-reference elements
	for ( var s = 0; s < rowDims; s++ )
		for ( var t = 0; t < columnDims; t++ )
			rowElements[s].selectElements[t].value = 0.0;
	for ( var t = 0; t < columnDims; t++ )
		for ( var s = 0; s < rowDims; s++ )
			columnElements[t].selectElements[s].value = 0.0;
	
	// Loop through matrix entries to compute cumulative weights.
	for ( var s = 0; s < rowDims; s++ )
		if ( rowSelectIDs[s] >= 0 )
			if ( normalization == "column" )
				for ( var t = 0; t < columnDims; t++ )
					columnElements[t].selectElements[s].value += fullMatrix[s][t].columnRelValue;
			else
				for ( var t = 0; t < columnDims; t++ )
					columnElements[t].selectElements[s].value += fullMatrix[s][t].relValue;
	for ( var t = 0; t < columnDims; t++ )
		if ( columnSelectIDs[t] >= 0 )
			if ( normalization == "row" )
				for ( var s = 0; s < rowDims; s++ )
					rowElements[s].selectElements[t].value += fullMatrix[s][t].rowRelValue;
			else
				for ( var s = 0; s < rowDims; s++ )
					rowElements[s].selectElements[t].value += fullMatrix[s][t].relValue;
};

/**
 * Update the following attributes...
 * For cross-reference elements: startValue, endValue
 * @private
 **/
TermTopicMatrixObject.prototype.__updateNormalizationOrSelectionOrOrdering = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	// NOTE: dependency on normalization or selections are implicit in changes to selectElements.value
	var rowOrdering = this.__get( "rowOrdering" );
	var columnOrdering = this.__get( "columnOrdering" );
	
	// Calculate start and end value.
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		var tally = 0.0;
		for ( var i = 0; i < columnOrdering.length; i++ )
		{
			var t = columnOrdering[i];
			var weights = element.selectElements[t];
			weights.startValue = tally;
			tally += weights.value;
			weights.endValue = tally;
		}
	}
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		var tally = 0.0;
		for ( var i = 0; i < rowOrdering.length; i++ )
		{
			var s = rowOrdering[i];
			var weights = element.selectElements[s];
			weights.startValue = tally;
			tally += weights.value;
			weights.endValue = tally;
		}
	}
};

/**
 * Update the following attributes...
 * For matrix entries, row elements, and column elements: isVisible, isStay, isEnter, isExit
 * @private
 **/
TermTopicMatrixObject.prototype.__updateVisibilities = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var rowVisibilities = this.__get( "rowVisibilities" );
	var columnVisibilities = this.__get( "columnVisibilities" );
	
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		var isVisible = rowVisibilities[s];
		var isPreviouslyVisible = ( element.isVisible || false );
		var isStay = isVisible && isPreviouslyVisible;
		var isEnter = isVisible && ! isPreviouslyVisible;
		var isExit = ! isVisible && isPreviouslyVisible;
		element.isVisible = isVisible;
		element.isStay = isStay;
		element.isEnter = isEnter;
		element.isExit = isExit;
	}
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		var isVisible = columnVisibilities[t];
		var isPreviouslyVisible = ( element.isVisible || false );
		var isStay = isVisible && isPreviouslyVisible;
		var isEnter = isVisible && ! isPreviouslyVisible;
		var isExit = ! isVisible && isPreviouslyVisible;
		element.isVisible = isVisible;
		element.isStay = isStay;
		element.isEnter = isEnter;
		element.isExit = isExit;
	}
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var s = entry.rowIndex;
		var t = entry.columnIndex;
		var isVisible = rowVisibilities[s] && columnVisibilities[t];
		var isPreviouslyVisible = ( entry.isVisible || false );
		var isStay = isVisible && isPreviouslyVisible;
		var isEnter = isVisible && ! isPreviouslyVisible;
		var isExit = ! isVisible && isPreviouslyVisible;
		entry.isVisible = isVisible;
		entry.isStay = isStay;
		entry.isEnter = isEnter;
		entry.isExit = isExit;
	}
};

/**
 * Update the following attributes...
 * For matrix entries: rowPosition, columnPosition
 * For row elements and column elements: position
 * @private
 **/
TermTopicMatrixObject.prototype.__updateOrdering = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var rowOrdering = this.__get( "rowOrdering" );
	var columnOrdering = this.__get( "columnOrdering" );
	var rowVisibilities = this.__get( "rowVisibilities" );
	var columnVisibilities = this.__get( "columnVisibilities" );

	var rowVisibleIndexes = rowOrdering.filter( function(d) { return rowVisibilities[d] } );
	var columnVisibleIndexes = columnOrdering.filter( function(d) { return columnVisibilities[d] } );
	var visibleRowDims = rowVisibleIndexes.length;
	var visibleColumnDims = columnVisibleIndexes.length;
	this.__set( "visibleRowDims", visibleRowDims );
	this.__set( "visibleColumnDims", visibleColumnDims );
	this.__set( "rowVisibleIndexes", rowVisibleIndexes );
	this.__set( "columnVisibleIndexes", columnVisibleIndexes );

	var rowPositions = this.__interpolateOrderingPositions( rowOrdering, rowVisibilities, rowDims );
	var columnPositions = this.__interpolateOrderingPositions( columnOrdering, columnVisibilities, columnDims );
	this.__set( "rowPositions", rowPositions );
	this.__set( "columnPositions", columnPositions );

	for ( var i = 0; i < rowElements.length; i++ )
	{
		var element = rowElements[i];
		var s = element.index;
		element.position = rowPositions[s];
	}
	for ( var i = 0; i < columnElements.length; i++ )
	{
		var element = columnElements[i];
		var t = element.index;
		element.position = columnPositions[t];
	}
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var s = entry.rowIndex;
		var t = entry.columnIndex;
		entry.rowPosition = rowPositions[s];
		entry.columnPosition = columnPositions[t];
	}
};

/**
 * Update the following attributes...
 * For this object: selectedRowDims, selectedColumnDims, rowSelectIDs, columnSelectIDs
 * For matrix entries: isSelected, selectID
 * For row and column elements: isSelected, isCrossSelected, selectID
 * For cross-referenced elements: isSelected, selectID
 * @private
 **/
TermTopicMatrixObject.prototype.__updateSelections = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var rowOrdering = this.__get( "rowOrdering" );
	var columnOrdering = this.__get( "columnOrdering" );
	var rowVisibilities = this.__get( "rowVisibilities" );
	var columnVisibilities = this.__get( "columnVisibilities" );
	var rowSelections = this.__get( "rowSelections" );
	var columnSelections = this.__get( "columnSelections" );
	var rowHighlights = this.__get( "rowHighlights" );
	var columnHighlights = this.__get( "columnHighlights" );
	
	// Merge entries from (row|column)Selections and (row|column)Highlights
	var rowSelectIDs = rowSelections.slice(0);
	var columnSelectIDs = columnSelections.slice(0);
	for ( var s = 0; s < rowDims; s++ )
		if ( rowHighlights[s] )
			rowSelectIDs[s] = 0;
	for ( var t = 0; t < columnDims; t++ )
		if ( columnHighlights[t] )
			columnSelectIDs[t] = 0;
	
	// Number of selected rows and columns
	var selectedRowDims = 0;
	var selectedColumnDims = 0;
	for ( var s = 0; s < rowDims; s++ )
		if ( rowSelectIDs[s] >= 0 )
			selectedRowDims ++;
	for ( var t = 0; t < columnDims; t++ )
		if ( columnSelectIDs[t] >= 0 )
			selectedColumnDims ++;
	
	// PART I: Update matrix elements
	for ( var n = 0; n < entries.length; n++ )
	{
		var entry = entries[n];
		var s = entry.rowIndex;
		var t = entry.columnIndex;
		var rowSelectID = rowSelectIDs[s];
		var columnSelectID = columnSelectIDs[t];
		var isSelected = ( rowSelectID >= 0 ) || ( columnSelectID >= 0 );
		var selectID = ( rowSelectID == 0 || columnSelectID == 0 ) ? 0 : Math.max( rowSelectID, columnSelectID );
		entry.isSelected = isSelected;
		entry.selectID = selectID;
	}
	// PART II: Update row and column elements
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		var selectID = rowSelectIDs[s];
		var isSelected = ( selectID >= 0 );
		element.isSelected = isSelected;
		element.selectID = selectID;
	}
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		var selectID = columnSelectIDs[t];
		var isSelected = ( selectID >= 0 );
		element.isSelected = isSelected;
		element.selectID = selectID;
	}
	// PART III: Update cross-referenced elements
	for ( var s = 0; s < rowDims; s++ )
	{
		var element = rowElements[s];
		element.isCrossSelected = false;
		for ( var t = 0; t < columnDims; t++ )
		{
			var selectElements = element.selectElements[t];
			var selectID = columnSelectIDs[t];
			var isSelected = ( selectID >= 0 );
			selectElements.selectID = selectID;
			selectElements.isSelected = isSelected;
			element.isCrossSelected = element.isCrossSelected || isSelected;
		}
	}
	for ( var t = 0; t < columnDims; t++ )
	{
		var element = columnElements[t];
		element.isCrossSelected = false;
		for ( var s = 0; s < rowDims; s++ )
		{
			var selectElements = element.selectElements[s];
			var selectID = rowSelectIDs[s];
			var isSelected = ( selectID >= 0 );
			selectElements.selectID = selectID;
			selectElements.isSelected = isSelected;
			element.isCrossSelected = element.isCrossSelected || isSelected;
		}
	}

	this.__set( "selectedRowDims", selectedRowDims );
	this.__set( "selectedColumnDims", selectedColumnDims );
	this.__set( "rowSelectIDs", rowSelectIDs );
	this.__set( "columnSelectIDs", columnSelectIDs );
};

/**
 * Update the following attributes...
 * For this object: rowSelectedIndexes, columnSelectedIndexes
 * @private
 **/
TermTopicMatrixObject.prototype.__updateOrderingOrSelections = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var rowOrdering = this.__get( "rowOrdering" );
	var columnOrdering = this.__get( "columnOrdering" );
	var rowSelectIDs = this.__get( "rowSelectIDs" );
	var columnSelectIDs = this.__get( "columnSelectIDs" );
	
	// Ordered list of selected indexes
	var rowSelectedIndexes = rowOrdering.filter( function(d) { return rowSelectIDs[d] >= 0 } );
	var columnSelectedIndexes = columnOrdering.filter( function(d) { return columnSelectIDs[d] >= 0 } );
	this.__set( "rowSelectedIndexes", rowSelectedIndexes );
	this.__set( "columnSelectedIndexes", columnSelectedIndexes );
};

/**
 * Update the following attributes...
 * For row elements and column elements: label
 * @private
 **/
TermTopicMatrixObject.prototype.__updateLabels = function( rowDims, columnDims, entries, rowElements, columnElements )
{
	var rowLabels = this.__get( "rowLabels" );
	for ( var s = 0; s < rowDims; s++ )
		rowElements[s].label = rowLabels[s];

	var columnLabels = this.__get( "columnLabels" );
	for ( var t = 0; t < columnDims; t++ )
		columnElements[t].label = columnLabels[t];
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__updatePendingStates = function( events )
{
	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	var entries = this.__get( "entries" );
	var rowElements = this.__get( "rowElements" );
	var columnElements = this.__get( "columnElements" );
	
	var updatedStates = [];
	
	// Update matrix
	if ( this.__isPending( "fullMatrix" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.DATA );
	}
	
	// Update values
	if ( this.__isPending( "fullMatrix" ) || this.__isPendingAndChanged( "normalization" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.NORMALIZATION );
		this.__updateNormalization( rowDims, columnDims, entries, rowElements, columnElements );
	}
	
	// Update visibility
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "rowVisibilities" ) || this.__isPendingAndChanged( "columnVisibilities" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.VISIBILITY );
		this.__updateVisibilities( rowDims, columnDims, entries, rowElements, columnElements );
	}
	
	// Update ordering
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "rowOrdering" ) || this.__isPendingAndChanged( "columnOrdering" ) || 
		 this.__isPendingAndChanged( "rowVisibilities" ) || this.__isPendingAndChanged( "columnVisibilities" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.ORDERING );
		this.__updateOrdering( rowDims, columnDims, entries, rowElements, columnElements );
	}
	
	// Update selection
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "rowSelections" ) || this.__isPendingAndChanged( "columnSelections" ) || 
		 this.__isPendingAndChanged( "rowHighlights" ) || this.__isPendingAndChanged( "columnHighlights" ) || 
		 this.__isPendingAndChanged( "rowVisibilities" ) || this.__isPendingAndChanged( "columnVisibilities" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.SELECTION );
		this.__updateSelections( rowDims, columnDims, entries, rowElements, columnElements );
	}
	
	// Update ordering -OR- selection (i.e., selectedIndexes)
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "rowOrdering" ) || this.__isPendingAndChanged( "columnOrdering" ) || 
		 this.__isPendingAndChanged( "rowSelectIDs" ) || this.__isPendingAndChanged( "columnSelectIDs" ) )
	{
		this.__updateOrderingOrSelections( rowDims, columnDims, entries, rowElements, columnElements );
	}

	// Update normalization -OR- selection (i.e., selectElements.value)
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "normalization" ) ||
		 this.__isPendingAndChanged( "rowSelectIDs" ) || this.__isPendingAndChanged( "columnSelectIDs" ) )
	{
		this.__updateNormalizationOrSelections( rowDims, columnDims, entries, rowElements, columnElements );
	}

	// Update normalization -OR- selection -OR- ordering (i.e., selectElements.startValue, selectElements.endValue)
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "normalization" ) ||
		 this.__isPendingAndChanged( "rowSelectIDs" ) || this.__isPendingAndChanged( "columnSelectIDs" ) ||
		 this.__isPendingAndChanged( "rowOrdering" ) || this.__isPendingAndChanged( "columnOrdering" ) )
	{
		this.__updateNormalizationOrSelectionOrOrdering( rowDims, columnDims, entries, rowElements, columnElements );
	}
	
	// Update labels
	if ( this.__isPending( "fullMatrix" ) ||
		 this.__isPendingAndChanged( "rowLabels" ) || this.__isPendingAndChanged( "columnLabels" ) )
	{
		updatedStates.push( this.UPDATE_EVENTS.LABEL );
		this.__updateLabels( rowDims, columnDims, entries, rowElements, columnElements );
	}

	// Flush all pending updates to this object's Backbone attributes
	this.set( this.__pendingUpdates );
	// Clear all pending updates.
	this.__pendingUpdates = {};

	// Trigger "updated:*" events
	var updatedStatesValues = updatedStates.map( function(d) { return "updated:" + d } );
	if ( updatedStatesValues.length > 0 ) { updatedStatesValues.push( "updated" ) }
	var updatedStatesStr = updatedStatesValues.join( " " );
	this.trigger( updatedStatesStr );
};

//--------------------------------------------------------------------------------------------------

/**
 * Write out a two-dimensional array of numbers.
 * @return {Array.<Array.<number>>} Two dimensional matrix of values for the matrix.
 **/
TermTopicMatrixObject.prototype.exportMatrix = function()
{
	/**
	 * Re-order a list of objects.
	 * @param{Array.<Object>} objects A list of objects to be reordered.
	 * @param{Array.<number>} ordering New object indexes.
	 * @return{Array.<Object>} The reordered list of objects.
	 * @inner
	 **/
	var __reorder = function( objects, ordering )
	{
		var reorderedObjects = new Array( objects.length );
		for ( var n = 0; n < objects.length; n++ )
			reorderedObjects[ ordering[n] ] = objects[ n ];
		return reorderedObjects;
	};

	var rowDims = this.__get( "rowDims" );
	var columnDims = this.__get( "columnDims" );
	var fullMatrix = this.__get( "fullMatrix" );
	var rowOrdering = this.__get( "rowOrdering" );
	var columnOrdering = this.__get( "columnOrdering" );
	
	var matrix = [];
	for ( var s = 0; s < fullMatrix.length; s++ )
	{
		var row = [];
		for ( var t = 0; t < fullMatrix[s].length; t++ )
		{
			row.push( fullMatrix[s][t].value );
		}	
		row = __reorder( row, columnOrdering );
		matrix.push( row );
	}
	matrix = __reorder( matrix, rowOrdering );
	return matrix;
};

//--------------------------------------------------------------------------------------------------
// Utility functions that depend on other public methods

/**
 * Toggle a row in the current selection.
 * @param {number} rowIndex An integer between 0 and rowDims-1.
 * @param {number} [selectID] A positive integer.
 **/
TermTopicMatrixObject.prototype.toggleRow = function( rowIndex, selectID )
{
	var rowSelections = this.__get( "rowSelections" );
	if ( rowSelections[ rowIndex ] == -1 )
		return this.selectRow( rowIndex, selectID );
	else
		return this.deselectRow( rowIndex );
};

/**
 * Toggle a column in the current selection.
 * @param {number} columnIndex An integer between 0 and columnDims-1.
 * @param {number} [selectID] A positive integer.
 **/
TermTopicMatrixObject.prototype.toggleColumn = function( columnIndex, selectID )
{
	var columnSelections = this.__get( "columnSelections" );
	if ( columnSelections[ columnIndex ] == -1 )
		return this.selectColumn( columnIndex, selectID );
	else
		return this.deselectColumn( columnIndex );
};

/**
 * Move a row to after another row.
 * @param {number} rowIndex Row to reorder.
 * @param {number} [previousRowIndex] The row immediately before the reordered row. An empty or null argument places the reordered row at the end of all other rows.
 **/
TermTopicMatrixObject.prototype.moveRowAfter = function( rowIndex, previousRowIndex )
{
	var rowDims = this.__get( "rowDims" );
	var rowOrdering = this.__get( "rowOrdering" );
	var newRowOrdering = this.__sanitizeAndMoveAfterIndexes( rowOrdering, rowIndex, previousRowIndex, rowDims );
	return this.orderRows( newRowOrdering );
};

/**
 * Move a column to after another column.
 * @param {number} columnIndex Column to reorder.
 * @param {number} [previousColumnIndex] The column immediately before the reordered column. An empty or null argument places the reordered column at the end of all other columns.
 **/
TermTopicMatrixObject.prototype.moveColumnAfter = function( columnIndex, previousColumnIndex )
{
	var columnDims = this.__get( "columnDims" );
	var columnOrdering = this.__get( "columnOrdering" );
	var newColumnOrdering = this.__sanitizeAndMoveAfterIndexes( columnOrdering, columnIndex, previousColumnIndex, columnDims );
	return this.orderColumns( newColumnOrdering );
};

/**
 * Move a row to before another row.
 * @param {number} rowIndex Row to reorder.
 * @param {number} [previousRowIndex] The row immediately before the reordered row. An empty argument places the reordered row in front of all other rows.
 **/
TermTopicMatrixObject.prototype.moveRowBefore = function( rowIndex, nextRowIndex )
{
	var rowDims = this.__get( "rowDims" );
	var rowOrdering = this.__get( "rowOrdering" );
	var newRowOrdering = this.__sanitizeAndMoveBeforeIndexes( rowOrdering, rowIndex, nextRowIndex, rowDims );
	return this.orderRows( newRowOrdering );
};

/**
 * Move a column to before another column.
 * @param {number} columnIndex Column to reorder.
 * @param {number} [previousColumnIndex] The column immediately before the reordered column. An empty argument places the reordered column in front of all other columns.
 **/
TermTopicMatrixObject.prototype.moveColumnBefore = function( columnIndex, nextColumnIndex )
{
	var columnDims = this.__get( "columnDims" );
	var columnOrdering = this.__get( "columnOrdering" );
	var newColumnOrdering = this.__sanitizeAndMoveBeforeIndexes( columnOrdering, columnIndex, nextColumnIndex, columnDims );
	return this.orderColumns( newColumnOrdering );
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndMoveAfterIndexes = function( ordering, index, previousIndex, N )
{
	index = parseInt( index, 10 );
	if ( 0 <= index  &&  index < N )
	{
		var a = ordering.indexOf( index );
		var tempOrdering = ordering.slice( 0, a ).concat( ordering.slice( a+1 ) );
		if ( previousIndex === undefined )
		{
			tempOrdering.splice( tempOrdering.length, 0, index );
		}
		else
		{
			previousIndex = parseInt( previousIndex, 10 );
			if ( 0 <= previousIndex  &&  index < N  &&  index != previousIndex )
			{
				var b = tempOrdering.indexOf( previousIndex );
				tempOrdering.splice( b+1, 0, index );
				ordering = tempOrdering;
			}
		}
	}
	return ordering;
};

/**
 * @private
 **/
TermTopicMatrixObject.prototype.__sanitizeAndMoveBeforeIndexes = function( ordering, index, nextIndex, N )
{
	index = parseInt( index, 10 );
	if ( 0 <= index  &&  index < N )
	{
		var a = ordering.indexOf( index );
		var tempOrdering = ordering.slice( 0, a ).concat( ordering.slice( a+1 ) );
		if ( nextIndex === undefined )
		{
			tempOrdering.splice( 0, 0, index );
		}
		else
		{
			nextIndex = parseInt( nextIndex, 10 );
			if ( 0 <= nextIndex  &&  index < N  &&  index != nextIndex )
			{
				var b = tempOrdering.indexOf( nextIndex );
				tempOrdering.splice( b, 0, index );
				ordering = tempOrdering;
			}
		}
	}
	return ordering;
};

//--------------------------------------------------------------------------------------------------

if ( typeof module != "undefined" )
{
	module.exports = TermTopicMatrixObject;
}
