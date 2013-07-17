/**
 * Add a control panel to HTML element "div.LabelControlPanel".
 *
 * @param {Object} options On initialization, options must contain an entry 'model' of type TermTopicMatrixObject and an entry 'vis' of type TermTopicMatrixVis.
 * @class A user interface for setting term texts and topic labels.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var LabelControlPanel = Backbone.View.extend({
	initialize : function( options ) {
		this.vis = options.vis || null;
		this.containerID = options.containerID || "div.LabelControlPanel";
		this.__columnIndex = null;
		this.__visibleColumnLabels = {};
		this.__rowIndex = null;
		this.__visibleRowLabels = {};
		
		this.__container = d3.select( this.el )
			.style( "display", "inline-block" )
			.style( "cursor", "default" );

		var pColumns = this.__container.append( "p" );
		var pRows = this.__container.append( "p" );

		pColumns.append( "span" ).text( "Rename topic " );
		this.__currentColumnLabels = pColumns.append( "select" )
			.style( "min-width", "125px" )
			.on( "change", this.__onChangeColumnIndex.bind(this) );

		pColumns.append( "span" ).text( " to " );
		this.__newColumnLabel = pColumns.append( "input" )
			.style( "min-width", "160px" )
			.on( "keydown", this.__onEnterColumnLabel.bind(this) );

		pRows.append( "span" ).text( "Rename term " );
		this.__currentRowLabels = pRows.append( "select" )
			.style( "min-width", "125px" )
			.on( "change", this.__onChangeRowIndex.bind(this) );

		pRows.append( "span" ).text( " to " );
		this.__newRowLabel = pRows.append( "input" )
			.style( "min-width", "160px" )
			.on( "keydown", this.__onEnterRowLabel.bind(this) );

		this.listenTo( this.model, "all", this.__processModelEvents );
		if ( this.vis !== null )
		{
			this.listenTo( this.vis, "fired:click:column", this.__processColumnClickEvents );
			this.listenTo( this.vis, "fired:dragdrop:column", this.__processColumnClickEvents );
			this.listenTo( this.vis, "fired:click:row", this.__processRowClickEvents );
			this.listenTo( this.vis, "fired:dragdrop:row", this.__processRowClickEvents );
		}
		$( this.containerID ).append( this.el );
	}
});

LabelControlPanel.prototype.__onChangeColumnIndex = function()
{
	this.__columnIndex = parseInt( this.__currentColumnLabels[0][0].value );
	this.__newColumnLabel[0][0].value = this.__visibleColumnLabels[ this.__columnIndex ];
};
LabelControlPanel.prototype.__onChangeRowIndex = function()
{
	this.__rowIndex = parseInt( this.__currentRowLabels[0][0].value );
	this.__newRowLabel[0][0].value = this.__visibleRowLabels[ this.__rowIndex ];
};

LabelControlPanel.prototype.__onEnterColumnLabel = function()
{
	if ( d3.event.keyCode == 13 )
	{
		var index = parseInt( this.__currentColumnLabels[0][0].value );
		var label = this.__newColumnLabel[0][0].value;
		var columnLabels = this.model.get( "columnLabels" ).slice(0);
		columnLabels[ index ] = label;
		this.model.labelColumns( columnLabels );
	}
};
LabelControlPanel.prototype.__onEnterRowLabel = function()
{
	if ( d3.event.keyCode == 13 )
	{
		var index = parseInt( this.__currentRowLabels[0][0].value );
		var label = this.__newRowLabel[0][0].value;
		var rowLabels = this.model.get( "rowLabels" ).slice(0);
		rowLabels[ index ] = label;
		this.model.labelRows( rowLabels );
	}
};

LabelControlPanel.prototype.__processModelEvents = function( e )
{
	if ( e == "updated:data" || e == "updated:visibility" || e == "updated:label" || e == "updated:ordering" )
	{
		var columnVisibleIndexes = this.model.get( "columnVisibleIndexes" );
		var columnElements = this.model.get( "columnElements" );

		this.__visibleColumnLabels = {};
		var visibleElements = new Array( columnVisibleIndexes.length );
		for ( var i = 0; i < columnVisibleIndexes.length; i++ )
		{
			var index = columnVisibleIndexes[i];
			var element = columnElements[index];
			this.__visibleColumnLabels[index] = element.label;
			visibleElements[i] = { 'index' : index, 'label' : element.label };
		}

		var options = this.__currentColumnLabels.selectAll( "option" ).data( visibleElements );
		options.exit().remove();
		options.enter().append( "option" );
		this.__currentColumnLabels.selectAll( "option" )
			.attr( "value", function(d) { return d.index } )
			.text( function(d) { return d.label } );

		if ( ! this.__visibleColumnLabels.hasOwnProperty( this.__columnIndex ) )
			this.__columnIndex = columnVisibleIndexes[0];
		this.__currentColumnLabels[0][0].value = this.__columnIndex;
		this.__newColumnLabel[0][0].value = this.__visibleColumnLabels[ this.__columnIndex ];

		var rowVisibleIndexes = this.model.get( "rowVisibleIndexes" );
		var rowElements = this.model.get( "rowElements" );

		this.__visibleRowLabels = {};
		var visibleElements = new Array( rowVisibleIndexes.length );
		for ( var i = 0; i < rowVisibleIndexes.length; i++ )
		{
			var index = rowVisibleIndexes[i];
			var element = rowElements[index];
			this.__visibleRowLabels[index] = element.label;
			visibleElements[i] = { 'index' : index, 'label' : element.label };
		}

		var options = this.__currentRowLabels.selectAll( "option" ).data( visibleElements );
		options.exit().remove();
		options.enter().append( "option" );
		this.__currentRowLabels.selectAll( "option" )
			.attr( "value", function(d) { return d.index } )
			.text( function(d) { return d.label } );

		if ( ! this.__visibleRowLabels.hasOwnProperty( this.__rowIndex ) )
			this.__rowIndex = rowVisibleIndexes[0];
		this.__currentRowLabels[0][0].value = this.__rowIndex;
		this.__newRowLabel[0][0].value = this.__visibleRowLabels[ this.__rowIndex ];
	}
};

LabelControlPanel.prototype.__processColumnClickEvents = function( e )
{
	this.__columnIndex = e.data.index;
	if ( ! this.__visibleColumnLabels.hasOwnProperty( this.__columnIndex ) )
		this.__columnIndex = columnVisibleIndexes[0];
	this.__currentColumnLabels[0][0].value = this.__columnIndex;
	this.__newColumnLabel[0][0].value = this.__visibleColumnLabels[ this.__columnIndex ];
};

LabelControlPanel.prototype.__processRowClickEvents = function( e )
{
	this.__rowIndex = e.data.index;
	if ( ! this.__visibleRowLabels.hasOwnProperty( this.__rowIndex ) )
		this.__rowIndex = rowVisibleIndexes[0];
	this.__currentRowLabels[0][0].value = this.__rowIndex;
	this.__newRowLabel[0][0].value = this.__visibleRowLabels[ this.__rowIndex ];
};
