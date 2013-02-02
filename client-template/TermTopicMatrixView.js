/*
	TermTopicMatrixView.js
	
	This view is responsible for generating the term:topic similarity matrix.
	
	Details:
	--------
	Receives list of ordered terms, topics, and similarity values from 
	FilteredTermTopicProbabilityModel. 
	
	Additionally, uses parameters defined in ViewParameters.js.
*/
function TermTopicMatrixView(){	

	var container_height = "1000px";
	var container_width = "";
	var CONTAINER_PADDING = {
		left_separation: 8,
		top_separation: 5,
		left: 110,
		right: 20,
		top: 60,
		bottom: 60,
		fullWidth : function( numTopics ) { return this.left + this.right + ENCODING_PARAMETERS.packing() * numTopics },
		fullHeight : function( numTopics, numTerms ) { return this.top + this.bottom + ENCODING_PARAMETERS.packing() * numTerms }
	};

	var xs = null;
	var ys = null;
	var rs = null;
	var submatrix = null;
	var termIndex = null;
	var topicIndex = null;

	function initViews( parameters ){
		submatrix = parameters.SparseMatrix;
		termIndex = parameters.TermIndexFiltered;
		topicIndex = parameters.TopicIndexFiltered;
		
		xs = d3.scale.linear().domain( [ 0, topicIndex.length ] ).range( [ CONTAINER_PADDING.left, CONTAINER_PADDING.left + topicIndex.length * ENCODING_PARAMETERS.packing() ] );
		ys = d3.scale.linear().domain( [ 0, termIndex.length ] ).range( [ CONTAINER_PADDING.top, CONTAINER_PADDING.top + termIndex.length * ENCODING_PARAMETERS.packing() ] );
		rs = d3.scale.sqrt().domain( [ 0, 1 ] ).range( [ 0, ENCODING_PARAMETERS.radius( submatrix, topicIndex.length, termIndex.length ) ] );
		
		var container = d3.select( "#termTopicMatrixContainer" );
		var svg = container.append( "svg:svg" )
			.style( "cursor", "default" )
			.style( "width", CONTAINER_PADDING.fullWidth( topicIndex.length ) + "px" )
			.style( "height", CONTAINER_PADDING.fullHeight( topicIndex.length, termIndex.length ) + "px" )
		
		initMatrixView();
		initLeftLabelView();
		initTopLabelView();
	}
	function initMatrixView(){
		var svg = d3.select( "#termTopicMatrixContainer" ).select("svg");
			
		var xGridlineLayer = svg.append( "svg:g" ).attr( "class", "xGridlineLayer" );
		var yGridlineLayer = svg.append( "svg:g" ).attr( "class", "yGridlineLayer" );
		var matrixLayer = svg.append( "svg:g" ).attr( "class", "matrixLayer" );

		matrixLayer.selectAll( "circle" ).data( submatrix ).enter().append( "svg:circle" )
			.attr( "class", function(d) { return [ "matrixElement", getTopicClassTag(d.topicName), getTermClassTag(d.term) ].join(" ") })
			.on( "mouseover", function(d) { selectCircleEvent(d.topicName, d.term)} )
			.on( "mouseout", function(d) { deselectCircleEvent(d.topicName, d.term)} )
			.attr( "cx", function(d) { return xs(d.topicIndex+0.5) } )
			.attr( "cy", function(d) { return ys(d.termIndex+0.5) } )
			.attr( "r", function(d) { return rs(d.value) } )
			.attr( "stroke", CIRCLE_DEFAULT.COLOR )
			.attr( "stroke-opacity", CIRCLE_DEFAULT.STROKE_OPACITY )
			.attr( "fill", CIRCLE_DEFAULT.FILL_COLOR )
			.attr( "fill-opacity", CIRCLE_DEFAULT.FILL_OPACITY )

		xGridlineLayer.selectAll( "line" ).data( termIndex ).enter().append( "svg:line" )
			.attr( "class", function(d) { return [ "verticalLine", getTermClassTag(d) ].join(" ") })
			.attr( "x1", xs(0.5) )
			.attr( "x2", xs(topicIndex.length-0.5) )
			.attr( "y1", function(d,i) { return ys(i+0.5) } )
			.attr( "y2", function(d,i) { return ys(i+0.5) } )
			.attr( "stroke", GRIDLINE_DEFAULT.COLOR )
			.attr( "stroke-width", GRIDLINE_DEFAULT.STROKE_WIDTH )
			.attr( "stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY )

		yGridlineLayer.selectAll( "line" ).data( topicIndex ).enter().append( "svg:line" )
			.attr( "class", function(d) { return [ "verticalLine", getTopicClassTag(d)].join(" ") }) 
			.attr( "x1", function(d,i){ return xs(i+0.5) } )
			.attr( "x2", function(d,i){ return xs(i+0.5) } )
			.attr( "y1", ys(0.5) )
			.attr( "y2", ys(termIndex.length-0.5) )
			.attr( "stroke", GRIDLINE_DEFAULT.COLOR )
			.attr( "stroke-width",  GRIDLINE_DEFAULT.STROKE_WIDTH )
			.attr( "stroke-opacity", GRIDLINE_DEFAULT.STROKE_OPACITY )
	}
	function initLeftLabelView(){
		var svg = d3.select( "#termTopicMatrixContainer" ).select("svg");
		var leftLabelLayer = svg.append( "svg:g" ).attr( "class", "leftLabelLayer" );
		leftLabelLayer.selectAll( "g" ).data( termIndex ).enter().append( "svg:g" )
			.attr( "class", function(d) { return ["leftLabel", getTermClassTag(d)].join(" ") })
			.on( "mouseover", function(d) { selectTermEvent(d)} )
			.on( "mouseout", function(d) { deselectTermEvent(d)} )
			.attr( "transform", function(d,i) { return "translate(" + (xs(0)-CONTAINER_PADDING.left_separation) + "," + ys(i+0.5) + ")" } )
			.append( "svg:text" )
				.attr( "y", 3 )
				.attr( "text-anchor", "end" )
				.attr( "font-family", "Verdana" )
				.attr( "font-size", "10px" )
				.attr( "fill", LABEL_DEFAULT.COLOR )
				.text( function(d) { return d } )
	}
	function initTopLabelView(){
		var svg = d3.select( "#termTopicMatrixContainer" ).select("svg");
		var topLabelLayer = svg.append( "svg:g" ).attr( "class", "topLabelLayer" );
		topLabelLayer.selectAll( "g" ).data( topicIndex ).enter().append( "svg:g" )
			.attr( "class", function(d) { return ["topLabel", getTopicClassTag(d)].join(" ") })
			.on( "mouseover", function(d) { selectTopicEvent(d)} )
			.on( "mouseout", function(d) { deselectTopicEvent(d)} )
			.attr( "transform", function(d,i) { return "translate(" + xs(i+0.5) + "," + (ys(0)-CONTAINER_PADDING.top_separation) + ") rotate(270)" } )
			.append( "svg:text" )
				.attr( "y", 3 )
				.attr( "text-anchor", "start" )
				.attr( "font-family", "Verdana" )
				.attr( "font-size", "10px" )
				.attr("fill", LABEL_DEFAULT.COLOR )
				.text( function(d) { return d } )
	}
	
	function updateViews(parameters){
		var container =	d3.select( "#termTopicMatrixContainer" );
		container.selectAll("*").remove();
		initViews(parameters);
	}
	
	var results = {};
	results.init = initViews;
	results.update = updateViews;
	results.yScale = function() { return ys }
	return results;
}