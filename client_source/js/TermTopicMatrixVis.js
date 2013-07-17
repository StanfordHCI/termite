/**
 * Create a visualization of a term-topic matrix.
 * By default, the visualization will added to the HTML element "div.NormalizationControlPanel".
 *
 * @param {Object} options On initialization, options must contain an entry 'model' of type TermTopicMatrixObject. Options may also an entry 'containerID' specifying the HTML element to which the visualization will be added.
 * @class Visualization for displaying a term-topic matrix.
 * Visual attributes (layout, sizes, and colors) are automatically recalculated to reflect changes in visibility, ordering, selection, highlighting, and labels.
 * Mouse interactionis are built into the visualization to support reordering, selecting, and higlighting of terms and topic.
 * The visualization can be customized with resizable panels and adjustable animation speed.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 **/
var TermTopicMatrixVis = Backbone.View.extend({
	initialize : function( options ) {
		this.containerID = "div.TermTopicMatrixVis";
		if ( options  &&  options.containerID )
			this.containerID = options.containerID;
		this.__initConstants();
		this.__initHtmlElements();
		this.__initEvents();
		this.enableMouseUIs();
	}
});

//--------------------------------------------------------------------------------------------------

/**
 * A list of 10 refresh events that are triggered by TermTopicMatrixVis to indicate changes in visual attributes.
 * @constant
 **/
TermTopicMatrixVis.prototype.REFRESH_EVENTS = {
	HTML_ELEMENTS : "html_elements",
	CALCULATE_LAYOUT : "calculate_layouts",
	CALCULATE_SIZES : "calculate_sizes",
	ALL_VISIBILITY : "all_visibility",
	ALL_LAYOUT : "all_layouts",
	MATRIX_SIZES : "matrix_sizes",
	BAR_SIZES : "bar_sizes",
	ALL_COLORS : "all_colors",
	ALL_TEXTS : "all_texts",
	CONSTANTS : "constants"
};

/**
 * A list of 11 mouse events that are fired by TermTopicMatrixVis.
 * @constant
 **/
TermTopicMatrixVis.prototype.UI_EVENTS = {
	ENTER_ROW : "enter:row",
	CLICK_ROW : "click:row",
	EXIT_ROW : "exit:row",
	DRAGDROP_ROW : "drag_drop:row",
	
	ENTER_COLUMN : "enter:column",
	CLICK_COLUMN : "click:column",
	EXIT_COLUMN : "exit:column",
	DRAGDROP_COLUMN : "drag_drop:column",
	
	ENTER_CELL : "enter:cell",
	EXIT_CELL : "exit:cell",
	CLICK_CELL : "click:cell"
};

/**
 * @private
 **/
TermTopicMatrixVis.prototype.CONSTANTS = {};

/**
 * Updates applied to the term-topic matrix visuzliation within the debounce duration are
 * combined into a single refresh for more efficient rendering.
 * @constant
 **/
TermTopicMatrixVis.prototype.CONSTANTS.DEBOUNCE_DURATION = 25;

/**
 * @private
 **/
TermTopicMatrixVis.prototype.DEFAULTS = {
	LEFT_PANEL_WIDTH : 100,
	TOP_PANEL_HEIGHT : 80,
	RIGHT_PANEL_WIDTH : 100,
	BOTTOM_PANEL_HEIGHT : 80,
	MAX_COLUMN_BAR_LENGTH_PX : 75,  // Default to BOTTOM_PANEL_HEIGHT - 5
	FAR_PANEL_WIDTH : 125,
	MAX_ROW_BAR_LENGTH_PX : 120,    // Default to FAR_PANEL_WIDTH - 5
	
	LEFT_PADDING : 10,
	TOP_PADDING : 10,
	RIGHT_PADDING : 5,
	BOTTOM_PADDING : 5,
	FAR_PADDING : 10,
	OUTER_PADDING : 20,

	MAX_RADIUS_PX : 20,
	SPACING_PX : 16,
	BAR_WIDTH_PX : 12,   // Default to SPACING_PX * 0.75
	FONT_SIZE_PT : 8,    // Default to SPACING_PX * 0.5
	TOP_LABEL_ANGLE_DEG : -65,

	DEFAULT_COLOR : "#7f7f7f",
	DEFAULT_BACKGROUND : "#c7c7c7",
	HIGHLIGHT_COLOR : "#d62728",
	HIGHLIGHT_BACKGROUND : "#ff9896",
	SELECTION_COLORS : [ "#1f77b4", "#ff7f0e", "#2ca02c", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf" ],
	SELECTION_BACKGROUNDS : [ "#aec7e8", "#ffbb78", "#98df8a", "#c5b0d5", "#c49c94", "#f7b6d2", "#dbdb8d", "#9edae5" ],

	ANIMATION_ENABLED : true,
	ANIMATION_DURATION_MSEC : 225,
	ANIMATION_EASE : "cubic-in-out"
};

//--------------------------------------------------------------------------------------------------

/**
 * @private
 **/
TermTopicMatrixVis.prototype.__initConstants = function()
{
	this.__const = {};
	for ( var i in this.DEFAULTS )
		this.__const[i] = this.DEFAULTS[i];
};

/**
 * @private
 **/
TermTopicMatrixVis.prototype.__setConstant = function( attribute, value )
{
	if ( attribute in this.__const )
	{
		this.__const[ attribute ] = value;
	}
};

/**
 * @private
 **/
TermTopicMatrixVis.prototype.__setConstantAndUpdate = function( attribute, value )
{
	if ( attribute in this.__const )
	{
		this.__const[ attribute ] = value;
		this.__processConstantUpdates();
	}
};

/**
 * Set the width of the left panel consisting of term texts.
 * @param {number} width Width in pixels.
 **/
TermTopicMatrixVis.prototype.setLeftPanelWidth = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.LEFT_PANEL_WIDTH;
	value = Math.min( 1000, Math.max( 25, value ) );
	this.__setConstantAndUpdate( "LEFT_PANEL_WIDTH", value );
	return this;
};

/**
 * Set the height of the top panel consisting of topic labels.
 * @param {number} height Height in pixels.
 **/
TermTopicMatrixVis.prototype.setTopPanelHeight = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.TOP_PANEL_HEIGHT;
	value = Math.min( 1000, Math.max( 25, value ) );
	this.__setConstantAndUpdate( "TOP_PANEL_HEIGHT", value );
	return this;
};

/**
 * Set the width of the right panel consisting of term texts.
 * @param {number} width Width in pixels.
 **/
