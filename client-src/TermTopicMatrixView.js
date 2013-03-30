/*
	TermTopicMatrixView.js
	
	This view is responsible for generating the term:topic similarity matrix.
	
	Details:
	--------
	Pulls list of ordered terms, topics, and similarity values from 
	FilteredTermTopicProbabilityModel. 
	
	Additionally, uses parameters defined in ViewParameters.js.
*/
var MATRIX_CONTAINER_PADDING = {
	left_separation: 8,
	top_separation: 5,
	left: 110,
	right: 20,
	top: 60,
	bottom: 60,
	fullWidth : function( numTopics ) { return this.left + this.right + MATRIX_ENCODING_PARAMETERS.packing() * numTopics },
	fullHeight : function( numTopics, numTerms ) { return this.top + this.bottom + MATRIX_ENCODING_PARAMETERS.packing() * numTerms }
};
	
var MATRIX_ENCODING_PARAMETERS = {
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
		return 12;
	},
	TARGET_PIXEL_DENSITY : 0.20,
	radius : function( sparseMatrix, numTopics, numTerms )	// matrix view
	{
		var totalCirclePixels = 0.0;
		for ( var i in sparseMatrix )
			totalCirclePixels += sparseMatrix[i].value * Math.PI;
		// Add up # pixels:  prob * Math.PI;
		var totalMatrixPixels = numTopics * numTerms * this.packing() * this.packing();
		
		var targetPixels = ( totalMatrixPixels * this.TARGET_PIXEL_DENSITY );
		var observedPixels = totalCirclePixels;
		var areaScale = targetPixels / observedPixels;
		var radiusScale = Math.sqrt( areaScale );
		
		var totalCirclePixels = 0.0;
		for ( var i in sparseMatrix )
			totalCirclePixels += radiusScale * radiusScale * ( sparseMatrix[i].value ) * Math.PI;
		
		return radiusScale;
	}
};

var TermTopicMatrixView = Backbone.View.extend({
	initialize : function() {
		this.parentModel = null;
		
		// encodings
		this.xs = null;
		this.ys = null;
		this.rs = null;
		
		// svg layers
		this.svg = null;
		this.xGridlineLayer = null;
		this.yGridlineLayer = null;
		this.matrixLayer = null;
		this.leftLabelLayer = null;
		this.topLabelLayer = null;
				
		// interaction variables
		this.selectedTopics = [];
		this.normalColor = "normal";
		
		this.highlightedTerm = null;
		this.highlightedTopic = null;
		
		this.receivedColors = null;
		
	}
});
/** 
 * Initialize matrix view's parent model
 *
 * @private
 */
TermTopicMatrixView.prototype.initModel = function( model ) {
	this.parentModel = model;
};

/**
 * Receives information about selected topics that were restored from saved state
 *
 */
TermTopicMatrixView.prototype.receiveSelectedTopics = function( obj ){
	this.receivedColors = obj;
};

/** 
 * Initialize/render matrix view's elements for the first time
 *
 * @private
 */
TermTopicMatrixView.prototype.load = function(){
	this.renderInit();
	this.renderUpdate();
	
	for( var obj in this.selectedTopics ){
		this.selectTopic(obj, this.selectedTopics[obj]);
	}
};

/** 
 * Initialize all topics' selection color to DEFAULT (used by renderInit only)
 *
 * @private
 */
TermTopicMatrixView.prototype.defaultSelection = function(){
	var topicIndex = this.parentModel.get("topicIndex");
	for( var i = 0; i < topicIndex.length; i++ ){
		this.selectedTopics[i] = this.normalColor;
		if( this.receivedColors !== null && this.receivedColors[i] !== undefined){
			this.selectedTopics[i] = this.receivedColors[i];
		}
	}
};

/** 
 * Initialize matrix view's elements
 *	-svg layers
 *	-encoders
 *  -etc.
 *
 * @private
 */
