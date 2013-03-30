#!/bin/bash

EXPECTED_ARGS=3
if [ $# -lt $EXPECTED_ARGS ]
then
	echo "Usage: `basename $0` input-file output-path num-topics"
	exit -1
fi

STMT_JAR=stmt-0.4.0/
STMT_LIB=pipeline/stmt/
INPUT=$1
OUTPUT=$2
TOPICS=$3
ITERS=1000

echo "--------------------------------------------------------------------------------"
echo "Training [ $INPUT ] --> [ $OUTPUT ]..."
echo

echo "java -Xmx2g -jar $STMT_LIB/tmt-0.4.0.jar $STMT_LIB/lda-learn.scala $INPUT $OUTPUT $TOPICS $ITERS"
java -Xmx2g -jar $STMT_JAR/tmt-0.4.0.jar $STMT_LIB/lda-learn.scala $INPUT $OUTPUT $TOPICS $ITERS

echo "Mark file iteration as 'final-iters'..."
ln -s `printf '%05d' $ITERS`/ $OUTPUT/final-iters

echo "Unpack topic-term distribution..."
gunzip -c $OUTPUT/final-iters/topic-term-distributions.csv.gz > $OUTPUT/topic-term-distributions.csv

echo "Generate topic-index (list of topics)..."
$STMT_LIB/generate-topic-index.py $OUTPUT $TOPICS

echo "Copy term-index (list of terms)..."
cp $OUTPUT/final-iters/term-index.txt $OUTPUT/term-index.txt

echo "Extract doc-index (list of documents)..."
$STMT_LIB/extract-doc-index.py $OUTPUT

echo "Extract list of term frequencies..."
$STMT_LIB/extract-term-freqs.py $OUTPUT

echo "--------------------------------------------------------------------------------"