TermTopicMatrixVis.prototype.setRightPanelWidth = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.RIGHT_PANEL_WIDTH;
	value = Math.min( 1000, Math.max( 25, value ) );
	this.__setConstantAndUpdate( "RIGHT_PANEL_WIDTH", value );
	return this;
};

/**
 * Set the height of the bottom panel consisting of column totals.
 * @param {number} height Height in pixels.
 **/
TermTopicMatrixVis.prototype.setBottomPanelHeight = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.BOTTOM_PANEL_HEIGHT;
	value = Math.min( 1000, Math.max( 25, value ) );
	this.__setConstantAndUpdate( "BOTTOM_PANEL_HEIGHT", value );
	this.__setConstantAndUpdate( "MAX_COLUMN_BAR_LENGTH_PX", value - 5 );
	return this;
};

/**
 * Set the width of the far panel consisting of row totals.
 * @param {number} width Width in pixels.
 **/
TermTopicMatrixVis.prototype.setFarPanelWidth = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.FAR_PANEL_WIDTH;
	value = Math.min( 1000, Math.max( 25, value ) );
	this.__setConstantAndUpdate( "FAR_PANEL_WIDTH", value );
	this.__setConstantAndUpdate( "MAX_ROW_BAR_LENGTH_PX", value - 5 );
	return this;
};

/**
 * Set the maximum radius for matrix entries.
 * @param {number} radius Radius in pixels.
 **/
TermTopicMatrixVis.prototype.setMaxRadius = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.MAX_RADIUS_PX;
	value = Math.min( 50, Math.max( 5, value ) );
	this.__setConstantAndUpdate( "MAX_RADIUS_PX", value );
	return this;
};

/**
 * Set the spacing between matrix entries.
 * @param {number} spacing Spacing in pixels.
 **/
TermTopicMatrixVis.prototype.setSpacing = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.SPACING_PX;
	value = Math.min( 40, Math.max( 4, value ) );
	this.__setConstantAndUpdate( "SPACING_PX", value );
	this.__setConstantAndUpdate( "BAR_WIDTH_PX", value * 0.75 );
	this.__setConstantAndUpdate( "FONT_SIZE_PT", value * 0.5 );
	return this;
};

/**
 * Enable animated transitions.
 **/
TermTopicMatrixVis.prototype.enableAnimations = function()
{
	this.__setConstant( "ANIMATION_ENABLED", true );
	return this;
};

/**
 * Disable animated transitions.
 **/
TermTopicMatrixVis.prototype.disableAnimations = function()
{
	this.__setConstant( "ANIMATION_ENABLED", false );
	return this;
};

/**
 * Set the speed of animated transitions.
 * @param {number} duration Duration in milliseconds.
 **/
TermTopicMatrixVis.prototype.setAnimationDuration = function( value )
{
	value = parseFloat( value ) || this.DEFAULTS.ANIMATION_DURATION_MSEC;
	value = Math.min( 1000, Math.max( 100, value ) );
	this.__setConstant( "ANIMATION_DURATION_MSEC", value );
	return this;
};

/**
 * Set the easing characteristics of animated transitions.
 * @param {number} ease Easing style (default = 'linear').
 **/
TermTopicMatrixVis.prototype.setAnimationEase = function( ease )
{
	ease = ease || this.DEFAULTS.ANIMATION_EASE;
	this.__setConstant( "ANIMATION_EASE", ease );
	return this;
};

//--------------------------------------------------------------------------------------------------

/**
 * Initialize the data structure (queue) for pending events, and
 * the debounced function for responding to events every 10ms.
 * @private
 **/
TermTopicMatrixVis.prototype.__initEvents = function()
{
	this.__dragAndDropEvents = {};

	this.__pendingUpdates = {};
	this.__waitForMoreUpdates = _.debounce( this.__processPendingUpdates, this.CONSTANTS.DEBOUNCE_DURATION );
	this.listenTo( this.model, "all", this.__processModelUpdates );
};

/**
 * Respond to function calls that modify the visualization constants.
 * @private
 **/
TermTopicMatrixVis.prototype.__processConstantUpdates = function()
{
	this.__pendingUpdates[ this.REFRESH_EVENTS.CONSTANTS ] = true;
	this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_LAYOUT ] = true;
	this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_SIZES ] = true;
	this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_LAYOUT ] = true;
	this.__pendingUpdates[ this.REFRESH_EVENTS.MATRIX_SIZES ] = true;
	this.__pendingUpdates[ this.REFRESH_EVENTS.BAR_SIZES ] = true;
	this.__waitForMoreUpdates();
};

/**
 * Respond to model updates.
 * Map incoming data transformations events to visual encoding events.
 * @private
 **/
TermTopicMatrixVis.prototype.__processModelUpdates = function( e )
{
	if ( e.slice( 0, 8 ) == "updated:" )
	{
		var source = e.slice( 8 );
		if ( source == "data" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.HTML_ELEMENTS ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.CONSTANTS ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_LAYOUT ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_SIZES ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_VISIBILITY ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_LAYOUT ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.MATRIX_SIZES ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.BAR_SIZES ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_COLORS ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_TEXTS ] = true;
		}
		if ( source == "normalization" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_SIZES ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.MATRIX_SIZES ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.BAR_SIZES ] = true;
		}
		if ( source == "visibility" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_VISIBILITY ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.CALCULATE_LAYOUT ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_LAYOUT ] = true;
		}
		if ( source == "ordering" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_LAYOUT ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.BAR_SIZES ] = true;
		}
		if ( source == "selection" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_COLORS ] = true;
			this.__pendingUpdates[ this.REFRESH_EVENTS.BAR_SIZES ] = true;
		}
		if ( source == "label" )
		{
			this.__pendingUpdates[ this.REFRESH_EVENTS.ALL_TEXTS ] = true;
		}
		this.__waitForMoreUpdates();
	}
};

/**
 * Process all pending updates from model or user initiated function calls.
 * @private
 **/
