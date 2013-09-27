/**
 * @class This object renders a prefix tree to the first HTML element identified as 'div.NavigationView'.
 * @author Jason Chuang <jcchuang@cs.stanford.edu>
 * @param {Object} options The 'options' object must contain an entry 'options.mode' of type 'NavigationModel'.
 **/
var NavigationView = Backbone.View.extend({
	'el' : "div.NavigationView"
});

/**
 * Backbone-specific initialization routine.
 * @private
 **/
NavigationView.prototype.initialize = function( options ) {
	this.state = this.model.state;
	this.__initHtmlElements();
	this.__initModelEvents();
};

NavigationView.prototype.NODE_PADDING = 2;
NavigationView.prototype.NODE_SPACING = 2;
NavigationView.prototype.NODE_HEIGHT = 16;
NavigationView.prototype.INACTIVE_COLOR = "#7f7f7f";
NavigationView.prototype.INACTIVE_BACKGROUND = "#c7c7c7";
NavigationView.prototype.ACTIVE_COLOR = "#d62728";
NavigationView.prototype.ACTIVE_BACKGROUND = "#ff9896";

//------------------------------------------------------------------------------

NavigationView.prototype.__initModelEvents = function() {
	this.__actions = {};
	this.listenTo( this.model, "change", this.__onModelEvents );
};

NavigationView.prototype.__onModelEvents = function() {
	this.__removeAllElements();
	this.__addAndRemoveElements();
	this.__calculateLayoutAndDimensions();
	this.__resizeLayers();
	this.__updateLayout();
	this.__updateColors();
};

NavigationView.prototype.__removeAllElements = function() {
	this.__actions = {};
	this.__layers.nodes.selectAll( "*" ).remove();
	this.__layers.curves.selectAll( "*" ).remove();
};

NavigationView.prototype.__addAndRemoveElements = function() {
	var nodes = this.model.get( "nodes" );
	
	var elements = this.__layers.nodes.selectAll( "div" ).data( nodes );
	elements.exit().remove();
	elements.enter()
		.append( "div" )
		.style( "display", "inline-block" )
		.style( "border-width", "1px" )
		.style( "border-style", "solid" )
		.style( "border-color", "#fff" )
		.style( "background", "#fff" )
		.style( "color", "#fff" )
		.style( "font-family", "Gill Sans" )
		.style( "font-size", "8pt" )
		.style( "height", this.NODE_HEIGHT + "px" )
		.style( "pointer-events", "auto" )
		.style( "cursor", "pointer" )
		.on( "click", function(d) { this.trigger( "clickEntry", d.index ) }.bind(this) )
		.each( function(d) { d.__html = d3.select(this) } )
		.append( "span" )
			.style( "position", "relative" )
			.style( "display", "inline-block" )
			.style( "padding", "2px" )
			.style( "white-space", "nowrap" )
			.text( function(d) { return d.text } );
	this.__elements.nodes = this.__layers.nodes.selectAll( "div" );

	var elements = this.__layers.curves.selectAll( "path" ).data( nodes.slice(1) );
	elements.exit().remove();
	elements.enter()
		.append( "svg:path" )
		.attr( "fill", "none" );
	this.__elements.curves = this.__layers.curves.selectAll( "path" );
};

NavigationView.prototype.__calculateLayoutAndDimensions = function() {
	var nodes = this.model.get( "nodes" );
	var root = nodes[0];
	
	//----------------------------------------
	// First pass: [nodes].__width, [nodes].__height
	for ( var n = 0; n < nodes.length; n++ ) {
		var node = nodes[n];
		node.__width = node.__html.select("span")[0][0].offsetWidth;
		node.__height = node.__html[0][0].offsetHeight;
	}
	
	//----------------------------------------
	// Second pass: [nodes].__x, layerWidth
	var computeLayerWidth = function( node, layerWidth ) {
		node.__x = layerWidth;
		layerWidth += node.__width;
		layerWidth += Math.sqrt( Math.max( 0, _.values(node.children).length - 0.25 ) ) * 12 + 8;
		var nextLayerWidth = layerWidth;
		var keys = _.keys( node.children ).sort();
		for ( var i in keys )
			nextLayerWidth = Math.max( computeLayerWidth( node.children[keys[i]], layerWidth ), nextLayerWidth );
		return nextLayerWidth;
	}.bind( this );
	var layerWidth = computeLayerWidth( root, 0 );
	
	//----------------------------------------
	// Third pass: layerHeight, [nodes].__y
	var computeLayerHeight = function( node ) {
		var layerHeight = 0.0;
		var keys = _.keys( node.children ).sort();
		for ( var i in keys )
			layerHeight += computeLayerHeight( node.children[keys[i]] );
		layerHeight = Math.max( layerHeight, node.__height + this.NODE_SPACING );
		node.__y = layerHeight;
		return layerHeight;
	}.bind( this );
	var computeLayerTop = function( node, layerTop ) {
		node.__y = ( node.__y - node.__height ) / 2 + layerTop;
		var keys = _.keys( node.children ).sort();
		for ( var i in keys ) {
			var nextTop = node.children[keys[i]].__y;
			computeLayerTop( node.children[keys[i]], layerTop )
			layerTop += nextTop;
		}
	}.bind( this );
	var layerHeight = computeLayerHeight( root );
	computeLayerTop( root, 0 );

	this.__dims.__vis = { 'width' : 12.5 + layerWidth + 12.5, 'height' : 12.5 + layerHeight + 12.5 }
	this.__dims.nodes = { 'width' : layerWidth, 'height' : layerHeight, 'x' : 12.5, 'y' : 12.5 };
	this.__dims.curves = { 'width' : layerWidth, 'height' : layerHeight, 'x' : 12.5, 'y' : 12.5 };
};

