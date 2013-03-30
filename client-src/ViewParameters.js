/*
	ViewParameters.js
	
	This file contains some final parameters for the view elements. 
	
	Parameters include:
		-defaults for different objects
		-functions to assign colors to events
		-functions to generate consistent class tags for objects based on term or topic
*/
//=====================================================================================
//									VIEW PARAMS
//=====================================================================================
var THRESHHOLD = 0.01;

var HIGHLIGHT = "red";
var DEFAULT = "default";
var DESELECT = "deselect";

var colorNames = ["orange", "blue", "green", "purple", "brown", "pink"];
var colorObjs = [];

/**
 * Initializes the color objects to all free or according to the given object
 *
 * @param { list } list of used colors (should be initialized with usage:true)
 */
function initColorObjects( loadObj ) {
	if(loadObj === null){
		for( var index = 0; index < colorNames.length; index++ ) {
			colorObjs.push({color: colorNames[index], usage: false});
		}
	}
	else{
		// load some initial usage from passed object (from state)
	}
}
/**
 * Returns the first free color if any. Marks returned color as used if not DEFAULT
 */
function getColor() {
	var color = DEFAULT;
	for( var index = 0; index < colorObjs.length; index++ ){
		if( !(colorObjs[index].usage) ){
			color = colorObjs[index].color;
			colorObjs[index].usage = true;
			break;
		}
	}
	return color;
}
/**
 * Marks the given color as usage:false if that color name exists
 *
 * @param { string } name of color to be freed
 */
function freeColor( color ) {
	if( color !== DEFAULT ){
		for( var index = 0; index < colorObjs.length; index++ ){
			if( color === colorObjs[index].color){
				colorObjs[index].usage = false;
				break;
			}
		}
	}
};
function claimColor( color ){
	if( color !== DEFAULT ){
		for( var index = 0; index < colorObjs.length; index++ ){
			if( color === colorObjs[index].color){
				colorObjs[index].usage = true;
				break;
			}	
		}
	}
};

/**
 * consistent d3 class labeling helper functions
 *
 * @param { string, int } term or topic to use in classname
 * @return { string } class name based on input
 */
function getTopicClassTag( topic ){
	return "__topic_" + sanitize(topic);
}
function getTermClassTag( term ){
	return "__term_" + sanitize(term);
}
function sanitize( text ){
	// Need to account for non-alphanumeric characters
	// Return a unique identifier for any input string
	return text.replace( /[^A-Za-z0-9]/g, "_" );
}
/** end class labeling helper functions **/