TermTopicMatrixVis.prototype.__processPendingUpdates = function()
{
	var updatedStates = [];
	this.__panelActions = {};
	this.__elementActions = {};
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.HTML_ELEMENTS ) )
	{
		this.__addOrRemoveHtmlElements();
		updatedStates.push( this.REFRESH_EVENTS.HTML_ELEMENTS );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.CALCULATE_LAYOUT ) )
	{
		this.__calculateAndApplyPanelSizes();
		this.__calculateLayouts();
		updatedStates.push( this.REFRESH_EVENTS.CALCULATE_LAYOUT );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.CALCULATE_SIZES ) )
	{
		this.__calculateSizes();
		updatedStates.push( this.REFRESH_EVENTS.CALCULATE_SIZES );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.ALL_VISIBILITY ) )
	{
		this.__applyAllVisibilities();
		updatedStates.push( this.REFRESH_EVENTS.ALL_VISIBILITY );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.ALL_LAYOUT ) )
	{
		this.__applyAllLayouts();
		updatedStates.push( this.REFRESH_EVENTS.ALL_LAYOUT );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.MATRIX_SIZES ) )
	{
		this.__applyMatrixSizes();
		updatedStates.push( this.REFRESH_EVENTS.MATRIX_SIZES );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.BAR_SIZES ) )
	{
		this.__applyBarSizes();
		updatedStates.push( this.REFRESH_EVENTS.BAR_SIZES );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.ALL_COLORS ) )
	{
		this.__applyAllColors();
		updatedStates.push( this.REFRESH_EVENTS.ALL_COLORS );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.ALL_TEXTS ) )
	{
		this.__applyAllTexts();
		updatedStates.push( this.REFRESH_EVENTS.ALL_TEXTS );
	}
	if ( this.__pendingUpdates.hasOwnProperty( this.REFRESH_EVENTS.CONSTANTS ) )
	{
		this.__applyAllConstants();
		updatedStates.push( this.REFRESH_EVENTS.CONSTANTS );
	}
	
	this.__panelActions = {};
	this.__elementActions = {};
	this.__pendingUpdates = {};
	var updatedStatesValues = updatedStates.map( function(d) { return "refreshed:" + d } );
	if ( updatedStatesValues.length > 0 ) { updatedStatesValues.push( "refreshed" ) }
	var updatedStatesStr = updatedStatesValues.join( " " );
	this.trigger( updatedStatesStr );
};

/**
 * Respond to mouse events.
 * Event type is one of: enter_row, click_row, exit_row, enter_column, ...
 * Event subtype is one of: header, icon, data, ...
 * @private
 **/
TermTopicMatrixVis.prototype.__processMouseEvents = function( eventID, dataSubtype )
{
	var fullEventID = "fired:" + eventID;
	var eventAndDataType = eventID.split( ":" );
	var eventType = eventAndDataType[0];
	var dataType = eventAndDataType[1];
	var handler = function( data, index ) {
		this.trigger( fullEventID, { 'eventType' : eventType, 'dataType' : dataType, 'dataSubtype' : dataSubtype, 'data' : data } );
	}.bind( this );
	return handler;
};

TermTopicMatrixVis.prototype.__dragStartHandler = function( data, index )
{
	d3.event.dataTransfer.effectAllowed = "move";
	var dragIcon = document.createElement("div");
	d3.event.dataTransfer.setDragImage( dragIcon, 0, 0 );

	this.__dragAndDropEvents.sourceData = data;
	this.__dragAndDropEvents.sourceType = data.dataType;
	
	d3.select( d3.event.srcElement )
		.style( "background", this.__const.HIGHLIGHT_BACKGROUND );
};
TermTopicMatrixVis.prototype.__dragEndHandler = function( data, index )
{
	this.__dragAndDropEvents = {};

	d3.select( d3.event.srcElement )
		.style( "background", null );
};
TermTopicMatrixVis.prototype.__dragOverHandler = function( data, index )
{
	if ( this.__dragAndDropEvents.sourceType == data.dataType )
	{
		if ( d3.event.preventDefault ) { d3.event.preventDefault() }
		d3.event.dataTransfer.dropEffect = "move";

		var isDropBefore = ( d3.event.offsetY <= this.__const.SPACING_PX / 2 );
		this.__dragAndDropEvents.targetData = data;
		this.__dragAndDropEvents.targetType = data.dataType;
		this.__dragAndDropEvents.isDropBefore = isDropBefore;
		
		if ( isDropBefore )
			d3.select( d3.event.target )
				.style( "border-top-width", "1px" )
				.style( "border-top-style", "solid" )
				.style( "border-top-color", this.__const.HIGHLIGHT_COLOR )
				.style( "border-bottom", null );
		else
			d3.select( d3.event.target )
				.style( "border-top", null )
				.style( "border-bottom-width", "1px" )
				.style( "border-bottom-style", "solid" )
				.style( "border-bottom-color", this.__const.HIGHLIGHT_COLOR );
		
	}
};
TermTopicMatrixVis.prototype.__dragEnterHandler = function( data, index )
{
};
TermTopicMatrixVis.prototype.__dragLeaveHandler = function( data, index )
{
	if ( this.__dragAndDropEvents.sourceType == data.dataType )
	{
		d3.select( d3.event.target )
			.style( "border-top", null )
			.style( "border-bottom", null );
	}
};
TermTopicMatrixVis.prototype.__dropHandler = function( data, index )
{
	if ( this.__dragAndDropEvents.sourceType == this.__dragAndDropEvents.targetType )
	{
		var eventType = "dragdrop";
		var dataType = this.__dragAndDropEvents.sourceType;
		var dataSubtype = "header";
		var fullEventID = "fired:" + eventType + ":" + dataType;
		this.trigger( fullEventID, {
			'eventType' : eventType, 
			'dataType' : dataType, 
			'dataSubtype' : dataSubtype,
			'data' : this.__dragAndDropEvents.sourceData,
			'sourceData' : this.__dragAndDropEvents.sourceData,
			'targetData' : this.__dragAndDropEvents.targetData,
			'isDropBefore' : this.__dragAndDropEvents.isDropBefore
		});

		d3.select( d3.event.target )
			.style( "border-top", null )
			.style( "border-bottom", null );
	}
};

/**
 * Enable all mouse interactions.
 **/
TermTopicMatrixVis.prototype.enableMouseUIs = function()
{
	this.enableMouseOverAndClicks();
	this.enableDragAndDrop();
	return this;
};

/**
 * Disable all mouse interactions.
 **/
TermTopicMatrixVis.prototype.disableMouseUIs = function()
{
	this.disableMouseOverAndClicks();
	this.disableDragAndDrop();
	return this;
};

/**
 * Enable mouse over and click events on columns, rows, and cells.
 **/