TermTopicMatrixView.prototype.renderInit = function(){
	var matrix = this.parentModel.get("sparseMatrix");
	var termIndex = this.parentModel.get("termIndex");
	var topicIndex = this.parentModel.get("topicIndex");
		
	this.defaultSelection();
		
	this.xs = d3.scale.linear();
	this.ys = d3.scale.linear();

	this.rs = d3.scale.sqrt()
		.domain( [ 0, 1 ] )
		.range( [ 0, MATRIX_ENCODING_PARAMETERS.radius( matrix, topicIndex.length, termIndex.length ) ] );
	
	var container = d3.select( this.el );
	this.svg = container.append( "svg:svg" )
	
	this.initMatrixView();
	this.initTopLabelView();
	this.initLeftLabelView();
};

/** 
 * Update matrix view's elements based on parent model's termIndex, topicIndex, and matrix
 *
 * @private
 */
TermTopicMatrixView.prototype.renderUpdate = function(){
	var termIndex = this.parentModel.get("termIndex");
	var topicIndex = this.parentModel.get("topicIndex");
		
	this.xs
		.domain( [ 0, topicIndex.length ] )
		.range( [ MATRIX_CONTAINER_PADDING.left, MATRIX_CONTAINER_PADDING.left + topicIndex.length * MATRIX_ENCODING_PARAMETERS.packing() ] );
	this.ys
		.domain( [ 0, termIndex.length ] )
		.range( [ MATRIX_CONTAINER_PADDING.top, MATRIX_CONTAINER_PADDING.top + termIndex.length * MATRIX_ENCODING_PARAMETERS.packing() ] );
	this.svg
		.style( "width", MATRIX_CONTAINER_PADDING.fullWidth( topicIndex.length ) + "px" )
		.style( "height", MATRIX_CONTAINER_PADDING.fullHeight( topicIndex.length, termIndex.length ) + "px" )
	
	this.updateMatrixView();
	this.updateTopLabelView();
	this.updateLeftLabelView();
};

/** 
 * Init and update functions for each layer
 *
 * @private
 */
