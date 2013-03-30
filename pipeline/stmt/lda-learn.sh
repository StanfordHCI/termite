#!/bin/bash

# Check for proper number of command line args.
EXPECTED_ARGS=6
if [ $# -lt $EXPECTED_ARGS ]
then
	echo "Usage: `basename $0` input-file output-path iters topics term-smoothing topic-smoothing"
	exit -1
fi

PATH=stmt-0.4.0
INPUT=$1
OUTPUT=$2
ITERS=$3
TOPICS=$4
TERM_SMOOTHING=$5
TOPIC_SMOOTHING=$6


echo "Training [ $INPUT ] --> [ $OUTPUT ]..."
echo "java -Xmx2g -jar $PATH/tmt-0.4.0.jar $PATH/lda-learn.scala $INPUT $OUTPUT $TOPICS $ITERS $TERM_SMOOTHING $TOPIC_SMOOTHING"
java -Xmx2g -jar $PATH/tmt-0.4.0.jar $PATH/lda-learn.scala $INPUT $OUTPUT $TOPICS $ITERS $TERM_SMOOTHING $TOPIC_SMOOTHING




#echo "Generate summary page..."
#stmt/summarize.py $OUTPUT stmt

echo "Mark file iteration as 'final-iters'..."
ln -s `printf '%05d' $ITERS`/ $OUTPUT/final-iters

echo "Unpack topic-term distribution..."
gunzip -c $OUTPUT/final-iters/topic-term-distributions.csv.gz > $OUTPUT/topic-term-distributions.csv



echo "Generate topic-index (list of topics)..."
$PATH/generate-topic-index.py $OUTPUT $TOPICS

echo "Copy term-index (list of terms)..."
cp $OUTPUT/final-iters/term-index.txt $OUTPUT/term-index.txt

echo "Extract doc-index (list of documents)..."
$PATH/extract-doc-index.py $OUTPUT

echo "Extract list of term frequencies..."
$PATH/extract-term-freqs.py $OUTPUT
