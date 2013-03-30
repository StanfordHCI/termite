/*
	SeriatedTermTopicProbabilityModel.js
	
	Currently: Reads in input files for seriated terms, topics, term information 
		(e.g. saliency), and matrix of similarity values.
		
	
	Designed to take in a subset of the full list of terms, topics, and matrix. 
	
	Passes inputs and some generated maps to FilteredTermTopicProbabilityModel.
*/


function SeriatedTermTopicProbabilityModel()
{
	// Listen to changes in FullTermTopicProbabilityModel
	
	var submatrix = null;
	var termIndex = null;
	var topicIndex = null;
	
	var	termtermRankMap = {}
	var termtermOrderMap = {}
	var termFreqMap = {}
	var termSaliencyMap = {}
	
	var filteredTermTopicProbilityModel = null
	
	function load( model ) {
		var numFilesLoaded = 0;
		var numFilesExpected = 4;
		var filteredTermTopicProbilityModel = model;
		
		d3.text( "data/submatrix-term-topic.txt", loadSubmatrix );
		d3.text( "data/submatrix-term-index.txt", loadTermIndex );
		d3.text( "data/submatrix-topic-index.txt", loadTopicIndex );
		d3.json( "data/term-info.json", loadTermFields);
		
		function loadSubmatrix( data ) {
			var lines = data.split( /[\n\r\f]+/g );
			submatrix = [];
			for ( var i in lines ) {
				var line = lines[i].split( /\t/g );
				if ( line.length > 0 ) {
					var row = [];
					line.forEach( function(d) { 
						if ( d.length > 0 )
							row.push( parseFloat(d) );
					} );
					if ( row.length > 0 )
						submatrix.push( row );
				}
			}
			loadEvent();
		}
		function loadTermIndex( data ) {
			var lines = data.split( /[\n\r\f]+/g );
			termIndex = [];
			lines.forEach( function(d) {
				if ( d.length > 0 )
					termIndex.push( d );
			} );
			loadEvent();
		}
		function loadTopicIndex( data ) {
			var lines = data.split( /[\n\r\f]+/g );
			topicIndex = [];
			lines.forEach( function(d) {
				if ( d.length > 0 )
					topicIndex.push( d );
			} );
			
			ENCODING_PARAMETERS.setNumTopics( topicIndex.length );
			loadEvent();
		}
		function loadTermFields( data ) {
			var index;
			for(index = 0; index < data.length; index++){
				var current_term = data[index].term;
				termtermRankMap[current_term] = data[index].ranking;
				termtermOrderMap[current_term] = data[index].ordering;
				termFreqMap[current_term] = data[index].frequency;
				termSaliencyMap[current_term] = data[index].saliency;
			}
			loadEvent();
		}
		function loadEvent() {
			numFilesLoaded ++;
			// fire "loaded" event
			// backbone.fire( "loaded", ... ,..., ... );
			if ( numFilesLoaded >= numFilesExpected ) {
				var parameters = {
					TermtermRankMap:termtermRankMap,
					TermtermOrderMap:termtermOrderMap,
					TermFreqMap:termFreqMap,
					TermSaliencyMap:termSaliencyMap 
				};
				var data = {
					SubMatrix:submatrix,
					TermIndex:termIndex,
					TopicIndex:topicIndex
				};
				filteredTermTopicProbilityModel.load(parameters, data);
			}
		}
	}
	
	var results = {};
	results.load = load;
	return results;
}