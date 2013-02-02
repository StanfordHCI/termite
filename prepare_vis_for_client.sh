#!/bin/sh

# Copies files necessary to run the client to the specified path's public_html directory

ROOT=$1 # path to public_html

echo "Copying d3.js..."
cp client-template/d3.v3.min.js $ROOT/public_html/

# test
echo "Copying js files..."
cp client-template/FullTermTopicProbabilityModel.min.js $ROOT/public_html/
cp client-template/SeriatedTermTopicProbabilityModel.min.js $ROOT/public_html/
cp client-template/FilteredTermTopicProbilityModel.min.js $ROOT/public_html/
cp client-template/TermFrequencyModel.min.js $ROOT/public_html/
cp client-template/TermTopicMatrixView.min.js $ROOT/public_html/
cp client-template/TermFrequencyView.min.js $ROOT/public_html/
cp client-template/ViewParameters.min.js $ROOT/public_html/
cp client-template/html5slider.min.js $ROOT/public_html/

echo "Copying CSS file..."
cp client-template/termite.css $ROOT/public_html/

echo "Copying local server file..."
cp client-template/web.sh $ROOT/public_html/

echo "Copying HTML file..."
cp client-template/index.html $ROOT/public_html/

# rename HTML's imported javascript files to use the minified versions
echo "Renaming library dependencies in HTML file..."
sed -i='' 's/d3.v3.js/d3.v3.min.js/' $ROOT/public_html/index.html
sed -i='' 's/html5slider.js/html5slider.min.js/' $ROOT/public_html/index.html
sed -i='' 's/FullTermTopicProbabilityModel.js/FullTermTopicProbabilityModel.min.js/' $ROOT/public_html/index.html
sed -i='' 's/SeriatedTermTopicProbabilityModel.js/SeriatedTermTopicProbabilityModel.min.js/' $ROOT/public_html/index.html
sed -i='' 's/FilteredTermTopicProbilityModel.js/FilteredTermTopicProbilityModel.min.js/' $ROOT/public_html/index.html
sed -i='' 's/TermFrequencyModel.js/TermFrequencyModel.min.js/' $ROOT/public_html/index.html
sed -i='' 's/TermTopicMatrixView.js/TermTopicMatrixView.min.js/' $ROOT/public_html/index.html
sed -i='' 's/TermFrequencyView.js/TermFrequencyView.min.js/' $ROOT/public_html/index.html
sed -i='' 's/ViewParameters.js/ViewParameters.min.js/' $ROOT/public_html/index.html