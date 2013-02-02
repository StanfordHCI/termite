#!/bin/bash

# Fetches necessary tools and files to run Termite
# Minifies client javascript files

# Should be run only once to setup Termite.

LIBRARY=lib
STMT=stmt-0.4.0
CLIENT_TEMPLATE=client-template

if [ ! -d $LIBRARY ]
then
	echo
	echo "Creating a library folder: $LIBRARY"
	mkdir $LIBRARY
fi

echo
echo "Downloading D3 library..."
curl http://d3js.org/d3.v3.zip > $LIBRARY/d3.v3.zip

echo
echo "Uncompressing D3..."
unzip $LIBRARY/d3.v3.zip d3.v3.js
mv d3.v3.js $CLIENT_TEMPLATE
unzip $LIBRARY/d3.v3.zip d3.v3.min.js
mv d3.v3.min.js $CLIENT_TEMPLATE

echo
echo "Extracting D3 License..."
unzip $LIBRARY/d3.v3.zip LICENSE -d $LIBRARY
mv $LIBRARY/LICENSE $LIBRARY/LICENSE-d3

echo
echo "Downloading MALLET (MAchine Learning for LanguagE Toolkit)..."
curl http://mallet.cs.umass.edu/dist/mallet-2.0.7.tar.gz > $LIBRARY/mallet-2.0.7.tar.gz

echo
echo "Uncompressing MALLET..."
tar -zxvf $LIBRARY/mallet-2.0.7.tar.gz mallet-2.0.7

echo
echo "Extracting MALLET License..."
cp mallet-2.0.7/LICENSE $LIBRARY/LICENSE-mallet

echo
echo "Downloading STMT (Stanford Topic Modeling Toolkit)..."
if [ ! -d $STMT ]
then
	echo
	echo "Creating a folder for STMT: $STMT"
	mkdir $STMT
fi
curl http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0.jar > $STMT/tmt-0.4.0.jar
curl http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0-src.zip > $LIBRARY/tmt-0.4.0-src.zip

echo
echo "Extracting STMT License..."
unzip $LIBRARY/tmt-0.4.0-src.zip LICENSE -d $LIBRARY
mv $LIBRARY/LICENSE $LIBRARY/LICENSE-stmt

echo
echo "Downloading Google Closure Compiler..."
curl http://closure-compiler.googlecode.com/files/compiler-latest.zip > $LIBRARY/compiler-latest.zip

echo
echo "Uncompressing Google Closure Compiler..."
unzip $LIBRARY/compiler-latest.zip compiler.jar
mv compiler.jar closure-compiler.jar

echo
echo "Extracting Google Closure Compiler License..."
unzip $LIBRARY/compiler-latest.zip COPYING -d $LIBRARY
mv $LIBRARY/COPYING $LIBRARY/LICENSE-closure-compiler

echo
echo "Minifying html5slider.js"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/html5slider.js --js_output_file=$CLIENT_TEMPLATE/html5slider.min.js

echo
echo "Minifying javascript files..."
echo "    File 1 of 7: FullTermTopicProbabilityModel"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/FullTermTopicProbabilityModel.js --js_output_file=$CLIENT_TEMPLATE/FullTermTopicProbabilityModel.min.js
echo "    File 2 of 7: SeriatedTermTopicProbabilityModel"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/SeriatedTermTopicProbabilityModel.js --js_output_file=$CLIENT_TEMPLATE/SeriatedTermTopicProbabilityModel.min.js
echo "    File 3 of 7: FilteredTermTopicProbilityModel"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/FilteredTermTopicProbilityModel.js --js_output_file=$CLIENT_TEMPLATE/FilteredTermTopicProbilityModel.min.js
echo "    File 4 of 7: TermFrequencyModel"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/TermFrequencyModel.js --js_output_file=$CLIENT_TEMPLATE/TermFrequencyModel.min.js
echo "    File 5 of 7: TermTopicMatrixView"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/TermTopicMatrixView.js --js_output_file=$CLIENT_TEMPLATE/TermTopicMatrixView.min.js
echo "    File 6 of 7: TermFrequencyView"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/TermFrequencyView.js --js_output_file=$CLIENT_TEMPLATE/TermFrequencyView.min.js
echo "    File 7 of 7: ViewParameters"
java -jar closure-compiler.jar --js=$CLIENT_TEMPLATE/ViewParameters.js --js_output_file=$CLIENT_TEMPLATE/ViewParameters.min.js
