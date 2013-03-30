#!/bin/sh

# Copies files necessary to run the client to the specified path's public_html directory

EXPECTED_ARGS=1
if [ $# -lt $EXPECTED_ARGS ]
then
	echo "Usage: `basename $0` project_path"
	exit -1
fi

ROOT=$1 # path to public_html
CLIENT_SRC=client-src/
CLIENT_LIB=client-lib/

echo "Copying js files..."
for JS_FILE in d3.v3 jquery backbone underscore FullTermTopicProbabilityModel SeriatedTermTopicProbabilityModel FilteredTermTopicProbabilityModel TermFrequencyModel TermTopicMatrixView TermFrequencyView ViewParameters StateModel UserControlViews QueryString html5slider
do
	cp $CLIENT_LIB/$JS_FILE.min.js $ROOT/public_html/
done

echo "Copying CSS file..."
for CSS_FILE in InteractionObjects termite
do
	cp $CLIENT_SRC/$CSS_FILE.css $ROOT/public_html/
done

echo "Copying local server file..."
cp $CLIENT_SRC/web.sh $ROOT/public_html/

echo "Copying HTML file..."
cp $CLIENT_SRC/index.html $ROOT/public_html/

# rename HTML's imported javascript files to use the minified versions
echo "Renaming library dependencies in HTML file..."
sed -i='' 's|\.js|.min.js|g' $ROOT/public_html/index.html
