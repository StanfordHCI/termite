/*
	SeriatedTermTopicProbabilityModel.js
	
	Currently: Reads in input file to get seriated terms, topics, term information 
		(e.g. saliency), and matrix of similarity values.
		
	
	Designed to take in a subset of the full list of terms, topics, and matrix. 
*/

var SeriatedTermTopicProbabilityModel = Backbone.Model.extend({
	defaults : {
		"matrix" : null,
		"termIndex" : null,
		"topicIndex" : null,
		"sparseMatrix" : null	// currently null
	},
	url : "data/seriated-parameters.json",
	initialize : function() {
		this.parentModel = null;
	}
});

/**
 * Initialize seriated's parent model
 *
 * @private
 */
SeriatedTermTopicProbabilityModel.prototype.initModel = function ( fullModel ) {
	this.parentModel = filteredModel;
};

/**
 * Loads matrix, termIndex, and topicIndex from the model's "url"
 * and triggers a loaded event that the next model (child model) listens to.  
 * (This function is called after the state model loaded event is fired)
 *
 * @param { string } the location of datafile to load values from
 * @return { void }
 */
SeriatedTermTopicProbabilityModel.prototype.load = function () {
	var successHandler = function( model, response, options )
	{
		this.trigger("loaded:seriated");	
		
	}.bind(this);
	var errorHandler = function( model, xhr, options ) { }.bind(this);
	this.fetch({
		add : true,
		success : successHandler,
		error : errorHandler
	});	
};