TermTopicMatrixVis.prototype.enableMouseOverAndClicks = function()
{
	// Select/highlight rows.
	this.on( "fired:enter:row"   , function(e) { this.highlightRow( e.data.index )                          }.bind(this.model) );
	this.on( "fired:exit:row"    , function(e) { this.unhighlightAllRows()                                  }.bind(this.model) );
	this.on( "fired:click:row"   , function(e) { this.toggleRow( e.data.index ); model.unhighlightAllRows() }.bind(this.model) );
	
	// Select/highlight columns.
	this.on( "fired:enter:column", function(e) { this.highlightColumn( e.data.index )                             }.bind(this.model) );
	this.on( "fired:exit:column" , function(e) { this.unhighlightAllColumns()                                     }.bind(this.model) );
	this.on( "fired:click:column", function(e) { this.toggleColumn( e.data.index ); model.unhighlightAllColumns() }.bind(this.model) );

	// Mouse events over cells are to select/highlight columns.
	this.on( "fired:enter:cell"  , function(e) { this.highlightColumn( e.data.columnIndex )                             }.bind(this.model) );
	this.on( "fired:exit:cell"   , function(e) { this.unhighlightAllColumns()                                           }.bind(this.model) );
	this.on( "fired:click:cell"  , function(e) { this.toggleColumn( e.data.columnIndex ); model.unhighlightAllColumns() }.bind(this.model) );

	return this;
};

/**
 * Disable mouse over and click events on columns, rows, and cells.
 **/
TermTopicMatrixVis.prototype.disableMouseOverAndClicks = function()
{
	// Select/highlight rows.
	this.off( "fired:enter:row" );
	this.off( "fired:exit:row"  );
	this.off( "fired:click:row" );
	
	// Select/highlight columns.
	this.off( "fired:enter:column" );
	this.off( "fired:exit:column"  );
	this.off( "fired:click:column" );

	// Mouse events over cells are to select/highlight columns.
	this.off( "fired:enter:cell" );
	this.off( "fired:exit:cell"  );
	this.off( "fired:click:cell" );

	return this;
};

/**
 * Enable drag-and-drop events on column/row headers.
 **/
TermTopicMatrixVis.prototype.enableDragAndDrop = function()
{
	this.on( "fired:dragdrop:row", function(e) {
		if ( e.isDropBefore )
			this.moveRowBefore( e.sourceData.index, e.targetData.index );
		else
			this.moveRowAfter( e.sourceData.index, e.targetData.index );
		this.unhighlightAllRows();
	}.bind(this.model) );
	this.on( "fired:dragdrop:column", function(e) {
		if ( e.isDropBefore )
			this.moveColumnBefore( e.sourceData.index, e.targetData.index );
		else
			this.moveColumnAfter( e.sourceData.index, e.targetData.index );
		this.unhighlightAllColumns();
	}.bind(this.model) );

	return this;
};

/**
 * Disable drag-and-drop events on column/row headers.
 **/
TermTopicMatrixVis.prototype.disableDragAndDrop = function()
{
	this.off( "fired:dragdrop:row" );
	this.off( "fired:dragdrop:column" );

	return this;
};

//------------------------------------------------------------------------------

TermTopicMatrixVis.prototype.__initHtmlElements = function()
{
	// Initialize the HTML container element
	this.__container = d3.select( this.el )
		.style( "display", "inline-block" )
		.style( "cursor", "default" )
		.style( "background", "#fff" )
		.style( "border", "1px solid #ccc" );
	var innerContainer = this.__container.append( "div" )
		.attr( "class", "TermTopicMatrixCanvas" )
		.style( "position", "absolute" );
	
	// Create an SVG element and an HTML element for holding all visuslization components
	this.__svg = innerContainer.append( "svg:svg" )
		.attr( "class", "visualizationInSVG" )
		.style( "position", "absolute" )
		.style( "left", 0 )
		.style( "top", 0 )
		.attr( "width", 0 )
		.attr( "height", 0 );
	this.__html = innerContainer.append( "div" )
		.attr( "class", "visualizationInHTML" )
		.style( "position", "absolute" )
		.style( "left", 0 )
		.style( "top", 0 )
		.style( "width", 0 )
		.style( "height", 0 )
		.style( "pointer-events", "none" );
	
	// Divide the Visualization into panels by types (SVG vs. HTML)
	this.__panels = {};       // Each panel is an svg g element or an html div element
	this.__panelDims = {};    // Dimensions (isDiv, width, height, x, y) for each corresponding g or div element

	this.__panels.leftPanel = this.__html.append( "div" ).attr( "class", "leftPanel" );
	this.__panels.topPanel = this.__html.append( "div" ).attr( "class", "topPanel" );
	this.__panels.rightPanel = this.__html.append( "div" ).attr( "class", "rightPanel" );
	this.__panels.bottomPanel = this.__svg.append( "svg:g" ).attr( "class", "bottomPanel" );
	this.__panels.farPanel = this.__svg.append( "svg:g" ).attr( "class", "farPanel" );
	this.__panels.centerPanel = this.__svg.append( "svg:g" ).attr( "class", "centerPanel" );
	this.__resizePanelsImmediately();
		
	// Layers within the panels for group management
	this.__layers = {};

	this.__layers.chartGridlinesX = this.__panels.centerPanel.append( "svg:g" ).attr( "class", "chartGridlinesX" );
	this.__layers.chartGridlinesY = this.__panels.centerPanel.append( "svg:g" ).attr( "class", "chartGridlinesY" );
	this.__layers.chartCircles = this.__panels.centerPanel.append( "svg:g" ).attr( "class", "chartCircles" );
	
	this.__layers.rowTexts1 = this.__panels.leftPanel.append( "div" ).attr( "class", "rowTexts1" );
	
	this.__layers.columnTexts = this.__panels.topPanel.append( "div" ).attr( "class", "columnTexts" );

	this.__layers.rowTexts2 = this.__panels.rightPanel.append( "div" ).attr( "class", "rowTexts2" );

	this.__layers.columnTotals = this.__panels.bottomPanel.append( "svg:g" ).attr( "class", "columnTotals" );
	this.__layers.columnSelections = this.__panels.bottomPanel.append( "svg:g" ).attr( "class", "columnSelections" );

	this.__layers.rowTotals = this.__panels.farPanel.append( "svg:g" ).attr( "class", "rowTotals" );
	this.__layers.rowSelections = this.__panels.farPanel.append( "svg:g" ).attr( "class", "rowSelections" );

	// For elements within each layers; populated when data is supplied.
	this.__elements = {};         // Element groups
	this.__elementActions = {};   // D3 transition wrapper for element groups
	
	// Transformations: x, y, radius, and bar length encoding
	this.__scales = {};
	
	// Attach to the HTML document
	$( this.containerID ).append( this.el );
};

