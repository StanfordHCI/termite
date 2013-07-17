/**
* Add a control panel to HTML element "div.OrderingVisibilityControlPanel".
*
* @param {Object} options On initialization, options must contain an entry 'model' of type TermTopicMatrixObject and an entry 'vis' of type TermTopicMatrixVis.
 * @class A user interface for showing/hiding/reordering terms and topics.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var OrderingVisibilityControlPanel = Backbone.View.extend({
	initialize : function( options ) {
		this.vis = options.vis;
		this.containerID = "div.OrderingVisibilityControlPanel";
		this.__selectedIndex = null;
		this.__visibleLabels = {};
		
		this.__container = d3.select( this.el )
			.style( "display", "inline-block" )
			.style( "cursor", "default" );

		var pTopics = this.__container.append( "p" );
		var pTerms = this.__container.append( "p" );
		
		pTopics.append( "span" ).text( "Display topics: " )
			.style( "display", "inline-block" )
			.style( "width", "90px" )
			.style( "margin-right", "5px" )
			.style( "text-align", "right" );
		this.__visibleTopics = pTopics.append( "input" )
			.style( "min-width", "400px" )
			.style( "margin-right", "10px" )
			.on( "keydown", this.__onChangeVisibleColumns.bind(this) );

		pTerms.append( "span" ).text( "Display terms: " )
			.style( "display", "inline-block" )
			.style( "width", "90px" )
			.style( "margin-right", "5px" )
			.style( "text-align", "right" );
		this.__visibleTerms = pTerms.append( "input" )
			.style( "min-width", "400px" )
			.style( "margin-right", "10px" )
			.on( "keydown", this.__onChangeVisibleTerms.bind(this) );

		this.listenTo( this.model, "all", this.__processModelEvents );
		$( this.containerID ).append( this.el );
	}
});

OrderingVisibilityControlPanel.prototype.__onChangeVisibleColumns = function()
{
	if ( d3.event.keyCode == 13 )
	{
		var value = d3.event.srcElement.value;
		if ( value.trim().length == 0 )
		{
			this.model.showColumns();
		}
		else
		{
			var indexes = value.split( /\D+/g ).map( function(d) { return parseInt(d, 10) - 1 } );
			this.model.showColumns( indexes );
			this.model.orderColumns( indexes );
		}
	}
};

OrderingVisibilityControlPanel.prototype.__onChangeVisibleTerms = function()
{
	if ( d3.event.keyCode == 13 )
	{
		var value = d3.event.srcElement.value;
		if ( value.trim().length == 0 )
		{
			this.model.showRows();
		}
		else
		{
			var indexes = value.split( /\D+/g ).map( function(d) { return parseInt(d, 10) - 1 } );
			this.model.showRows( indexes );
			this.model.orderRows( indexes );
		}
	}
};

OrderingVisibilityControlPanel.prototype.__processModelEvents = function( e )
{
	if ( e == "updated:data" || e == "updated:visibility" || e == "updated:ordering" )
	{
		var columnVisibleIndexes = this.model.get( "columnVisibleIndexes" ).slice(0);
		var rowVisibleIndexes = this.model.get( "rowVisibleIndexes" ).slice(0);
		this.__visibleTopics[0][0].value = columnVisibleIndexes.map( function(d) { return d+1 } ).join( " " );
		this.__visibleTerms[0][0].value = rowVisibleIndexes.map( function(d) { return d+1 } ).join( " " );
	}
};
