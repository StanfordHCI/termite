/*
	FilteredTermTopicProbilityModel.js
	
	This model is responsible for modifying data based on user inputs/controls and passing
	the modified data downstream. 
		Current user control changes:
			-number of terms to show based on BEA choice order
			-number of terms to show based on saliency score (desc order)
			-specific terms to always show in the list of terms
	
	Details:
	--------
	Gets parameters and data from SeriatedTermTopicProbabilityModel on initialize.
	Afterwards, this model is called when the user controls on the website are changed.
	At that time, the new "user defined" state is passed to the update function.  
	
	Passes modified data to TermFrequencyModel and TermTopicMatrixView. Also, updates
	user control panel in html to show the results of user control changes.
*/

function FilteredTermTopicProbilityModel()
{
	// Listen to changes in SeriatedTermTopicProbabilityModel
	var TERM_COUNT = d3.select("input#UserSpecifiedNumTerms")[0][0].value;
	var SALIENT_TERM_COUNT = d3.select("input#UserSpecifiedNumSalientTerms")[0][0].value;
	
	var submatrixFiltered = null;
	var termIndexFiltered = null;
	var topicIndexFiltered = null;
	
	var original_submatrix = null;
	var original_termIndex = null;
	var original_topicIndex = null;
	
	var termRankMap = null;
	var termOrderMap = null;
	var termSaliencyList = null;
	
	var termTopicMatrixView = null;
	var termFrequencyModel = null;
	
	var rowIndexMap = {};
	
	function load( parameters, data ) {
		termTopicMatrixView = TermTopicMatrixView();
		termFrequencyModel = TermFrequencyModel();

		termRankMap = parameters.TermtermRankMap;
		termOrderMap = parameters.TermtermOrderMap;
		initTermSaliencyList(parameters.TermSaliencyMap);
		initRowIndexMap(data.TermIndex);
		
		original_submatrix = data.SubMatrix;
		original_termIndex = data.TermIndex;
		original_topicIndex = data.TopicIndex;
		
		frequency_parameters = {
			TermFreqMap: parameters.TermFreqMap
		}
		termFrequencyModel.load(frequency_parameters);
		
		var state = {
			userNumTerms: TERM_COUNT,
			userSalientTerms: SALIENT_TERM_COUNT,
			userDefinedTerms: []
		};
		updateTerms(state);
	}
	function filter(submatrix, termIndex, topicIndex, visible_terms){
		var USER_DEFINED_TERMS = visible_terms;
		var found_userDefined_terms = [];
		var subsetOrder = [];
		var pickedTerms = [];
				
		// get the order of the subset of terms
		// choose terms by order of ranking
		for ( var i = 0; i < termIndex.length; i++ ){
			var term = termIndex[i];
			if(termRankMap[term] < TERM_COUNT){
				pickedTerms.push(term);
				subsetOrder.push([term, termOrderMap[term]]);
				if(visible_terms.indexOf(term) >= 0 && found_userDefined_terms.indexOf(term) < 0)
					found_userDefined_terms.push(term);
			} else if(visible_terms.indexOf(term) >= 0 && found_userDefined_terms.indexOf(term) < 0) {
				subsetOrder.push([term, termOrderMap[term]]);
				//visible_terms.splice(visible_terms.indexOf(term), 1);
				found_userDefined_terms.push(term);
				pickedTerms.push(term);
			}
		}
		// iterate through saliency list
		for( var i = 0; i < SALIENT_TERM_COUNT; i++ ){
			var term = termSaliencyList[i];
			
			if(pickedTerms.indexOf(term) < 0){
				subsetOrder.push([term, termOrderMap[term]]);
			
				var visible_index = visible_terms.indexOf(term);
				if(visible_index >= 0 && found_userDefined_terms.indexOf(term) < 0){
					found_userDefined_terms.push(term);
				}
			}
		}
		// catch any user defined terms that weren't already seen
		for( var i = 0; i < visible_terms.length; i++ ){
			var term = visible_terms[i];
			if(found_userDefined_terms.indexOf(term) <0 && termSaliencyList.indexOf(term) >= 0){
				subsetOrder.push([term, termOrderMap[term]]);
				found_userDefined_terms.push(term);
			}
		}
		for( var i = 0; i < found_userDefined_terms.length; i++){
			visible_terms.splice(visible_terms.indexOf(found_userDefined_terms[i]),1);
		}
		subsetOrder.sort(function(a, b) {return a[1] - b[1]})
		
		d3.select("div#TotalTerms").text(subsetOrder.length);
		d3.select("div#UserSpecifiedVisibleTermsResults").text(found_userDefined_terms.join(", "));
		if(visible_terms.length > 0 && visible_terms[0] != ""){
			d3.select("div#NotVisibleTermsPrefix").style("visibility", "visible");
			d3.select("div#NotVisibleTerms").style("visibility", "visible")
				.text(visible_terms.join(", "));
		} else {
			d3.select("div#NotVisibleTermsPrefix").style("visibility", "hidden");
			d3.select("div#NotVisibleTerms").style("visibility", "hidden");
		}
		
		submatrixFiltered = [];
		termIndexFiltered = []
		for(var j = 0; j < subsetOrder.length; j++){
			var term = subsetOrder[j][0];
			termIndexFiltered.push(term);
			submatrixFiltered.push(submatrix[rowIndexMap[term]]);
		}
		topicIndexFiltered = topicIndex;
	}
	function initRowIndexMap(termIndex){
		for ( var i = 0; i < termIndex.length; i++ ){
			rowIndexMap[termIndex[i]] = i;
		}
	}
	function initTermSaliencyList( saliencyMap ){
		termSaliencyList = [];
		tempList = [];
		for ( var term in saliencyMap ){
			tempList.push([term, saliencyMap[term]]);
		}
		tempList.sort(function(a, b) {return b[1] - a[1]});
		for( var i = 0; i < tempList.length; i++ ){
			termSaliencyList.push(tempList[i][0]);
		}
	}
	function updateTerms(state){
		TERM_COUNT = state.userNumTerms;
		SALIENT_TERM_COUNT = state.userSalientTerms;
		
		filter(original_submatrix, original_termIndex, original_topicIndex, state.userDefinedTerms)
		
		matrix_data = {
			SparseMatrix: sparseMatrix( conditionalMatrix(submatrixFiltered, termIndexFiltered, topicIndexFiltered), termIndexFiltered, topicIndexFiltered),
			TermIndexFiltered: termIndexFiltered,
			TopicIndexFiltered: topicIndexFiltered
		};
		termTopicMatrixView.update(matrix_data);
		
		frequency_data = {
			TermIndexFiltered: termIndexFiltered
		}
		termFrequencyModel.update(frequency_data);
	}
	
	var results = {};
	results.load = load;
	results.update = updateTerms;
	return results;
}

function conditionalMatrix( submatrix, termIndex, topicIndex ) {
	return submatrix; // Normalize columwise
}

function sparseMatrix( submatrix, termIndex, topicIndex ){
	var THRESHOLD = 0.01;
	
	var sparseMatrix = [];
	for ( var i = 0; i < termIndex.length; i++ )
		for ( var j = 0; j < topicIndex.length; j++ )
			if ( submatrix[i][j] > THRESHOLD )
				sparseMatrix.push({
					'term' : termIndex[i],
					'termIndex' : i,
					'topicName' : topicIndex[j],
					'topicIndex' : j,
					'value' : submatrix[i][j]
				});
	return sparseMatrix;
}