TermTopicMatrixVis.prototype.__resizePanelsImmediately = function()
{
	for ( var panelID in this.__panels )
	{
		var panel = this.__panels[ panelID ];
		var isHTML = ( panel[0][0].nodeName == "DIV" );
		var actions = panel;
		var dims = this.__panelDims[ panelID ] || { 'x' : 0, 'y' : 0, 'width' : 0, 'height' : 0 };
		if ( isHTML )
			actions
				.style( "left", dims.x + "px" )
				.style( "top", dims.y + "px" )
				.style( "width", dims.width + "px" )
				.style( "height", dims.height + "px" );
		else
			actions
				.attr( "transform", "translate(" +dims.x+ "," +dims.y+ ")" )
				.attr( "width", dims.width )
				.attr( "height", dims.height );
	}
};

TermTopicMatrixVis.prototype.__resizePanelsAnimated = function()
{
	for ( var panelID in this.__panels )
	{
		var panel = this.__panels[ panelID ];
		var isHTML = ( panel[0][0].nodeName == "DIV" );
		var actions = ( this.__const.ANIMATION_ENABLED ) ?
			panel.transition().duration( this.__const.ANIMATION_DURATION_MSEC ).ease( this.__const.ANIMATION_EASE ) :
			panel;
		var dims = this.__panelDims[ panelID ] || { 'x' : 0, 'y' : 0, 'width' : 0, 'height' : 0 };
		if ( isHTML )
			actions
				.style( "left", dims.x + "px" )
				.style( "top", dims.y + "px" )
				.style( "width", dims.width + "px" )
				.style( "height", dims.height + "px" );
		else
			actions
				.attr( "transform", "translate(" +dims.x+ "," +dims.y+ ")" )
				.attr( "width", dims.width )
				.attr( "height", dims.height );
	}
};

TermTopicMatrixVis.prototype.__applyImmediately = function( elementID )
{
	if ( ! this.__elementActions.hasOwnProperty( elementID ) )
		this.__elementActions[ elementID ] = this.__elements[ elementID ];
	var actions = this.__elementActions[ elementID ];
	return actions;
};

TermTopicMatrixVis.prototype.__applyAnimated = function( elementID )
{
	if ( ! this.__elementActions.hasOwnProperty( elementID ) )
		this.__elementActions[ elementID ] = ( this.__const.ANIMATION_ENABLED ) ?
			this.__elements[ elementID ].transition().duration( this.__const.ANIMATION_DURATION_MSEC ).ease( this.__const.ANIMATION_EASE ) :
			this.__elements[ elementID ];
	var actions = this.__elementActions[ elementID ];
	return actions;
};

//------------------------------------------------------------------------------

TermTopicMatrixVis.prototype.__topLabelAngle = function()
{
	return this.__const.TOP_LABEL_ANGLE_DEG;
};

TermTopicMatrixVis.prototype.__topLabelWidth = function()
{
	return this.__const.TOP_PANEL_HEIGHT;
};

TermTopicMatrixVis.prototype.__topLabelHeight = function()
{
	return this.__const.SPACING_PX;
};

TermTopicMatrixVis.prototype.__topLabelOffsetX = function()
{
	var theta = this.__const.TOP_LABEL_ANGLE_DEG;
	var cos = Math.cos( theta * Math.PI / 180 );
	var sin = Math.sin( theta * Math.PI / 180 );
	var halfWidth = this.__const.TOP_PANEL_HEIGHT * 0.5;
	var halfHeight = this.__const.SPACING_PX * 0.5;
	var xOffset = 0;                                // Offset along the rotated x-axis
	var yOffset = -this.__const.SPACING_PX * 0.5;   // Offset along the rotated y-axis
	var xCorrection = cos * halfWidth - sin * halfHeight + cos * xOffset - sin * yOffset;
	return -halfWidth + xCorrection;
};

TermTopicMatrixVis.prototype.__topLabelOffsetY = function()
{
	var theta = this.__const.TOP_LABEL_ANGLE_DEG;
	var cos = Math.cos( theta * Math.PI / 180 );
	var sin = Math.sin( theta * Math.PI / 180 );
	var halfWidth = this.__const.TOP_PANEL_HEIGHT * 0.5;
	var halfHeight = this.__const.SPACING_PX * 0.5;
	var xOffset = 0;                                // Offset along the rotated x-axis
	var yOffset = -this.__const.SPACING_PX * 0.5;   // Offset along the rotated y-axis
	var yCorrection = sin * halfWidth + cos * halfHeight + sin * xOffset + cos * yOffset;
	return -halfHeight + yCorrection;
};

