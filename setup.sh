#!/bin/bash

# Termite Set-Up Script
#
# Run once to
#   - download necessary library files
#   - minify client javascript files
#

LIBRARY=lib/
STMT=stmt-0.4.0/
CLIENT_SRC=client-src/
CLIENT_LIB=client-lib/

if [ ! -d $LIBRARY ]
then
	echo
	echo "Creating a library folder: $LIBRARY"
	mkdir $LIBRARY
fi

if [ ! -d $CLIENT_LIB ]
then
	echo
	echo "Creating the client template folder: $CLIENT_LIB"
	mkdir $CLIENT_LIB
fi

#------------------------------------------------------------------------------#
# D3 Visualization Javascript Library

echo
echo "Downloading D3 javascript library..."
curl --insecure --location https://github.com/mbostock/d3/releases/download/v3.4.1/d3.v3.zip > $LIBRARY/d3.v3.zip

echo
echo "Uncompressing D3 javascript library..."
unzip $LIBRARY/d3.v3.zip d3.v3.js -d $CLIENT_SRC
unzip $LIBRARY/d3.v3.zip d3.v3.min.js -d $CLIENT_LIB

echo
echo "Extracting D3 license..."
unzip $LIBRARY/d3.v3.zip LICENSE -d $LIBRARY
mv $LIBRARY/LICENSE $LIBRARY/LICENSE-d3

#------------------------------------------------------------------------------#
# jQuery Javascript Library

echo
echo "Downloading jQuery javascript library..."
curl --insecure --location http://code.jquery.com/jquery-1.9.1.js > $CLIENT_SRC/jquery.js
curl --insecure --location http://code.jquery.com/jquery-1.9.1.min.js > $CLIENT_LIB/jquery.min.js

echo
echo "Downloading jQuery GitHub archive..."
curl --insecure --location http://github.com/jquery/jquery/archive/master.zip > $LIBRARY/jquery.zip

echo
echo "Extracting jQuery license..."
unzip $LIBRARY/jquery.zip jquery-master/MIT-LICENSE.txt -d $LIBRARY
mv $LIBRARY/jquery-master/MIT-LICENSE.txt $LIBRARY/LICENSE-jquery
rmdir $LIBRARY/jquery-master

#------------------------------------------------------------------------------#
# Underscore Javascript Library

echo
echo "Downloading Underscore GitHub archive..."
curl --insecure --location http://github.com/documentcloud/underscore/archive/master.zip > $LIBRARY/underscore.zip

echo
echo "Uncompressing Underscore javascript library..."
unzip $LIBRARY/underscore.zip underscore-master/underscore.js -d $LIBRARY
unzip $LIBRARY/underscore.zip underscore-master/underscore-min.js -d $LIBRARY
mv $LIBRARY/underscore-master/underscore.js $CLIENT_SRC/underscore.js
mv $LIBRARY/underscore-master/underscore-min.js $CLIENT_LIB/underscore.min.js

echo
echo "Extracting Underscore license..."
unzip $LIBRARY/underscore.zip underscore-master/LICENSE -d $LIBRARY
mv $LIBRARY/underscore-master/LICENSE $LIBRARY/LICENSE-underscore
rmdir $LIBRARY/underscore-master

#------------------------------------------------------------------------------#
# Backbone Javascript Library

echo
echo "Downloading Backbone GitHub archive..."
curl --insecure --location http://github.com/documentcloud/backbone/archive/master.zip > $LIBRARY/backbone.zip

echo
echo "Uncompressing Backbone javascript library..."
unzip $LIBRARY/backbone.zip backbone-master/backbone.js -d $LIBRARY
unzip $LIBRARY/backbone.zip backbone-master/backbone-min.js -d $LIBRARY
mv $LIBRARY/backbone-master/backbone.js $CLIENT_SRC/backbone.js
mv $LIBRARY/backbone-master/backbone-min.js $CLIENT_LIB/backbone.min.js

echo
echo "Extracting Backbone license..."
unzip $LIBRARY/backbone.zip backbone-master/LICENSE -d $LIBRARY
mv $LIBRARY/backbone-master/LICENSE $LIBRARY/LICENSE-backbone
rmdir $LIBRARY/backbone-master

#------------------------------------------------------------------------------#
# Mallet (topic modeling library)

echo
echo "Downloading MALLET (MAchine Learning for LanguagE Toolkit)..."
curl --insecure --location http://mallet.cs.umass.edu/dist/mallet-2.0.7.tar.gz > $LIBRARY/mallet-2.0.7.tar.gz

echo
echo "Uncompressing MALLET..."
tar -zxvf $LIBRARY/mallet-2.0.7.tar.gz mallet-2.0.7

echo
echo "Extracting MALLET License..."
cp mallet-2.0.7/LICENSE $LIBRARY/LICENSE-mallet

#------------------------------------------------------------------------------#
# Stanford Topic Modeling Toolkit

echo
echo "Downloading STMT (Stanford Topic Modeling Toolkit)..."
if [ ! -d $STMT ]
then
	echo
	echo "Creating a folder for STMT: $STMT"
	mkdir $STMT
fi
curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0.jar > $STMT/tmt-0.4.0.jar
curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0-src.zip > $LIBRARY/tmt-0.4.0-src.zip

echo
echo "Extracting STMT License..."
unzip $LIBRARY/tmt-0.4.0-src.zip LICENSE -d $LIBRARY
cp $LIBRARY/LICENSE $LIBRARY/LICENSE-stmt

#------------------------------------------------------------------------------#
# Google closure compiler for Javascript

echo
echo "Downloading Google Closure Compiler..."
curl --insecure --location http://dl.google.com/closure-compiler/compiler-latest.zip > $LIBRARY/compiler-latest.zip

echo
echo "Uncompressing Google Closure Compiler..."
unzip $LIBRARY/compiler-latest.zip compiler.jar -d $LIBRARY
mv $LIBRARY/compiler.jar $LIBRARY/closure-compiler.jar

echo
echo "Extracting Google Closure Compiler License..."
unzip $LIBRARY/compiler-latest.zip COPYING -d $LIBRARY
cp $LIBRARY/COPYING $LIBRARY/LICENSE-closure-compiler

#------------------------------------------------------------------------------#
# Slider for Firefox

echo
echo "Minifying html5slider.js"
java -jar $LIBRARY/closure-compiler.jar --js=$CLIENT_SRC/html5slider.js --js_output_file=$CLIENT_LIB/html5slider.min.js

#------------------------------------------------------------------------------#
# Minify javascript files

echo
echo "Minifying javascript files..."

for JS_FILE in FullTermTopicProbabilityModel SeriatedTermTopicProbabilityModel FilteredTermTopicProbabilityModel TermFrequencyModel TermTopicMatrixView TermFrequencyView ViewParameters StateModel UserControlViews QueryString
do
	echo "    Minifying $JS_FILE"
	java -jar $LIBRARY/closure-compiler.jar --js=$CLIENT_SRC/$JS_FILE.js --js_output_file=$CLIENT_LIB/$JS_FILE.min.js
done
