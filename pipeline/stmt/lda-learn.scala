// tells Scala where to find the TMT classes
import scalanlp.io._;
import scalanlp.stage._;
import scalanlp.stage.text._;
import scalanlp.text.tokenize._;
import scalanlp.pipes.Pipes.global._;

import edu.stanford.nlp.tmt.stage._;
import edu.stanford.nlp.tmt.model.lda._;



if ( args.length < 2 )
{
  System.err.println( "Arguments: inputFile outputPath [numTopics] [numIters] [termSmoothing] [topicSmoothing]" );
  System.err.println( "     inputFile: tab-delimited file containing the training corpus" );
  System.err.println( "                (first column = docID, second column = text)" );
  System.err.println( "    outputPath: path for saving output model data" );
  System.err.println( "   numOfTopics: number of topics to train [default=20]" );
  System.err.println( "      maxIters: number of iterations to execute [default=1000]" );
  System.err.println( " termSmoothing: [default=0.01]" );
  System.err.println( "topicSmoothing: [default=0.01]" );
  System.exit( -1 );
}


val inputFile = args(0);
val outputPath = args(1);
val indexColumn = 1;
val textColumn = 2;


val numOfTopics = if ( args.length > 2 ) { args(2).toInt } else { 20 };
val maxIters = if ( args.length > 3 ) { args(3).toInt } else { 1000 };
val termSmoothing = if ( args.length > 4 ) { args(4).toDouble } else { 0.01 };
val topicSmoothing = if ( args.length > 5 ) { args(5).toDouble } else { 0.01 };

System.err.println( "LDA Learning Parameters..." );
System.err.println( "     inputFile = " + inputFile );
System.err.println( "    outputPath = " + outputPath );
System.err.println( "   numOfTopics = " + numOfTopics );
System.err.println( "      maxIters = " + maxIters );
System.err.println( " termSmoothing = " + termSmoothing );
System.err.println( "topicSmoothing = " + topicSmoothing );
System.err.println();


val alphabetsOnly = {
  RegexSearchTokenizer( "[0-9A-Za-z_]*[A-Za-z_]+[0-9A-Za-z_]*" ) ~> // keep tokens with alphabets
  CaseFolder() ~>                                                   // fold to lower case
  StopWordFilter( "en" )                                            // remove common English words
}

System.err.println( "Loading source text..." );
val source = TSVFile( inputFile ) ~> IDColumn( indexColumn );
val text = source ~> Column( textColumn ) ~> TokenizeWith( alphabetsOnly ) ~> TermCounter();


System.err.println( "Defining dataset and model..." );
val dataset = LDADataset( text );


val modelParams = LDAModelParams( numTopics=numOfTopics, dataset=dataset, topicSmoothing=topicSmoothing, termSmoothing=termSmoothing );
val modelPath = file( outputPath );

System.err.println( "Learning LDA topics..." );
val model = TrainCVB0LDA( modelParams, dataset, output=modelPath, maxIterations=maxIters );
val perDocTopicDistributions = InferCVB0DocumentTopicDistributions( model, dataset );

System.err.println( "Writing term counts to disk..." );
val termCounts = text.meta[ TermCounts ];
CSVFile( file( outputPath + "/term-counts.csv" ) ).write(
  {
    for ( term <- termCounts.index.iterator ) yield ( term, termCounts.getTF( term ), termCounts.getDF( term ) )
  }
);

//System.err.println( "Writing topics per doc..." )
//CSVFile( file( outputPath + "/topics-per-doc.csv" ) ).write( perDocTopicDistributions );