TermTopicMatrixVis.prototype.__addOrRemoveHtmlElements = function()
{
	var self = this;
	var sparseMatrix = this.model.get( "sparseMatrix" );
	var rowElements = this.model.get( "rowElements" );
	var columnElements = this.model.get( "columnElements" );
	
	this.__elements.chartGridlinesX = this.__layers.chartGridlinesX
		.selectAll( "line" ).data( rowElements ).enter().append( "svg:line" );
	this.__elements.chartGridlinesY = this.__layers.chartGridlinesY
		.selectAll( "line" ).data( columnElements ).enter().append( "svg:line" );
	this.__elements.chartCircles = this.__layers.chartCircles
		.selectAll( "circle" ).data( sparseMatrix ).enter().append( "svg:circle" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_CELL, "data" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_CELL, "data" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_CELL, "data" ) );
		
	this.__elements.rowTexts1 = this.__layers.rowTexts1
		.selectAll( "div" ).data( rowElements ).enter().append( "div" )
		.attr( "class", "label" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_ROW, "header" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_ROW, "header" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_ROW, "header" ) )
		.attr( "draggable", true )
		.on( "dragstart", this.__dragStartHandler.bind(this) )
		.on( "dragend", this.__dragEndHandler.bind(this) )
		.on( "dragover", this.__dragOverHandler.bind(this) )
		.on( "dragenter", this.__dragEnterHandler.bind(this) )
		.on( "dragleave", this.__dragLeaveHandler.bind(this) )
		.on( "drop", this.__dropHandler.bind(this) );
	
	this.__elements.columnTexts = this.__layers.columnTexts
		.selectAll( "div" ).data( columnElements ).enter().append( "div" )
		.attr( "class", "label" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_COLUMN, "header" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_COLUMN, "header" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_COLUMN, "header" ) )
		.attr( "draggable", true )
		.on( "dragstart", this.__dragStartHandler.bind(this) )
		.on( "dragend", this.__dragEndHandler.bind(this) )
		.on( "dragover", this.__dragOverHandler.bind(this) )
		.on( "dragenter", this.__dragEnterHandler.bind(this) )
		.on( "dragleave", this.__dragLeaveHandler.bind(this) )
		.on( "drop", this.__dropHandler.bind(this) );

	this.__elements.columnTotals = this.__layers.columnTotals
		.selectAll( "line" ).data( columnElements ).enter().append( "svg:line" );
	this.__elements.columnSelections = this.__layers.columnSelections
		.selectAll( "g" ).data( columnElements ).enter().append( "svg:g" );
	this.__elements.columnSelectionBars = this.__elements.columnSelections
		.selectAll( "line" ).data( function(d) { return d.selectElements } ).enter().append( "svg:line" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_ROW, "data" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_ROW, "data" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_ROW, "data" ) );
		
	this.__elements.rowTexts2 = this.__layers.rowTexts2
		.selectAll( "div" ).data( rowElements ).enter().append( "div" )
		.attr( "class", "label" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_ROW, "header" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_ROW, "header" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_ROW, "header" ) )
		.attr( "draggable", true )
		.on( "dragstart", this.__dragStartHandler.bind(this) )
		.on( "dragend", this.__dragEndHandler.bind(this) )
		.on( "dragover", this.__dragOverHandler.bind(this) )
		.on( "dragenter", this.__dragEnterHandler.bind(this) )
		.on( "dragleave", this.__dragLeaveHandler.bind(this) )
		.on( "drop", this.__dropHandler.bind(this) );

	this.__elements.rowTotals = this.__layers.rowTotals
		.selectAll( "line" ).data( rowElements ).enter().append( "svg:line" );
	this.__elements.rowSelections = this.__layers.rowSelections
		.selectAll( "g" ).data( rowElements ).enter().append( "svg:g" );
	this.__elements.rowSelectionBars = this.__elements.rowSelections
		.selectAll( "line" ).data( function(d) { return d.selectElements } ).enter().append( "svg:line" )
		.on( "mouseover", this.__processMouseEvents( this.UI_EVENTS.ENTER_COLUMN, "data" ) )
		.on( "click", this.__processMouseEvents( this.UI_EVENTS.CLICK_COLUMN, "data" ) )
		.on( "mouseout", this.__processMouseEvents( this.UI_EVENTS.EXIT_COLUMN, "data" ) );

	this.__applyImmediately( "chartGridlinesX" )
		.attr( "stroke-width", 0.6 );
	this.__applyImmediately( "chartGridlinesY" )
		.attr( "stroke-width", 0.6 );
	this.__applyImmediately( "chartCircles" )
		.attr( "stroke-width", 1 )
		.attr( "stroke-opacity", 1.0 )
		.attr( "fill-opacity", 0.4 );
		
	this.__applyImmediately( "rowTexts1" )
		.style( "font-family", "Gill Sans" )
		.style( "text-align", "right" );

	this.__applyImmediately( "columnTexts" )
		.style( "font-family", "Gill Sans" )
		.style( "text-align", "left" );
	
	this.__applyImmediately( "columnTotals" )
		.attr( "x1", 0 )
		.attr( "x2", 0 );
	this.__applyImmediately( "columnSelections" );
	this.__applyImmediately( "columnSelectionBars" )	
		.attr( "stroke-opacity", 0.6 )
		.attr( "x1", 0 )
		.attr( "x2", 0 );

	this.__applyImmediately( "rowTexts2" )
		.style( "font-family", "Gill Sans" )
		.style( "text-align", "right" );

	this.__applyImmediately( "rowTotals" )
		.attr( "y1", 0 )
		.attr( "y2", 0 )
	this.__applyImmediately( "rowSelections" );
	this.__applyImmediately( "rowSelectionBars" )
		.attr( "stroke-opacity", 0.6 )
		.attr( "y1", 0 )
		.attr( "y2", 0 );
};

TermTopicMatrixVis.prototype.__calculateAndApplyPanelSizes = function()
{
	var rowDims = this.model.get( "visibleRowDims" );
	var columnDims = this.model.get( "visibleColumnDims" );

	var chartWidth = this.__const.SPACING_PX * columnDims;
	var chartHeight = this.__const.SPACING_PX * rowDims;
	this.__const.chartWidth = chartWidth;
	this.__const.chartHeight = chartHeight;
	
	var visualizationWidth = 
		this.__const.OUTER_PADDING + 
		this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING + 
		chartWidth + this.__const.RIGHT_PADDING + 
		this.__const.RIGHT_PANEL_WIDTH + this.__const.FAR_PADDING + 
		this.__const.FAR_PANEL_WIDTH + this.__const.OUTER_PADDING;
	var visualizationHeight = 
		this.__const.OUTER_PADDING + 
		this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING + 
		chartHeight + this.__const.BOTTOM_PADDING + 
		this.__const.BOTTOM_PANEL_HEIGHT + this.__const.OUTER_PADDING;
	
	this.__container
		.transition().duration( this.__const.ANIMATION_DURATION_MSEC ).ease( this.__const.ANIMATION_EASE )
		.style( "width", visualizationWidth + "px" )
		.style( "height", visualizationHeight + "px" );
	this.__svg
		.transition().duration( this.__const.ANIMATION_DURATION_MSEC ).ease( this.__const.ANIMATION_EASE )
		.attr( "width", visualizationWidth )
		.attr( "height", visualizationHeight );
	this.__html
		.transition().duration( this.__const.ANIMATION_DURATION_MSEC ).ease( this.__const.ANIMATION_EASE )
		.style( "width", visualizationWidth + "px" )
		.style( "height", visualizationHeight + "px" );
	
	this.__panelDims.centerPanel = {
		'width' : chartWidth,
		'height' : chartHeight,
		'x' : this.__const.OUTER_PADDING + this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING,
		'y' : this.__const.OUTER_PADDING + this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING
	};
	this.__panelDims.leftPanel = {
		'width' : this.__const.LEFT_PANEL_WIDTH,
		'height' : chartHeight,
		'x' : this.__const.OUTER_PADDING,
		'y' : this.__const.OUTER_PADDING + this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING
	};
	this.__panelDims.topPanel = {
		'width' : chartWidth,
		'height' : this.__const.TOP_PANEL_HEIGHT,
		'x' : this.__const.OUTER_PADDING + this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING,
		'y' : this.__const.OUTER_PADDING
	};	
	this.__panelDims.rightPanel = {
		'width' : this.__const.RIGHT_PANEL_WIDTH,
		'height' : chartHeight,
		'x' : this.__const.OUTER_PADDING + this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING + chartWidth + this.__const.RIGHT_PADDING,
		'y' : this.__const.OUTER_PADDING + this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING
	};	
	this.__panelDims.bottomPanel = {
		'width' : chartWidth,
		'height' : this.__const.BOTTOM_PANEL_HEIGHT,
		'x' : this.__const.OUTER_PADDING + this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING,
		'y' : this.__const.OUTER_PADDING + this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING + chartHeight + this.__const.BOTTOM_PADDING
	};
	this.__panelDims.farPanel = {
		'width' : this.__const.FAR_PANEL_WIDTH,
		'height' : chartHeight,
		'x' : this.__const.OUTER_PADDING + this.__const.LEFT_PANEL_WIDTH + this.__const.LEFT_PADDING + chartWidth + this.__const.RIGHT_PADDING + this.__const.RIGHT_PANEL_WIDTH + this.__const.FAR_PADDING,
		'y' : this.__const.OUTER_PADDING + this.__const.TOP_PANEL_HEIGHT + this.__const.TOP_PADDING
	};
	this.__resizePanelsAnimated();
};

