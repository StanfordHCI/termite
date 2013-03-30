/*
	TermFrequencyModel.js
	
	This model is responsible for processing and packaging data for the term frequency 
	view. 
	
	Details:
	--------
	Gets parameters and data from FilteredTermTopicProbilityModel. On initialize, the
	model stores the term->term_frequency mapping. On updates, the model receives a list
	of terms and generates a list of item(term, frequency) (same order as the term list
	received as input).  
	
	Passes list to TermFrequencyView.
*/

function TermFrequencyModel(){
	
	var termFreqMap = null;
	var orderedTerms = null;
	
	var termFrequencyView = null;
	
	function load(parameters){	
		termFrequencyView = TermFrequencyView();
		termFreqMap = parameters.TermFreqMap;
	}
	 
	function getFreqs(terms) {
		var frequencies = [];
		for( var i = 0; i < terms.length; i++){
			frequencies.push({
				'term' : terms[i],
				'frequency' : termFreqMap[terms[i]]
			});
		}
		return frequencies;
	}
	
	function update(data){
		orderedTerms = data.TermIndexFiltered;
		view_parameters = {
			Terms: orderedTerms,
			Frequencies: getFreqs(orderedTerms)
		};
		termFrequencyView.update(view_parameters);
	}
	
	var results = {};
	results.load = load;
	results.update = update;
	return results;
}