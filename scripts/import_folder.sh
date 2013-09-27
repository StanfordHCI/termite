#!/bin/bash

if [ $# -lt 2 ]
then
	echo "Usage: `basename $0` corpus_folder corpus_identifier num_topics"
	echo
	exit -1
fi

MALLET=tools/mallet-2.0.7
CORPUS_FOLDER=$1
RUN_IDENTIFIER=$2
if [ $# -ge 3 ]
then
	NUM_TOPICS=$3
else
	NUM_TOPICS=25
fi

RUN_FOLDER=data/$RUN_IDENTIFIER
INPUT_FILENAME=$RUN_FOLDER/$RUN_IDENTIFIER.mallet
LDA_FOLDER=$RUN_FOLDER/lda
TM_FOLDER=$RUN_FOLDER/tm

#------------------------------------------------------------------------------#

function __create_folder__ {
	FOLDER=$1
	if [ ! -d $FOLDER ]
	then
		echo "Creating folder: $FOLDER"
		mkdir $FOLDER
	fi
}

__create_folder__ data
__create_folder__ $RUN_FOLDER
__create_folder__ $LDA_FOLDER
__create_folder__ $TM_FOLDER

echo "Importing corpus into Mallet: [$CORPUS_FOLDER/*] --> [$INPUT_FILENAME]"
$MALLET/bin/mallet import-dir\
	--input $CORPUS_FOLDER \
	--output $INPUT_FILENAME \
	--remove-stopwords \
	--token-regex "\p{Alpha}{3,}" \
	--keep-sequence
	
echo "Building a topic model: [$NUM_TOPICS topics]"
$MALLET/bin/mallet train-topics \
	--input $INPUT_FILENAME \
	--output-model $LDA_FOLDER/output.model \
	--output-topic-keys $LDA_FOLDER/output-topic-keys.txt \
	--topic-word-weights-file $LDA_FOLDER/topic-word-weights.txt \
	--word-topic-counts-file $LDA_FOLDER/word-topic-counts.txt \
	--num-topics $NUM_TOPICS

echo "Extracting topic model outputs: [$LDA_FOLDER] --> [$TM_FOLDER]"
scripts/ReadMallet.py $LDA_FOLDER $TM_FOLDER

echo "Creating default index file: $RUN_FOLDER/index.json"
echo '{ "runID" : "$RUN_IDENTIFIER", "entryIDs" : [ 0 ], "nextEntryID" : 1 }' > $RUN_FOLDER/index.json

echo "Creating default state file: $TM_FOLDER/states.json"
echo '{}' > $TM_FOLDER/states.json
