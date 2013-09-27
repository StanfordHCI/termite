/**
 * @class This object contains all variables needed to (re)construct the unique state of a NavigationModel.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var NavigationState = Backbone.Model.extend({
	"defaults" : {
		"entries" : [],         // Indicate a complete reset of states.
		"currentEntryID" : 0
	}
});
