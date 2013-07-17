/**
* Add a control panel to HTML element "div.NormalizationControlPanel".
*
* @param {Object} options On initialization, options must contain an entry 'model' of type TermTopicMatrixObject and an entry 'vis' of type TermTopicMatrixVis.
 * @class A user interface for setting matrix normalization.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var NormalizationControlPanel = Backbone.View.extend({
	initialize : function( options ) {
		this.vis = options.vis || null;
		this.containerID = options.containerID || "div.NormalizationControlPanel";
		this.__selectedIndex = null;
		this.__visibleLabels = {};
		
		this.__container = d3.select( this.el )
			.style( "display", "inline-block" )
			.style( "cursor", "default" );

		this.__container.append( "span" ).text( "Normalize by " );
		this.__normalization = this.__container.append( "select" )
			.style( "min-width", "125px" )
			.on( "change", this.__onChangeNormalization.bind(this) );
			
		var options = [ "none", "row", "column" ];
		this.__normalization.selectAll( "option" ).data( options ).enter().append( "option" )
			.attr( "value", function(d) { return d } )
			.text( function(d) { return d } );
			
		this.listenTo( this.model, "all", this.__processModelEvents.bind(this) );
		$( this.containerID ).append( this.el );
	}
});

NormalizationControlPanel.prototype.__onChangeNormalization = function()
{
	var normalization = d3.event.srcElement.value;
	this.model.normalize( normalization );
};

NormalizationControlPanel.prototype.__processModelEvents = function( e )
{
	if ( e == "updated:data" || e == "updated:normalization" )
	{
		this.__normalization[0][0].value = this.model.get( "normalization" );
	}
};