NavigationView.prototype.__updateLayout = function() {
	var getCurvePath = function( node ) {
		var aNode = node.parent;
		var bNode = node;
		var xaa = aNode.__x + aNode.__width - 1;    // Start of path
		var yaa = aNode.__y + aNode.__height / 2;
		var xbb = bNode.__x + 1;                    // End of path
		var ybb = bNode.__y + bNode.__height / 2;
		var xa = xaa + 2;                           // Straight segment at the start
		var ya = yaa;
		var xb = xbb - 2;                           // Straight segment at the end
		var yb = ybb;
		var xm1 = xa * 0.4 + xb * 0.6;              // Cubic Bezier curve
		var ym1 = ya;
		var xm2 = xa * 0.6 + xb * 0.4;
		var ym2 = yb;
		var pathStr = [
			"M " + xaa + "," + yaa,
			"L " + xa + "," + ya,
			"C " + xm1 + "," + ym1 + " " + xm2 + "," + ym2 + " " + xb + "," + yb,
			"L " + xbb + "," + ybb
		];
		return pathStr.join( " " );
	}.bind( this );
	var getAnnotationTransform = function( d ) {
		return "translate(" + (d.__x + d.__width) + "," + (d.__y) + ")";
	}.bind( this );
	
	this.__apply( "nodes" )
		.style( "left", function(d) { return (d.__x-1) + "px" }.bind( this ) )
		.style( "top", function(d) { return (d.__y-1) + "px" }.bind( this ) );
	this.__apply( "curves" ).attr( "d", getCurvePath );
};

NavigationView.prototype.__updateColors = function() {
	var getColor = function( d ) {
		if ( d.isActive )
			return this.ACTIVE_COLOR;
		else
			return this.INACTIVE_COLOR;
	}.bind( this );
	var getBorderColor = function( d ) {
		if ( d.isActive )
			return this.ACTIVE_COLOR;
		else
			return this.INACTIVE_COLOR;
	}.bind( this );
	var getBackgroundColor = function( d ) {
		if ( d.isActive )
			return this.ACTIVE_BACKGROUND;
		else
			return this.INACTIVE_BACKGROUND;
	}.bind( this );
	var getCurveColor = function( d ) {
		return this.INACTIVE_COLOR;
	}.bind( this );
	
	this.__apply( "nodes" )
		.style( "color", getColor )
		.style( "border-color", getBorderColor )
		.style( "background", getBackgroundColor );
	this.__apply( "curves" )
		.attr( "stroke", getCurveColor )
		.attr( "stroke-width", 1 );
};

//------------------------------------------------------------------------------

NavigationView.prototype.__initHtmlElements = function() {
	this.__container = d3.select( this.el ).append( "div" ).attr( "class", "container" );
	this.__canvas = this.__container.append( "div" ).attr( "class", "canvas" );
	this.__catcher = this.__canvas.append( "div" ).attr( "class", "catcherLayer" );
	this.__svg = this.__canvas.append( "svg:svg" ).attr( "class", "svgLayer" );
	this.__html = this.__canvas.append( "div" ).attr( "class", "htmlLayer" );
	this.__overlay = this.__canvas.append( "svg:svg" ).attr( "class", "overlayLayer" );

	this.__layers = {};
	this.__dims = {};
	this.__layers.nodes = this.__html.append( "div" ).attr( "class", "nodesLayer" );
	this.__layers.curves = this.__svg.append( "svg:g" ).attr( "class", "curvesLayer" );
	this.__resizeLayers( true );

	this.__scales = {};
	this.__elements = {};
};

NavigationView.prototype.__visLayers = [ "__container", "__catcher", "__svg", "__html", "__overlay" ];
NavigationView.prototype.__resizeLayers = function( immediately ) {
	for ( var layerID in this.__layers ) {
		var layer = this.__layers[ layerID ];
		var dims = this.__dims[ layerID ] || { 'x' : 0, 'y' : 0, 'width' : 0, 'height' : 0 };
		var action = ( immediately ? layer : layer.transition() );
		if ( layer[0][0].nodeName == "DIV" )
			action
				.style( "left", dims.x + "px" )
				.style( "top", dims.y + "px" )
				.style( "width", dims.width + "px" )
				.style( "height", dims.height + "px" );
		else
			action
				.attr( "transform", "translate(" +dims.x+ "," +dims.y+ ")" )
				.attr( "width", dims.width )
				.attr( "height", dims.height );
	}
	for ( var i in this.__visLayers ) {
		var layerID = this.__visLayers[i];
		var layer = this[ layerID ];
		var dims = this.__dims.__vis || { 'width' : 0, 'height' : 0 };
		var action = ( immediately ? layer : layer.transition() );
		action
			.style( "width", dims.width + "px" )
			.style( "height", dims.height + "px" );
	}
};

NavigationView.prototype.__apply = function( identifier, action ) {
	if ( ! this.__actions.hasOwnProperty( identifier ) )
		if ( action === undefined )
			this.__actions[ identifier ] = this.__elements[ identifier ].transition();
		else
			this.__actions[ identifier ] = action;
	return this.__actions[ identifier ];
};

//------------------------------------------------------------------------------
