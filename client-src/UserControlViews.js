// Expects to be bound to the state model
var TotalTermsView = Backbone.View.extend({
	el : 'div.TotalTermsView',
	render : function()
	{
		d3.select(this.el).text( this.model.get("totalTerms") );
	}
});

// Affinity Number Terms
// Need to bound to the state model
var AffinityNumTermsView = Backbone.View.extend({
	el : 'div.AffinityNumTermsView',
	render : function()
	{
		d3.select(this.el).text( this.model.get("numAffinityTerms") );
	}
});

// Expects to be bound to the state model
var AffinityNumTermsSlider = Backbone.View.extend({
	el : 'input.AffinityNumTermsSlider',
	events : {
		'change' : function(e) {
			this.model.set("numAffinityTerms", parseInt(e.target.value));
		}
	},
	initialize : function() {
		this.model.on( "change:numAffinityTerms", function(value) {
			d3.select(this.el)[0][0].value = this.model.get("numAffinityTerms");
		}, this);
	}
});


// Salient Number Terms
// Expects to be bound to the state model
var SalientNumTermsView = Backbone.View.extend({
	el : 'div.SalientNumTermsView',
	render : function()
	{
		d3.select(this.el).text( this.model.get("numSalientTerms") );
	}
});

// Expects to be bound to the state model
var SalientNumTermsSlider = Backbone.View.extend({
	el: 'input.SalientNumTermsSlider',
	events : {
		'change' : function(e) {
			this.model.set("numSalientTerms", parseInt(e.target.value));
		}
	},
	initialize : function() {
		this.model.on( "change:numSalientTerms", function(value) {
			d3.select(this.el)[0][0].value = this.model.get("numSalientTerms");
		}, this);
	}
});

// User Defined Terms
// Expects to be bound to the state model
var FoundTermsView = Backbone.View.extend({
	el : 'div.FoundTermsView',
	render : function()
	{
		d3.select(this.el).text( this.model.get("foundTerms"));
	}
});

// Expects to be bound to the state model
var UnfoundTermsView = Backbone.View.extend({
	el: 'div.UnfoundTermsView',
	prefix: 'div.UnfoundTermsPrefix',
	render : function()
	{
		if( this.model.get("unfoundTerms") !== ""){
			d3.select( this.prefix ).style("visibility", "visible");
			d3.select( this.el ).style("visibility", "visible").text( this.model.get("unfoundTerms"));
		} else {
			d3.select( this.prefix ).style("visibility", "hidden");
			d3.select( this.el ).style("visibility", "hidden");
		}
	} 
});

// Expects to be bound to the state model
var UserDefinedTermsBox = Backbone.View.extend({
	el: 'input.UserDefinedTermsBox',
	events : {
		'keyup' : function(e) {
			this.model.setVisibleTerms(e.target.value);
		}
	},
	initialize : function() {
		this.model.on( "change:visibleTerms", function(value) {
			d3.select(this.el)[0][0].value = this.model.get("visibleTerms").join(", ");
		}, this);
	}
});

// Expects to be bound to the state model
var AddTopTwenty = Backbone.View.extend({
	el: 'input.TopTwentyAddition',
	events : {
		'change' : function(e) {
			this.model.set("addTopTwenty", e.target.checked);
		}
	},
	initialize : function() {
		this.model.on( "change:addTopTwenty", function(value) {
			d3.select(this.el)[0][0].checked = this.model.get("addTopTwenty");
		}, this);
	}
});

// Expects to be bound to the state model
var SortDescription = Backbone.View.extend({
	el: 'div.SortDescription',
	render : function()
	{
		var sort = this.model.get("sortType");
		var topic = this.model.get("doubleClickTopic");
		var output = "";
		if( sort === "" )
			output = "default";
		else if (sort === "asc")
			output = "ascending on topic #" + topic;
		else
			output = "descending on topic #" + topic;
		d3.select(this.el).text( output );
	},
	initialize : function() {
		// TODO: call render's function?
		this.model.on( "change:sortType change:doubleClickTopic", function(value) {
			var sort = this.model.get("sortType");
			var topic = this.model.get("doubleClickTopic");
			var output = "";
			if( sort === "" )
				output = "default";
			else if (sort === "asc")
				output = "ascending on topic #" + topic;
			else
				output = "descending on topic #" + topic;
			d3.select(this.el).text( output );
		}, this);
	}
});

// Expects to be bound to the state model
var ClearAllButton = Backbone.View.extend({
	el: 'button.clearAll',
	events : {
		'click' : function(e) {
			this.model.clearAllSelectedTopics();
		}
	}
});

// Expects to be bound to the state model
var ClearSortButton = Backbone.View.extend({
	el: 'button.clearSort',
	events : {
		'click' : function(e) {
			this.model.clearSorting();
		}
	}
});
