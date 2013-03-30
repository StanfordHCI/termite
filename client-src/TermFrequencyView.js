/*
	TermFrequencyView.js
	
	This view is responsible for generating the term frequency view.
	
	Details:
	--------
	Receives list of terms and associated frequencies from TermFrequencyModel. 
	
	Additionally, uses parameters defined in ViewParameters.js.
*/

function TermFrequencyView(){
	CONTAINER_PADDING = {
		left_separation: 10,
		top: 60,
		left: 130, 
		right: 20,
		bottom: 60,
		width: 150,
		fullWidth : function() { return this.left + this.right + this.width },
		fullHeight : function( numTopics, numTerms ) { return this.top + this.bottom + ENCODING_PARAMETERS.packing() * numTerms }
	};

	var ys = null;
	var line_length = null;

	var terms = null;
	var frequencies = null;

	function initViews(parameters){
		terms = parameters.Terms;
		frequencies = parameters.Frequencies;
		
		ys = d3.scale.linear().domain( [ 0, terms.length ] ).range( [ CONTAINER_PADDING.top, CONTAINER_PADDING.top + terms.length * ENCODING_PARAMETERS.packing()   ] );
		
		var maxFreq = 0.0;
		frequencies.forEach( function(d) { maxFreq = Math.max( d.frequency, maxFreq ) } );
		line_length = d3.scale.linear().domain([0, maxFreq]).range( [ CONTAINER_PADDING.left, CONTAINER_PADDING.left + CONTAINER_PADDING.width ] );
			
		var container =	d3.select( "#termFrequencyContainer" );

		var svg = container.append( "svg:svg" )
			.style( "cursor", "default" )
			.style( "width", CONTAINER_PADDING.fullWidth() + "px" )
			.style( "height", CONTAINER_PADDING.fullHeight( ENCODING_PARAMETERS.NUM_TOPICS, terms.length ) + "px" )
		
		var svgTermLabels = svg.append( "svg:g" )
			.attr( "class", "termElements" );
		
		var svgTermBar = svgTermLabels.selectAll( "g" ).data( frequencies ).enter().append( "svg:g" )
			.attr( "transform", function(d,i) { return "translate(0," + ys(i+0.5) + ")" } );
				
		svgTermBar
			.append( "svg:text" )
			.attr( "class", function(d) { return ["termFreqText", getTermClassTag(d.term)].join(" ") })
			.on( "mouseover", function(d) { selectFreqEvent(d.term)} )
			.on( "mouseout", function(d) { deselectFreqEvent(d.term)} )
			.attr( "x", CONTAINER_PADDING.left - CONTAINER_PADDING.left_separation )
			.attr( "y", 3 )
			.attr( "text-anchor", "end" )
			.attr( "font-family", "Verdana" )
			.attr( "font-size", "10px" )
			.attr( "fill", TERMFREQ_TEXT_DEFAULT.COLOR )
			.text( function(d) { return d.term } )
				
		svgTermBar
			.append( "svg:line" )
			.attr( "class", function(d) { return ["termFreqBar", getTermClassTag(d.term)].join(" ") })
			.on( "mouseover", function(d) { selectFreqEvent(d.term)} )
			.on( "mouseout", function(d) { deselectFreqEvent(d.term)} )
			.attr( "y1", 0 )
			.attr( "y2", 0 )
			.attr( "x1", line_length(0) )
			.attr( "x2", function(d) {return line_length(d.frequency)})
			.attr( "stroke-width", TERMFREQ_BAR_DEFAULT.STROKE_WIDTH )
			.attr( "stroke-opacity", TERMFREQ_BAR_DEFAULT.OPACITY )
			.attr( "stroke", TERMFREQ_BAR_DEFAULT.STROKE )
	}

	function updateViews(parameters){		
		var container =	d3.select( "#termFrequencyContainer" );
		container.selectAll("*").remove();
		initViews(parameters);
	}
	
	var results = {};
	results.init = initViews;
	results.update = updateViews;
	return results;
}