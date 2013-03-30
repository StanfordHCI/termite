var StateModel = Backbone.Model.extend({
	defaults : {
		"numAffinityTerms" : 25,
		"numSalientTerms" : 0,
		"visibleTerms" : [],
		"totalTerms" : 25,
		"foundTerms" : "",
		"unfoundTerms" : "",
		"sortType": "",
		"addTopTwenty": false,
		"highlightedTerm" : "",
		"highlightedTopic" : null,
		"selectedTopics" : {},
		"doubleClickTopic": null,
		"selectedTopicsStr": ""	    // var for load and save state
	},
	initialize : function() {
		this.matrixView = null;
		this.termFreqView = null;	
	}
});

/**
 * Initialize state model's view models
 *
 * @private
 */
StateModel.prototype.initModel = function ( matrix, histogram ){
	this.matrixView = matrix;
	this.termFreqView = histogram;
};

// User Defined Terms 
/**
 * Set user defined control feedback views
 *
 * @this {state model}
 * @param { array } list of terms
 * @param { boolean } whether or not event should be silent
 */
StateModel.prototype.setFoundTerms = function( termList, keepQuiet ) {
	this.set( "foundTerms", termList.join(", "), {silent: keepQuiet});
};
StateModel.prototype.setUnfoundTerms = function( termList, keepQuiet ){
	if( termList.length > 0 && termList[0] != "")
		this.set( "unfoundTerms", termList.join(", "), {silent: keepQuiet});
	else
		this.set( "unfoundTerms", "", {silent: keepQuiet});
};
StateModel.prototype.setVisibleTerms = function ( userSpecifiedVisibleTerms ) {
	this.set( "visibleTerms", userSpecifiedVisibleTerms.split(/[ ,;]+/g) );
};
/** end user defined control feedback **/


/** 
 * Handles selecting topics using click event. Uses function freeColor and getColor that
 * are defined in ViewParameters
 *
 * @this {state model}
 * @param { string } DEFAULT defined in ViewParameters
 * @param { int } index of clicked topic
 */
StateModel.prototype.selectTopic = function( topicIndex ) {
	var color = DEFAULT;
	// frees the color associated with the topic if it was already selected
	if( topicIndex in this.get("selectedTopics")) {
		freeColor( this.get("selectedTopics")[topicIndex] );
		delete this.get("selectedTopics")[topicIndex];
	}
	// assign a color to the selected topic if there are any free 
	else {
		color = getColor();
		this.get("selectedTopics")[topicIndex] = color;
	}
	// fire event to signify topic coloring may have changed
	this.trigger("color:topic", { "topic":topicIndex, "color": color } );
};
/**
 * Clears all topic selections (currently inefficiently implemented)
 */
StateModel.prototype.clearAllSelectedTopics = function() {
	console.log("clear all topics");
	var selectedTopics = this.get("selectedTopics");
	for( var i in selectedTopics){
		freeColor( selectedTopics[i] );
		delete this.get("selectedTopics")[i];
		this.trigger("color:topic", {"topic":i, "color":DEFAULT} );
	}
};
/** end topic selection code **/

/** 
 * Handles sorting using double click on a topic label
 *
 * @this {state model}
 * @param { int } index of double clicked topic
 */
StateModel.prototype.getSortType = function ( topicIndex ){
	var sorts = ["desc", "asc", ""];
	
	if(this.get("doubleClickTopic") !== topicIndex)
		return sorts[0];
	else{
		var currentSort = this.get("sortType");
		var index = (sorts.indexOf(currentSort) + 1) % sorts.length;
		return sorts[index];
	}
};
StateModel.prototype.setDoubleClickTopic = function ( topicIndex ){
	var type = this.getSortType(topicIndex);
	if( type === "")
		this.set( "doubleClickTopic", null);
	else
		this.set( "doubleClickTopic", topicIndex);
	this.set( "sortType", type);
};
StateModel.prototype.clearSorting = function(){
	this.set( "doubleClickTopic", null);
	this.set( "sortType", "");
};
/** end double click event code **/

/**
 * Handles highlighting events triggered by mouseover and mouseout
 * 
 * @param { string } target term
 * @param { int } index of target topic
 */
