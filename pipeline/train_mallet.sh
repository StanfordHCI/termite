#!/bin/bash

EXPECTED_ARGS=3
if [ $# -lt $EXPECTED_ARGS ]
then
	echo "Usage: `basename $0` input-file output-path num-topics"
	exit -1
fi

MALLET=mallet-2.0.7/
INPUT=$1
OUTPUT=$2
TOPICS=$3



echo "--------------------------------------------------------------------------------"
echo "Training [ $INPUT ] --> [ $OUTPUT ]..."
echo

if [ ! -d $OUTPUT ]; then
	echo "Creating output folder..."
    mkdir $OUTPUT
fi

echo "Importing data into Mallet..."
$MALLET/bin/mallet import-file \
	--input $INPUT \
	--output $OUTPUT/text.vectors \
	--line-regex "^(\S*)\t(.*)$" \
	--token-regex "\S+" \
	--name 0 --label 1 --data 2 \
	--remove-stopwords true --encoding utf-8 --keep-sequence
#	--remove-stopwords false --encoding utf-8 --keep-sequence

echo "Learning latent topics..."
$MALLET/bin/mallet train-topics \
	--input $OUTPUT/text.vectors \
	--output-model $OUTPUT/output.model \
	--output-topic-keys $OUTPUT/output-topic-keys.txt \
	--topic-word-weights-file $OUTPUT/topic-word-weights.txt \
	--word-topic-counts-file $OUTPUT/word-topic-counts.txt \
	--num-topics $TOPICS

echo "--------------------------------------------------------------------------------"