TermTopicMatrixVis.prototype.__applyAllConstants = function()
{
	var self = this;

	this.__applyImmediately( "rowTexts1" )
		.style( "width", self.__const.LEFT_PANEL_WIDTH + "px" )
		.style( "height", self.__const.SPACING_PX + "px" )
		.style( "line-height", self.__const.SPACING_PX + "px" )
		.style( "font-size", self.__const.FONT_SIZE_PT + "pt" );
	
	this.__applyImmediately( "columnTexts" )
		.style( "width", self.__topLabelWidth() + "px" )
		.style( "height", self.__topLabelHeight() + "px" )
		.style( "line-height", self.__const.SPACING_PX + "px" )
		.style( "font-size", self.__const.FONT_SIZE_PT + "pt" )
		.style( "-webkit-transform", "rotate(" +self.__topLabelAngle()+ "deg)" )
		.style( "-moz-transform", "rotate(" +self.__topLabelAngle()+ "deg)" )
		.style( "-o-transform", "rotate(" +self.__topLabelAngle()+ "deg)" );
		
	this.__applyImmediately( "rowTexts2" )
		.style( "width", self.__const.RIGHT_PANEL_WIDTH + "px" )
		.style( "height", self.__const.SPACING_PX + "px" )
		.style( "line-height", self.__const.SPACING_PX + "px" )
		.style( "font-size", self.__const.FONT_SIZE_PT + "pt" );
};

TermTopicMatrixVis.prototype.__calculateLayouts = function()
{
	var rowDims = this.model.get( "visibleRowDims" );
	var columnDims = this.model.get( "visibleColumnDims" );
	var chartWidth = this.__const.chartWidth;
	var chartHeight = this.__const.chartHeight;
	this.__scales.xSpatial = d3.scale.linear().domain( [ 0, columnDims ] ).range( [ 0, chartWidth ] );
	this.__scales.ySpatial = d3.scale.linear().domain( [ 0, rowDims ] ).range( [ 0, chartHeight ] );
};

TermTopicMatrixVis.prototype.__calculateSizes = function()
{
	var maxValue = this.model.get( "maxValue" );
	var maxRowValue = this.model.get( "maxRowValue" );
	var maxColumnValue = this.model.get( "maxColumnValue" );
	this.__scales.rSize = d3.scale.sqrt().domain( [ 0, maxValue ] ).range( [ 0, this.__const.MAX_RADIUS_PX ] );
	this.__scales.xLength = d3.scale.linear().domain( [ 0, maxRowValue ] ).range( [ 0, this.__const.MAX_ROW_BAR_LENGTH_PX ] );
	this.__scales.yLength = d3.scale.linear().domain( [ 0, maxColumnValue ] ).range( [ 0, this.__const.MAX_COLUMN_BAR_LENGTH_PX ] );
};

TermTopicMatrixVis.prototype.__applyAllVisibilities = function()
{
	var self = this;
	var rowDims = this.model.get( "visibleRowDims" );
	var columnDims = this.model.get( "visibleColumnDims" );
	
	this.__applyAnimated( "chartGridlinesX" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } )
		.attr( "x1", self.__scales.xSpatial(0.5) )
		.attr( "x2", self.__scales.xSpatial(columnDims-0.5) );
	this.__applyAnimated( "chartGridlinesY" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } )
		.attr( "y1", self.__scales.ySpatial(0.5) )
		.attr( "y2", self.__scales.ySpatial(rowDims-0.5) );
	this.__applyAnimated( "chartCircles" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } );

	this.__applyAnimated( "rowTexts1" )
		.style( "pointer-events", function(d) { return d.isVisible ? "auto" : "none" } )
		.style( "opacity", function(d) { return d.isVisible ? 1 : 0 } );

	this.__applyAnimated( "columnTexts" )
		.style( "pointer-events", function(d) { return d.isVisible ? "auto" : "none" } )
		.style( "opacity", function(d) { return d.isVisible ? 1 : 0 } );

	this.__applyAnimated( "columnTotals" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } );
	this.__applyAnimated( "columnSelections" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } );

	this.__applyAnimated( "rowTexts2" )
		.style( "pointer-events", function(d) { return d.isVisible ? "auto" : "none" } )
		.style( "opacity", function(d) { return d.isVisible ? 1 : 0 } );

	this.__applyAnimated( "rowTotals" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } );
	this.__applyAnimated( "rowSelections" )
		.attr( "pointer-events", function(d) { return d.isVisible ? "visiblePainted" : "none" } )
		.attr( "opacity", function(d) { return d.isVisible ? 1 : 0 } );
};

