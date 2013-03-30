/*
	TermFrequencyModel.js
		This model processes and packages data for the term frequency view.

	Initialization:
		Load term frequency from 'data/global-term-freqs.json'
	
	Data Update:
		Listens to FilteredTermTopicProbabilityModel (events: )

	Details:
	--------
	Pulls data from FilteredTermTopicProbilityModel. The model loads some parameters from 
	the url. On updates, the model receives a list
	of terms and generates a list of item(term, frequency) (same order as the term list
	received as input).  
*/
var TermFrequencyModel = Backbone.Model.extend({
	defaults : {
		"termIndex" : null,
		"totalTermFreqs": {},
		"topicalFreqMatrix": [],
		"colorList": [],
		"selectedTopics": {} 
	},
	url : "data/global-term-freqs.json",
	initialize : function() {
		this.parentModel = null;
		this.stateModel = null;
		
		// original data
		this.originalMatrix = null;
		this.originalTopicIndex = null;
		this.originalTermIndex = null;
		
		// mappings
		this.termFreqMap = null;
		
		// iteractions
		// TODO: (later) clean up these. Definitely don't need all of these variables
		this.selectedTopics = {};
		this.colorList = [];
		this.colorToTopic = {};
		this.topicalFreqs = null;
	}
});

/**
 * Initialize Term Frequency Model's parent and state model
 *
 * @private
 */
TermFrequencyModel.prototype.initModels = function( parent, state ){
	this.parentModel = parent;
	this.stateModel = state;
};

/**
 * Initialize all topics' selection status to null (called once by load)
 *
 * @private
 */
TermFrequencyModel.prototype.defaultSelection = function(){
	var topicIndex = this.parentModel.get("topicIndex");
	for( var i = 0; i < topicIndex.length; i++ ){
		this.selectedTopics[i] = null;
	}
	this.set("selectedTopics", this.selectedTopics);
};

/**
 * Loads matrix, termIndex, topicIndex, and term to frequency mapping from the model's "url"
 * and triggers a loaded event that the next model (child model) listens to. Also, pulls 
 * any selected topics from state model and processes them.
 * (This function is called after the filtered model loaded event is fired)
 *
 * @param { string } the location of datafile to load values from
 * @return { void }
 */
TermFrequencyModel.prototype.load = function(){	
	var successHandler = function( model, response, options )
	{
		this.set("termIndex", this.parentModel.get("termIndex"));
		
		this.originalMatrix = response.matrix;
		this.originalTopicIndex = response.topicIndex;
		this.originalTermIndex = response.termIndex;
		
		this.termFreqMap = response.termFreqMap;
		this.defaultSelection();
		this.getTotalTermFreqs();	
		
		// process selected topics from the saved state
		var coloredTopics = this.stateModel.get("selectedTopics");
		var colorList = [];
		for( var obj in coloredTopics){
			claimColor( coloredTopics[obj] );
			colorList.push({"topic":obj, "color":coloredTopics[obj]});
		}	
		colorList.sort(function(a, b) {return colorNames.indexOf(a.color) - colorNames.indexOf(b.color)});
		for( var i = 0; i < colorList.length; i++){
			this.selectTopic({"topic": colorList[i].topic, "color": colorList[i].color} );
		}
		
		// signal completion
		this.trigger("loaded:freqModel");	
		
	}.bind(this);
	var errorHandler = function( model, xhr, options ) { }.bind(this);
	this.fetch({
		add : false,
		success : successHandler,
		error : errorHandler
	});	
};

/**
 * Calls appropriate functions to update based on data change(s)
 */
TermFrequencyModel.prototype.update = function(){	
	this.generateTopicalMatrix( true );
	this.getTotalTermFreqs();	
	this.set("termIndex", this.parentModel.get("termIndex"));
};

/** 
 * Finds total frequency for each term in termIndex
 *
 * @private
 */
TermFrequencyModel.prototype.getTotalTermFreqs = function(){
	var frequencies = {};
	var terms = this.parentModel.get("termIndex");
	for( var i = 0; i < terms.length; i++){
		frequencies[terms[i]] = this.termFreqMap[terms[i]];
	}
	this.set("totalTermFreqs", frequencies);
};

/** 
 * Finds frequency / topic for each term in termIndex and each topic in selectedTopics
 *
 * @private
 */
TermFrequencyModel.prototype.generateTopicalMatrix = function( keepQuiet ) {
	var frequencies = [];
	var terms = this.parentModel.get("termIndex");
	for( var index = 0; index < this.colorList.length; index++){
		var tempList = [];
		var topic = this.colorToTopic[this.colorList[index]];
		for( var i = 0; i < terms.length; i++){
			var termIndex = this.originalTermIndex.indexOf(terms[i]);
			tempList.push(this.originalMatrix[termIndex][topic]);
		} 
		frequencies.push(tempList);
	}
	this.topicalFreqs = frequencies;
	this.set("topicalFreqMatrix", frequencies, {silent: keepQuiet});
	this.set("colorList", this.colorList);
	this.set("selectedTopics", this.selectedTopics);
	return frequencies;
};

/** 
 * Called by term frequency view. Returns frequency / topic for every term in termIndex
 *
 * @this { TermFrequencyModel }
 * @param { int } target topic index
 * @return { array } list of topical frequencies in termIndex ordering
 */
TermFrequencyModel.prototype.getTopicalsForTopic = function( topic ) {
	var frequencies = [];
	var terms = this.get("termIndex");
	for( var i = 0; i < terms.length; i++){
		var termIndex = this.originalTermIndex.indexOf(terms[i]);
		frequencies.push(this.originalMatrix[termIndex][topic]);
	} 
	return frequencies;
};

// interactions
/**
 * Behavior when topic is selected
 *
 * @this { TermFrequencyModel }
 * @param { object } topic: target topic index, color: associated color
 * @return { void }
 */
TermFrequencyModel.prototype.selectTopic = function( obj ) {
	var topic = obj.topic;
	var color = obj.color;
	var topicIndex = this.parentModel.get("topicIndex");
	if( topic !== null){

		// if color is DEFAULT, the event can be treated as a deselect
		if( color === DEFAULT) {
			if(this.selectedTopics[topic] !== null){
				var index = this.colorList.indexOf(this.selectedTopics[topic]);
				this.colorList.splice(index,1);
				this.selectedTopics[topic] = null;
				delete this.colorToTopic[color];
				
			} else {
				return;
			}
		}	
		// only add if this topic wasn't added previously
		else if(this.selectedTopics[topic] === null) {
			this.selectedTopics[topic] = color;
			this.colorList.push(color);
			this.colorToTopic[color] = topic;
		}
		
		// recompute the topical matrix
		this.generateTopicalMatrix( false );
	}
};
