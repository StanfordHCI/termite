/**
 * @class This object contains all internal variables needed to represent a NavigationView.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 * @param {Object} options The "options" object must contain an entry 'options.state' of type "NavigationState".
 **/
var NavigationModel = Backbone.Model.extend({
	"defaults" : {
		"nodes" : []
	}
});

/**
 * Backbone-specific initialization routine.
 * @private
 **/
NavigationModel.prototype.initialize = function( options ) {
	this.state = options.state;
	this.state.model = this;
	this.__initStateEvents();
};

//------------------------------------------------------------------------------

NavigationModel.prototype.__initStateEvents = function() {
	this.listenTo( this.state, "change", this.__onStateEvents );
};

NavigationModel.prototype.__onStateEvents = function() {
	var nodes = [];
	var entries = this.state.get( "entries" );
	var currentEntryID = this.state.get( "currentEntryID" );
	for ( var n = 0; n < entries.length; n++ ) {
		var entry = entries[n];
		var node = {
			"index" : n,
			"text" : entry.entryDescription,
			"parent" : null,
			"children" : [],
			"isActive" : n === currentEntryID
		};
		var entryParentID = entry.entryParentID;
		if ( entryParentID === null ) {
			node.position = 0;
		}
		else {
			var parentNode = nodes[ entryParentID ];
			node.position = parentNode.position + 1;
			node.parent = parentNode;
			parentNode.children.push( node );
		}
		nodes.push( node );
	}
	this.set( "nodes", nodes );
};
