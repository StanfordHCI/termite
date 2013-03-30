/*
	ViewParameters.js
	
	This file contains some final parameters for the view elements. 
	
	Parameters include:
		-defaults for different objects types
		-encoding functions and variables
		-mouseover behavior functions
		-functions to generate consistent class tags for objects based on term or topic
		
	Used by TermTopicMatrixView and TermFrequencyView
*/

// D3 Invariables
//=====================================================================================
//									VIEW PARAMS
//=====================================================================================
var LABEL_DEFAULT = {
	COLOR: "#808080",
	STROKE_OPACITY: 0,
	STROKE_WIDTH: 0,
	FILL_OPACITY: 1
};

var GRIDLINE_DEFAULT = {
	COLOR: "#808080",
	STROKE_OPACITY: 0.25,
	STROKE_WIDTH: 0.5
};

var CIRCLE_DEFAULT = {
	COLOR: "#808080",
	FILL_COLOR: "#808080", //"#fc6",
	STROKE_OPACITY: 0.8,
	FILL_OPACITY: 0.4
};

var TERMFREQ_TEXT_DEFAULT = {
	COLOR: "#808080",
	STROKE_OPACITY: 0,
	FILL_OPACITY: 1
};

var TERMFREQ_BAR_DEFAULT = {
	STROKE: "#808080",
	STROKE_WIDTH: 5,
	OPACITY: 0.4
};

var HIGHLIGHT_EVENT = {
	FILL_COLOR: "#933",
	STROKE_COLOR: "#933",
	STROKE_OPACITY: 1,
	FILL_OPACITY: 0.5
};