TermTopicMatrixVis.prototype.__applyAllLayouts = function()
{
	var self = this;

	this.__applyAnimated( "chartGridlinesX" )
		.attr( "y1", function(d) { return self.__scales.ySpatial(d.position+0.5) } )
		.attr( "y2", function(d) { return self.__scales.ySpatial(d.position+0.5) } );
	this.__applyAnimated( "chartGridlinesY" )
		.attr( "x1", function(d) { return self.__scales.xSpatial(d.position+0.5) } )
		.attr( "x2", function(d) { return self.__scales.xSpatial(d.position+0.5) } );
	this.__applyAnimated( "chartCircles" )
		.attr( "cx", function(d) { return self.__scales.xSpatial(d.columnPosition+0.5) } )
		.attr( "cy", function(d) { return self.__scales.ySpatial(d.rowPosition+0.5) } );

	this.__applyAnimated( "rowTexts1" )
		.style( "left", "0px" )
		.style( "top", function(d) { return ( self.__scales.ySpatial(d.position+0.5) - self.__const.SPACING_PX * 0.5 ) + "px" } );

	this.__applyAnimated( "columnTexts" )
		.style( "left", function(d) { return ( self.__scales.xSpatial(d.position+0.5) + self.__topLabelOffsetX() ) + "px" } )
		.style( "top", ( self.__const.TOP_PANEL_HEIGHT + self.__topLabelOffsetY() ) + "px" );

	this.__applyAnimated( "columnTotals" )
		.attr( "transform", function(d) { return "translate(" +self.__scales.xSpatial(d.position+0.5)+ ",0)" } )
		.attr( "stroke-width", this.__const.BAR_WIDTH_PX );
	this.__applyAnimated( "columnSelections" )
		.attr( "transform", function(d) { return "translate(" +self.__scales.xSpatial(d.position+0.5)+ ",0)" } )
		.attr( "stroke-width", this.__const.BAR_WIDTH_PX );

	this.__applyAnimated( "rowTexts2" )
		.style( "left", "0px" )
		.style( "top", function(d) { return ( self.__scales.ySpatial(d.position+0.5) - self.__const.SPACING_PX * 0.5 ) + "px" } );

	this.__applyAnimated( "rowTotals" )
		.attr( "transform", function(d) { return "translate(0," +self.__scales.ySpatial(d.position+0.5)+ ")" } )
		.attr( "stroke-width", this.__const.BAR_WIDTH_PX );
	this.__applyAnimated( "rowSelections" )
		.attr( "transform", function(d) { return "translate(0," +self.__scales.ySpatial(d.position+0.5)+ ")" } )
		.attr( "stroke-width", this.__const.BAR_WIDTH_PX );
};

TermTopicMatrixVis.prototype.__applyMatrixSizes = function()
{
	var self = this;
	
	this.__applyAnimated( "chartCircles" )
		.attr( "r", function(d) { return self.__scales.rSize(d.value) } )
};

TermTopicMatrixVis.prototype.__applyBarSizes = function()
{
	var self = this;
	
	this.__applyAnimated( "columnTotals" )
		.attr( "y1", self.__scales.yLength(0) )
		.attr( "y2", function(d) { return self.__scales.yLength(d.value) } );
	this.__applyAnimated( "columnSelectionBars" )
		.attr( "y1", function(d) { return self.__scales.yLength(d.startValue) } )
		.attr( "y2", function(d) { return self.__scales.yLength(d.endValue) } );

	this.__applyAnimated( "rowTotals" )
		.attr( "x1", self.__scales.xLength(0) )
		.attr( "x2", function(d) { return self.__scales.xLength(d.value) } );
	this.__applyAnimated( "rowSelectionBars" )
		.attr( "x1", function(d) { return self.__scales.xLength(d.startValue) } )
		.attr( "x2", function(d) { return self.__scales.xLength(d.endValue) } );
};

TermTopicMatrixVis.prototype.__applyAllColors = function()
{
	var self = this;
	
	this.__applyAnimated( "chartGridlinesX" )
		.attr( "stroke", function(d) { return self.__background(d.selectID) } );
	this.__applyAnimated( "chartGridlinesY" )
		.attr( "stroke", function(d) { return self.__background(d.selectID) } );
	this.__applyAnimated( "chartCircles" )
		.attr( "stroke", function(d) { return self.__color(d.selectID) } )
		.attr( "fill", function(d) { return self.__color(d.selectID) } );

	this.__applyAnimated( "rowTexts1" )
		.style( "color", function(d) { return self.__color(d.selectID) } )
		.style( "font-weight", function(d) { return d.isSelected ? "bold" : null } );

	this.__applyAnimated( "columnTexts" )
		.style( "color", function(d) { return self.__color(d.selectID) } )
		.style( "font-weight", function(d) { return d.isSelected ? "bold" : null } );

	this.__applyAnimated( "columnTotals" )
		.attr( "stroke", function(d) { return self.__background(d.isCrossSelected ? -1 : d.selectID) } );
	this.__applyAnimated( "columnSelectionBars" )
		.attr( "stroke", function(d) { return self.__color(d.selectID) } )
		.attr( "opacity", function(d) { return d.isSelected ? 1 : 0 } );

	this.__applyAnimated( "rowTexts2" )
		.style( "color", function(d) { return self.__color(d.selectID) } )
		.style( "font-weight", function(d) { return d.isSelected ? "bold" : null } );

	this.__applyAnimated( "rowTotals" )
		.attr( "stroke", function(d) { return self.__background(d.isCrossSelected ? -1 : d.selectID) } );
	this.__applyAnimated( "rowSelectionBars" )
		.attr( "stroke", function(d) { return self.__color(d.selectID) } )
		.attr( "opacity", function(d) { return d.isSelected ? 1 : 0 } );
};

TermTopicMatrixVis.prototype.__color = function( selectID )
{
	if ( selectID >= 0 )
		if ( selectID == 0 )
			return this.__const.HIGHLIGHT_COLOR;
		else
			return this.__const.SELECTION_COLORS[ ( selectID - 1 ) % this.__const.SELECTION_COLORS.length ];
	else
		return this.__const.DEFAULT_COLOR;
};

TermTopicMatrixVis.prototype.__background = function( selectID )
{
	if ( selectID >= 0 )
		if ( selectID == 0 )
			return this.__const.HIGHLIGHT_BACKGROUND;
		else
			return this.__const.SELECTION_BACKGROUNDS[ ( selectID - 1 ) % this.__const.SELECTION_BACKGROUNDS.length ];
	else
		return this.__const.DEFAULT_BACKGROUND;
};

TermTopicMatrixVis.prototype.__applyAllTexts = function()
{
	var self = this;
	
	this.__applyAnimated( "rowTexts1" )
		.text( function(d) { return d.label } );
		
	this.__applyAnimated( "columnTexts" )
		.text( function(d) { return d.label } );

	this.__applyAnimated( "rowTexts2" )
		.text( function(d) { return d.label } );
};

//--------------------------------------------------------------------------------------------------

if ( typeof module != "undefined" )
{
	module.exports = TermTopicMatrixVis;
}