TermTopicMatrixView.prototype.initMatrixView = function(){			
	this.xGridlineLayer = this.svg.append( "svg:g" ).attr( "class", "xGridlineLayer" );
	this.yGridlineLayer = this.svg.append( "svg:g" ).attr( "class", "yGridlineLayer" );
	this.matrixLayer = this.svg.append( "svg:g" ).attr( "class", "matrixLayer" );
};
TermTopicMatrixView.prototype.updateMatrixView = function(){
	var matrix = this.parentModel.get("sparseMatrix");
	var termIndex = this.parentModel.get("termIndex");
	var topicIndex = this.parentModel.get("topicIndex");
	
	this.matrixLayer.selectAll( "circle" ).data( matrix ).exit().remove();
	this.matrixLayer.selectAll( "circle" ).data( matrix ).enter().append( "svg:circle" )
		.on( "mouseout", function() { this.trigger( "mouseout:term", ""); this.trigger( "mouseout:topic", null); }.bind(this) )
	this.matrixLayer.selectAll( "circle" ).data( matrix )	
		.attr( "class", function(d) { return [ "matrixElement", this.selectedTopics[d.topicIndex], getTopicClassTag(d.topicName), getTermClassTag(d.term) ].join(" ") }.bind(this))
		.on( "mouseover", function(d) { this.trigger( "mouseover:term", d.term); this.trigger( "mouseover:topic", d.topicIndex); }.bind(this) )
		.on( "click", function (d) { this.trigger( "click:topic", d.topicIndex ) }.bind(this)) 
		.attr( "cx", function(d) { return this.xs(d.topicIndex+0.5) }.bind(this) )
		.attr( "cy", function(d) { return this.ys(d.termIndex+0.5) }.bind(this) )
		.attr( "r", function(d) { return this.rs(d.value) }.bind(this) )
		
	this.xGridlineLayer.selectAll( "line" ).data( termIndex ).exit().remove();
	this.xGridlineLayer.selectAll( "line" ).data( termIndex ).enter().append( "svg:line" )
		.attr( "x1", this.xs(0.5) )
	this.xGridlineLayer.selectAll( "line" ).data( termIndex )
		.attr( "class", function(d) { return [ "verticalLine", this.normalColor, getTermClassTag(d) ].join(" ") }.bind(this)) 
		.attr( "x2", this.xs(topicIndex.length-0.5) )
		.attr( "y1", function(d,i) { return this.ys(i+0.5) }.bind(this) )
		.attr( "y2", function(d,i) { return this.ys(i+0.5) }.bind(this) )

	this.yGridlineLayer.selectAll( "line" ).data( topicIndex ).exit().remove();
	this.yGridlineLayer.selectAll( "line" ).data( topicIndex ).enter().append( "svg:line" )
		.attr( "y1", this.ys(0.5) )
	this.yGridlineLayer.selectAll( "line" ).data( topicIndex )
		.attr( "class", function(d, i) { return [ "verticalLine", this.selectedTopics[i], getTopicClassTag(d)].join(" ") }.bind(this)) 
		.attr( "x1", function(d,i){ return this.xs(i+0.5) }.bind(this) )
		.attr( "x2", function(d,i){ return this.xs(i+0.5) }.bind(this) )
		.attr( "y2", this.ys(termIndex.length-0.5) )
};
TermTopicMatrixView.prototype.initTopLabelView = function(){
	this.topLabelLayer = this.svg.append( "svg:g" )
		.attr( "class", "topLabelLayer" );
};
TermTopicMatrixView.prototype.updateTopLabelView = function(){
	var topicIndex = this.parentModel.get("topicIndex");
	var dblclickTimer = null;

	this.topLabelLayer.selectAll( "text" ).data( topicIndex ).exit().remove()
	this.topLabelLayer.selectAll( "text" ).data( topicIndex ).enter().append( "svg:text" )
		.on( "mouseout", function() { this.trigger( "mouseout:topic", null) }.bind(this))
		.attr( "y", 3 )
	this.topLabelLayer.selectAll( "text" ).data( topicIndex )
		.attr( "class", function(d, i) { return ["topLabel", this.selectedTopics[i], getTopicClassTag(d)].join(" ") }.bind(this))
		.on( "mouseover", function(d, i) { this.trigger( "mouseover:topic", i ) }.bind(this))
		.attr( "transform", function(d,i) { return "translate(" + this.xs(i+0.5) + "," + (this.ys(0)-MATRIX_CONTAINER_PADDING.top_separation) + ") rotate(270)" }.bind(this) )
		.text( function(d) { return d } )
		.on( "click", function(d, i) { 
				dblclickTimer = setTimeout(function(){ clickWork(d, i)}, 200);
			})
		.on( "dblclick", function(d, i){ 
				clearTimeout(dblclickTimer);
  				dblclickTimer = null;
  				this.trigger( "doubleClick:topic", i) 
  			}.bind(this))
  	
  	var clickWork = function(d, i) {
  		if(dblclickTimer === null)
			return; 
		else { 
			this.trigger( "click:topic", i)
		}
  	}.bind(this);
};
TermTopicMatrixView.prototype.initLeftLabelView = function(){
	this.leftLabelLayer = this.svg.append( "svg:g" )
		.attr( "class", "leftLabelLayer" );
};
TermTopicMatrixView.prototype.updateLeftLabelView = function(){
	var termIndex = this.parentModel.get("termIndex");
	
	this.leftLabelLayer.selectAll( "text" ).data( termIndex ).exit().remove();
	this.leftLabelLayer.selectAll( "text" ).data( termIndex ).enter().append( "svg:text" )
		.on( "mouseout", function() { this.trigger( "mouseout:term", "") }.bind(this))
		.attr( "y", 3 )
	this.leftLabelLayer.selectAll( "text" ).data( termIndex )
		.attr( "class", function(d) { return ["leftLabel", this.normalColor, getTermClassTag(d)].join(" ") }.bind(this))
		.on( "mouseover", function(d) { this.trigger( "mouseover:term", d ) }.bind(this))
		.attr( "transform", function(d,i) { return "translate(" + (this.xs(0)-MATRIX_CONTAINER_PADDING.left_separation) + "," + this.ys(i+0.5) + ")" }.bind(this) )
		.text( function(d) { return d } )
};
/** end init and update functions **/

