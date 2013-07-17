/**
 * Add a control panel to HTML element "div.MouseEventsControlPanel".
 *
 * @param {Object} options On initialization, options must contain an entry 'model' of type TermTopicMatrixObject and an entry 'vis' of type TermTopicMatrixVis.
 * @class A user interface for enabling/disabling mouse events.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var MouseEventsControlPanel = Backbone.View.extend({
	initialize : function( options ) {
		this.vis = options.vis;
		this.containerID = "div.MouseEventsControlPanel";
		
		this.__container = d3.select( this.el )
			.style( "display", "inline-block" )
			.style( "cursor", "default" );

		var pMouseEvents = this.__container.append( "p" );
		var pDragDrop = this.__container.append( "p" );
		pMouseEvents.append( "input" )
			.attr( "type", "checkbox" )
			.attr( "checked", "checked" )
			.style( "margin-right", "10px" )
			.on( "change", this.__onClickMouseEvents.bind(this) );
		pMouseEvents.append( "span" )
			.style( "margin-right", "10px" )			
			.text( "Enable mouse events for selections and highlighting." );

		pDragDrop.append( "input" )
			.attr( "type", "checkbox" )
			.attr( "checked", "checked" )
			.style( "margin-right", "10px" )
			.on( "change", this.__onClickDragDrop.bind(this) );
		pDragDrop.append( "span" )
			.style( "margin-right", "10px" )			
			.text( "Enable mouse events for drag-n-drop." );

		$( this.containerID ).append( this.el );
	}
});

MouseEventsControlPanel.prototype.__onClickMouseEvents = function()
{
	if ( d3.event.srcElement.checked )
		this.vis.enableMouseOverAndClicks();
	else
		this.vis.disableMouseOverAndClicks();
};


MouseEventsControlPanel.prototype.__onClickDragDrop = function()
{
	if ( d3.event.srcElement.checked )
		this.vis.enableDragAndDrop();
	else
		this.vis.disableDragAndDrop();
};