StateModel.prototype.setHighlightedTerm = function( term ) {
	this.set("highlightedTerm", term );
};
StateModel.prototype.setHighlightedTopic = function( topic ) {
	this.set("highlightedTopic", topic );
};
/** end highlight event code **/


/**
 * load from query string including decoding some values
 *
 * @this {state model}
 */
StateModel.prototype.loadStatesFromQueryString = function() {

	var decodeString = function( str ){
		var topicLabel = "#topic:";
		var colorLabel = "#color:";
				
		// extract color and topic pairs
		while( str.length > 0) {
			var topicIndex = str.indexOf(topicLabel);
			var colorIndex = str.indexOf(colorLabel);

			var topic = null;
			var color = null;
			if(topicIndex >= 0 && colorIndex >= 0){
				topic = parseInt(str.substring(topicIndex+7, colorIndex));
				
				var tempIndex = str.indexOf(topicLabel, colorIndex+7);
				if(tempIndex >= 0){	//there's another pair
					color = str.substring(colorIndex+7, tempIndex);
					str = str.substring(tempIndex);
				} else { //no more pairs
					color = str.substring(colorIndex+7);
					// get rid of trailing characters...
					color = color.replace( /[^A-Za-z0-9]/g, "" );
					str = "";
				}
				this.get("selectedTopics")[topic] = color;
			}
		}
	}.bind(this);

	var qs = new QueryString();
	qs.addValueParameter( 'numAffinityTerms', 'na', 'int' );
	qs.addValueParameter( 'numSalientTerms', 'ns', 'int' );
	qs.addArrayParameter( 'visibleTerms', 't' );
	qs.addValueParameter( 'sortType', 'st', 'str');
	qs.addValueParameter( 'doubleClickTopic', 'dct', 'int');
	qs.addValueParameter( 'addTopTwenty', 'att', 'str');
	qs.addValueParameter( 'selectedTopicsStr', 'tc', 'str');
	
	var states = qs.read();
	for ( var key in states ){
		if(key === "doubleClickTopic" && states[key] === -1){
			this.set(key, null);
		}
		else if( key === "selectedTopicsStr" && states[key] !== ""){
			// decode string
			decodeString( states[key] );
			this.set(key, states[key]);
		}
		else if( key === "addTopTwenty"){
			if( states[key].replace( /[^A-Za-z0-9]/g, "" ) === "false")
				this.set(key, false);
			else
				this.set(key, true);
		}
		else
			this.set( key, states[key] );
	}

	this.trigger( "loaded:states" );
	this.trigger( "sending:colors", this.get("selectedTopics"));
};

/**
 * save current state to query string
 *
 * @this {state model}
 */
StateModel.prototype.saveStatesToQueryString = function() {
	var qs = new QueryString();
	qs.addValueParameter( 'numAffinityTerms', 'na', 'int' );
	qs.addValueParameter( 'numSalientTerms', 'ns', 'int' );
	qs.addArrayParameter( 'visibleTerms', 't' );
	qs.addValueParameter( 'sortType', 'st', 'str');
	qs.addValueParameter( 'doubleClickTopic', 'dct', 'int');
	qs.addValueParameter( 'addTopTwenty', 'att', 'str');
	
	var selectedTopics = this.get("selectedTopics");
	var strVersion = "";
	for( var i in selectedTopics){
		if(selectedTopics[i] !== DEFAULT)
			strVersion += "#topic:" + i + "#color:" + selectedTopics[i];
	}
	this.set("selectedTopicsStr", strVersion);
	qs.addValueParameter( 'selectedTopicsStr', 'tc', 'str');
	
	var keys = [ 'numAffinityTerms', 'numSalientTerms', 'visibleTerms', 'sortType', 'doubleClickTopic', 'addTopTwenty', 'selectedTopicsStr' ];
	var states = {};
	for ( var i in keys )
	{
		var key = keys[i];
		if(key === "doubleClickTopic" && this.get(key) === null){
			states[key] = -1;
		}
		else
			states[key] = this.get(key);
	}
	
	qs.write( states );
};