/** 
 * Updates the view (public encapsulation used in index.html)
 */
TermTopicMatrixView.prototype.update = function() {
	this.renderUpdate();
};


// Interactions
/** 
 * Calls appropriate functions to deal with term highlight event elements
 *
 * @param { model } model is passed but unused
 * @param { string } value is the target term
 * @return { void }
 */
TermTopicMatrixView.prototype.onSelectionTermChanged = function( model, value ) {
	var term = value;
	if(term === "")
		this.unhighlight( true, false );
	else
		this.highlight( term, null );
};
/** 
 * Calls appropriate functions to deal with topic highlight event elements
 *
 * @param { model } model is passed but unused
 * @param { int } value is the target topic index
 * @return { void }
 */
TermTopicMatrixView.prototype.onSelectionTopicChanged = function( model, value ) {
	var topic = value;
	if(topic === null)
		this.unhighlight( false, true );
	else
		this.highlight( null, topic );
};

/** 
 * Highlights elements based on term and/or topic
 *
 * @private
 */
TermTopicMatrixView.prototype.highlight = function( term, topic ) {
	if( term !== null ){
		this.highlightedTerm = term;
		this.svg.selectAll("." + getTermClassTag(term))
			.classed(HIGHLIGHT, true)
	} 
	
	if( topic !== null ){
		var topicIndex = this.parentModel.get("topicIndex");
		var termIndex = this.parentModel.get("termIndex");
		var matrix = this.parentModel.get("matrix");
		
		this.highlightedTopic = topic;
		this.svg.selectAll("." + getTopicClassTag(topicIndex[topic]))
			.classed(HIGHLIGHT, true)	
			
		// highlight term labels
		for( var i = 0; i < termIndex.length; i++){
			var term = termIndex[i];
			if( matrix[i][topic] > THRESHHOLD ){
				this.leftLabelLayer.selectAll("." + getTermClassTag(term))	
					.classed(HIGHLIGHT, true)
			}
		}
	}
};
/** 
 * Unhighlights elements based on term and/or topic
 *
 * @private
 */
TermTopicMatrixView.prototype.unhighlight = function( term, topic ) {
	if( term  && this.highlightedTerm !== null){
		this.svg.selectAll("." + getTermClassTag(this.highlightedTerm))
			.classed(HIGHLIGHT, false)
		
		this.highlightedTerm = null;
	} 
	
	if( topic && this.hightlightedTopic !== null){
		var topicIndex = this.parentModel.get("topicIndex");
		var termIndex = this.parentModel.get("termIndex");
		var matrix = this.parentModel.get("matrix");
		
		var topicNo = this.highlightedTopic;
		this.svg.selectAll("." + getTopicClassTag(topicIndex[topicNo]))
			.classed(HIGHLIGHT, false)
		
		// unhighlight labels
		for( var i = 0; i < termIndex.length; i++){
			var term = termIndex[i];
			if( matrix[i][topicNo] > THRESHHOLD ){
				this.leftLabelLayer.selectAll("." + getTermClassTag(term))	
					.classed(HIGHLIGHT, false)
			}
		}
		
		this.highlightedTopic = null;
	}
};

/** 
 * Calls appropriate functions to deal with topic selection event elements
 *
 * @param { object } contains both target topic index and associated color
 * @return { void }
 */
TermTopicMatrixView.prototype.clickTopic = function( obj ){
	this.selectTopic(obj.topic, obj.color);
};
/** 
 * topic selection behavior
 *
 * @private
 */
TermTopicMatrixView.prototype.selectTopic = function( topic, colorClass ) {
	var topicIndex = this.parentModel.get("topicIndex");
	if( topic !== null){

		if( colorClass === DEFAULT)
			colorClass = this.normalColor;
			
		var oldColor = this.selectedTopics[topic];

		// set new color
		this.svg.selectAll("." + getTopicClassTag(topicIndex[topic]))
			.classed(oldColor, false)
			.classed(colorClass, true)
			
		this.selectedTopics[topic] = colorClass;
	}
};