var ENCODING_PARAMETERS = {
	NUM_TOPICS : 0,
	NUM_TERMS : 0,
	MATRIX : null,
	setNumTopics : function(numTopics) { this.NUM_TOPICS = numTopics; },
	setNumTerms : function(numTerms) { this.NUM_TERMS = numTerms; },
	setMatrix : function(matrix) { this.MATRIX = matrix; },
	DENSE_NUM_TOPICS: 50,
	LOOSE_NUM_TOPICS: 20,
	DENSE_PACKING: 12,
	LOOSE_PACKING: 18,
	packing : function()
	{
		if ( this.NUM_TOPICS <= this.LOOSE_NUM_TOPICS )
			return this.LOOSE_PACKING;
		if ( this.NUM_TOPICS >= this.DENSE_NUM_TOPICS )
			return this.DENSE_PACKING;
		var ratio = ( this.NUM_TOPICS - this.LOOSE_NUM_TOPICS ) / ( this.DENSE_NUM_TOPICS - this.LOOSE_NUM_TOPICS );
		//console.log((1-ratio) * ( this.LOOSE_PACKING - this.DENSE_PACKING ) + this.DENSE_PACKING);
		return (1-ratio) * ( this.LOOSE_PACKING - this.DENSE_PACKING ) + this.DENSE_PACKING;
	},
	TARGET_PIXEL_DENSITY : 0.20,
	radius : function( sparseMatrix, numTopics, numTerms )
	{
		//console.log( sparseMatrix )
		var totalCirclePixels = 0.0;
		for ( var i in sparseMatrix )
			totalCirclePixels += sparseMatrix[i].value * Math.PI;
		// Add up # pixels:  prob * Math.PI;
		var totalMatrixPixels = numTopics * numTerms * this.packing() * this.packing();
		//console.log( "totalCirclePixels = ", totalCirclePixels );
		//console.log( "totalMatrixPixels = ", totalMatrixPixels );
		//console.log( "totalMatrixPixels target = ", totalMatrixPixels * this.TARGET_PIXEL_DENSITY );
		
		var targetPixels = ( totalMatrixPixels * this.TARGET_PIXEL_DENSITY );
		var observedPixels = totalCirclePixels;
		var areaScale = targetPixels / observedPixels;
		var radiusScale = Math.sqrt( areaScale );
		//console.log( "areaScale = ", areaScale );
		//console.log( "radiusScale = ", radiusScale );
		
		var totalCirclePixels = 0.0;
		for ( var i in sparseMatrix )
			totalCirclePixels += radiusScale * radiusScale * ( sparseMatrix[i].value ) * Math.PI;
		//console.log( "totalCirclePixels after scaling = ", totalCirclePixels );
		
		return radiusScale;
	}
};
//=====================================================================================
//								MOUSEOVERS
//=====================================================================================
function selectTopicEvent( topicName ){
	d3.selectAll("."+getTopicClassTag(topicName))
		.attr("stroke", HIGHLIGHT_EVENT.STROKE_COLOR)
		.attr("stroke-opacity", HIGHLIGHT_EVENT.STROKE_OPACITY)
		.attr("fill", HIGHLIGHT_EVENT.FILL_COLOR)
		.attr("fill-opacity", HIGHLIGHT_EVENT.FILL_OPACITY);
}
function deselectTopicEvent( topicName ){
	d3.selectAll(".topLabel")
		.attr("stroke", LABEL_DEFAULT.COLOR)
		.attr("stroke-opacity", LABEL_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", LABEL_DEFAULT.FILL_OPACITY);
	d3.selectAll(".matrixElement")
		.attr("stroke", CIRCLE_DEFAULT.COLOR)
		.attr("stroke-opacity", CIRCLE_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", CIRCLE_DEFAULT.FILL_OPACITY)
		.attr("fill", CIRCLE_DEFAULT.COLOR);
	d3.selectAll(".verticalLine")
		.attr("stroke", GRIDLINE_DEFAULT.COLOR)
		.attr("stroke-width", GRIDLINE_DEFAULT.STROKE_WIDTH)
		.attr("stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY);
}
function selectTermEvent( term ){
	d3.selectAll("."+getTermClassTag(term))
		.attr("stroke", HIGHLIGHT_EVENT.STROKE_COLOR)
		.attr("stroke-opacity",HIGHLIGHT_EVENT.STROKE_OPACITY)
		.attr("fill", HIGHLIGHT_EVENT.FILL_COLOR)
		.attr("fill-opacity", HIGHLIGHT_EVENT.FILL_OPACITY);
}
function deselectTermEvent( term ){	
	d3.selectAll(".leftLabel")
		.attr("stroke", LABEL_DEFAULT.COLOR)
		.attr("stroke-opacity", LABEL_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", LABEL_DEFAULT.FILL_OPACITY);
	d3.selectAll(".matrixElement")
		.attr("stroke", CIRCLE_DEFAULT.COLOR)
		.attr("stroke-opacity", CIRCLE_DEFAULT.OPACITY)
		.attr("fill", CIRCLE_DEFAULT.COLOR)
		.attr("fill-opacity", CIRCLE_DEFAULT.FILL_OPACITY);
	d3.selectAll(".verticalLine")
		.attr("stroke", GRIDLINE_DEFAULT.COLOR)
		.attr("stroke-width", GRIDLINE_DEFAULT.STROKE_WIDTH)
		.attr("stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY);
	d3.selectAll(".termFreqText")
		.attr("fill", TERMFREQ_TEXT_DEFAULT.COLOR)
		.attr("stroke-opacity", TERMFREQ_TEXT_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", TERMFREQ_TEXT_DEFAULT.FILL_OPACITY);
	d3.selectAll(".termFreqBar")
		.attr("stroke", TERMFREQ_BAR_DEFAULT.STROKE)
		.attr( "stroke-opacity", TERMFREQ_BAR_DEFAULT.OPACITY );
}
function selectCircleEvent( topicName, term ){
	d3.selectAll("."+getTopicClassTag(topicName))
		.attr("stroke", HIGHLIGHT_EVENT.STROKE_COLOR)
		.attr("stroke-opacity", HIGHLIGHT_EVENT.STROKE_OPACITY)
		.attr("fill", HIGHLIGHT_EVENT.FILL_COLOR)
		.attr("fill-opacity", HIGHLIGHT_EVENT.FILL_OPACITY);
	d3.selectAll("."+getTermClassTag(term))
		.attr("stroke", HIGHLIGHT_EVENT.STROKE_COLOR)
		.attr("stroke-opacity", HIGHLIGHT_EVENT.STROKE_OPACITY)
		.attr("fill", HIGHLIGHT_EVENT.FILL_COLOR)
		.attr("fill-opacity", HIGHLIGHT_EVENT.FILL_OPACITY);
}
function deselectCircleEvent( topicName, term ){
	d3.selectAll(".leftLabel")
		.attr("stroke", LABEL_DEFAULT.COLOR)
		.attr("stroke-opacity", LABEL_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", LABEL_DEFAULT.FILL_OPACITY);
	d3.selectAll(".topLabel")
		.attr("stroke", LABEL_DEFAULT.COLOR)
		.attr("stroke-opacity", LABEL_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", LABEL_DEFAULT.FILL_OPACITY);
	d3.selectAll(".matrixElement")
		.attr("stroke", CIRCLE_DEFAULT.COLOR)
		.attr("stroke-opacity", CIRCLE_DEFAULT.OPACITY)
		.attr("fill", CIRCLE_DEFAULT.COLOR)
		.attr("fill-opacity", CIRCLE_DEFAULT.FILL_OPACITY);
	d3.selectAll(".verticalLine")
		.attr("stroke", GRIDLINE_DEFAULT.COLOR)
		.attr("stroke-width", GRIDLINE_DEFAULT.STROKE_WIDTH)
		.attr("stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY);
	d3.selectAll(".termFreqText")
		.attr("fill", TERMFREQ_TEXT_DEFAULT.COLOR)
		.attr("stroke-opacity", TERMFREQ_TEXT_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", TERMFREQ_TEXT_DEFAULT.FILL_OPACITY);
	d3.selectAll(".termFreqBar")
		.attr("stroke", TERMFREQ_BAR_DEFAULT.STROKE)
		.attr( "stroke-opacity", TERMFREQ_BAR_DEFAULT.OPACITY );
}
function selectFreqEvent( term ) {
	d3.selectAll("."+getTermClassTag(term))
		.attr("stroke", HIGHLIGHT_EVENT.STROKE_COLOR)
		.attr("stroke-opacity", HIGHLIGHT_EVENT.STROKE_OPACITY)
		.attr("fill", HIGHLIGHT_EVENT.FILL_COLOR)
		.attr("fill-opacity", HIGHLIGHT_EVENT.FILL_OPACITY);
}
function deselectFreqEvent( term ){
	d3.selectAll(".leftLabel")
		.attr("stroke", LABEL_DEFAULT.COLOR)
		.attr("stroke-opacity", LABEL_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", LABEL_DEFAULT.FILL_OPACITY);
	d3.selectAll(".matrixElement")
		.attr("stroke", CIRCLE_DEFAULT.COLOR)
		.attr("stroke-opacity", CIRCLE_DEFAULT.OPACITY)
		.attr("fill", CIRCLE_DEFAULT.COLOR)
		.attr("fill-opacity", CIRCLE_DEFAULT.FILL_OPACITY);
	d3.selectAll(".verticalLine")
		.attr("stroke", GRIDLINE_DEFAULT.COLOR)
		.attr("stroke-width", GRIDLINE_DEFAULT.STROKE_WIDTH)
		.attr("stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY);
	d3.selectAll(".termFreqText")
		.attr("fill", TERMFREQ_TEXT_DEFAULT.COLOR)
		.attr("stroke-opacity", TERMFREQ_TEXT_DEFAULT.STROKE_OPACITY)
		.attr("fill-opacity", TERMFREQ_TEXT_DEFAULT.FILL_OPACITY);
	d3.selectAll(".termFreqBar")
		.attr("stroke", TERMFREQ_BAR_DEFAULT.STROKE)
		.attr( "stroke-opacity", TERMFREQ_BAR_DEFAULT.OPACITY );
}

// consistent d3 class labeling helper functions
function getTopicClassTag( topicName ){
	return "__topic_" + sanitize(topicName);
}
function getTermClassTag( term ){
	return "__term_" + sanitize(term);
}
function sanitize( text ){
	// Need to account for non-alphanumeric characters
	// Return a unique identifier for any input string
	return text.replace( /[^A-Za-z0-9]/g, "_" );
}