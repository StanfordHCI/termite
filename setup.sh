#!/bin/bash

# Javascript folders (source and minified)
SOURCE_PATH=client_src
MINIFIED_PATH=client_min

# Output folders
EXTERNALS_PATH=externals
TOOLS_PATH=tools
CORPUS_PATH=corpus

# Output subfolders
SOURCE_JS_PATH=$SOURCE_PATH/js
SOURCE_JS_LIB_PATH=$SOURCE_PATH/js/lib
SOURCE_JS_TERMITE_PATH=$SOURCE_PATH/js/termite
SOURCE_JS_NAVIGATION_PATH=$SOURCE_PATH/js/navigation
SOURCE_CSS_PATH=$SOURCE_PATH/css
MINIFIED_JS_PATH=$MINIFIED_PATH/js
MINIFIED_CSS_PATH=$MINIFIED_PATH/css

# List of javascript files to minify (in subfolder "js")
JS_MINIFICATION_FILES="$SOURCE_JS_TERMITE_PATH/CoreModel.js $SOURCE_JS_TERMITE_PATH/CoreView.js $SOURCE_JS_TERMITE_PATH/MatrixState.js $SOURCE_JS_TERMITE_PATH/MatrixInteractions.js
$SOURCE_JS_TERMITE_PATH/MatrixModel.js $SOURCE_JS_TERMITE_PATH/MatrixModel_AnnotationControls.js $SOURCE_JS_TERMITE_PATH/MatrixModel_Positions.js $SOURCE_JS_TERMITE_PATH/MatrixModel_Precomputations.js
$SOURCE_JS_TERMITE_PATH/MatrixModel_SelectionGroups.js $SOURCE_JS_TERMITE_PATH/MatrixModel_Styles.js $SOURCE_JS_TERMITE_PATH/MatrixModel_Values.js $SOURCE_JS_TERMITE_PATH/MatrixModel_Visibilities.js
$SOURCE_JS_TERMITE_PATH/MatrixSelections.js $SOURCE_JS_TERMITE_PATH/MatrixView.js"

# List of css files to minify (in subfolder "css")
CSS_MINIFICATION_FILES="$SOURCE_CSS_PATH/MatrixView.css"

#------------------------------------------------------------------------------#

function __create_folder__ {
	FOLDER=$1
	if [ ! -d $FOLDER ]
	then
		echo "Creating folder: $FOLDER"
		mkdir $FOLDER
	fi
}

#------------------------------------------------------------------------------#
# Mallet (topic modeling library)

function __setup_mallet__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/mallet-2.0.7
	TOOL_SUBPATH=$TOOLS_PATH/mallet-2.0.7
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading MALLET (MAchine Learning for LanguagE Toolkit)..."
		curl --insecure --location http://mallet.cs.umass.edu/dist/mallet-2.0.7.tar.gz > $EXTERNAL_SUBPATH/mallet-2.0.7.tar.gz

		echo ">> Uncompressing MALLET..."
		tar -zxvf $EXTERNAL_SUBPATH/mallet-2.0.7.tar.gz mallet-2.0.7 &&\
			mv mallet-2.0.7/* $TOOL_SUBPATH &&\
			rmdir mallet-2.0.7

		echo ">> Extracting MALLET License..."
		cp $TOOL_SUBPATH/LICENSE $EXTERNAL_SUBPATH/LICENSE
	fi
}

#------------------------------------------------------------------------------#
# Mallet - Tree Topic model (topic modeling library)

function __setup_tree_tm__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/tree-tm
	TOOL_SUBPATH=$TOOLS_PATH/tree-tm
	if [ ! -d "$TOOL_SUBPATH" ]
	then
		ln -s ../tree-TM/ $TOOL_SUBPATH
		__create_folder__ $TOOL_SUBPATH/class
		echo ">> Compiling TreeTM from source code..."
		javac -cp $TOOL_SUBPATH/class:$TOOL_SUBPATH/lib/* $TOOL_SUBPATH/src/cc/mallet/topics/*/*.java -d $TOOL_SUBPATH/class
	fi
}

#------------------------------------------------------------------------------#
# Stanford Topic Modeling Toolkit

function __setup_stmt__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/stmt-0.4.0
	TOOL_SUBPATH=$TOOLS_PATH/stmt-0.4.0
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading STMT (Stanford Topic Modeling Toolkit)..."
		curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0-src.zip > $EXTERNAL_SUBPATH/tmt-0.4.0-src.zip
		curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0.jar > $TOOL_SUBPATH/tmt-0.4.0.jar

		echo ">> Extracting STMT License..."
		unzip $EXTERNAL_SUBPATH/tmt-0.4.0-src.zip LICENSE -d $EXTERNAL_SUBPATH
	fi
}

#------------------------------------------------------------------------------#
# D3 Visualization Javascript Library

function __setup_d3__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/d3-v3
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading D3 javascript library..."
		curl --insecure --location http://d3js.org/d3.v3.zip > $EXTERNAL_SUBPATH/d3.v3.zip

		echo ">> Uncompressing D3 javascript library..."
		unzip $EXTERNAL_SUBPATH/d3.v3.zip d3.v3.js -d $SOURCE_JS_LIB_PATH &&\
			mv $SOURCE_JS_LIB_PATH/d3.v3.js $SOURCE_JS_LIB_PATH/d3.js
		unzip $EXTERNAL_SUBPATH/d3.v3.zip d3.v3.min.js -d $MINIFIED_JS_PATH &&\
			mv $MINIFIED_JS_PATH/d3.v3.min.js $MINIFIED_JS_PATH/d3.js

		echo ">> Extracting D3 license..."
		unzip $EXTERNAL_SUBPATH/d3.v3.zip LICENSE -d $EXTERNAL_SUBPATH
	fi
}

#------------------------------------------------------------------------------#
# Backbone Javascript Library

function __setup_backbone__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/backbone-latest
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading Backbone GitHub archive..."
		curl --insecure --location http://github.com/documentcloud/backbone/archive/master.zip > $EXTERNAL_SUBPATH/backbone.zip

		echo ">> Uncompressing Backbone javascript library..."
		unzip $EXTERNAL_SUBPATH/backbone.zip backbone-master/backbone.js -d $SOURCE_JS_LIB_PATH &&\
			mv $SOURCE_JS_LIB_PATH/backbone-master/backbone.js $SOURCE_JS_LIB_PATH/backbone.js &&\
			rmdir $SOURCE_JS_LIB_PATH/backbone-master
		unzip $EXTERNAL_SUBPATH/backbone.zip backbone-master/backbone-min.js -d $MINIFIED_JS_PATH &&\
			mv $MINIFIED_JS_PATH/backbone-master/backbone-min.js $MINIFIED_JS_PATH/backbone.js &&\
			rmdir $MINIFIED_JS_PATH/backbone-master
		
		echo "Extracting Backbone license..."
		unzip $EXTERNAL_SUBPATH/backbone.zip backbone-master/LICENSE -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/backbone-master/LICENSE $EXTERNAL_SUBPATH/LICENSE &&\
			rmdir $EXTERNAL_SUBPATH/backbone-master
	fi
}

#------------------------------------------------------------------------------#
# Underscore Javascript Library

function __setup_underscore__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/underscore-latest
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading Underscore GitHub archive..."
		curl --insecure --location http://github.com/documentcloud/underscore/archive/master.zip > $EXTERNAL_SUBPATH/underscore.zip

		echo ">> Uncompressing Underscore javascript library..."
		unzip $EXTERNAL_SUBPATH/underscore.zip underscore-master/underscore.js -d $SOURCE_JS_LIB_PATH &&\
			mv $SOURCE_JS_LIB_PATH/underscore-master/underscore.js $SOURCE_JS_LIB_PATH/underscore.js &&\
			rmdir $SOURCE_JS_LIB_PATH/underscore-master
		unzip $EXTERNAL_SUBPATH/underscore.zip underscore-master/underscore-min.js -d $MINIFIED_JS_PATH &&\
			mv $MINIFIED_JS_PATH/underscore-master/underscore-min.js $MINIFIED_JS_PATH/underscore.js &&\
			rmdir $MINIFIED_JS_PATH/underscore-master

		echo ">> Extracting Underscore license..."
		unzip $EXTERNAL_SUBPATH/underscore.zip underscore-master/LICENSE -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/underscore-master/LICENSE $EXTERNAL_SUBPATH/LICENSE &&\
			rmdir $EXTERNAL_SUBPATH/underscore-master
	fi
}

#------------------------------------------------------------------------------#
# jQuery Javascript Library

function __setup_jquery__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/jquery-1.9.1
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading jQuery javascript library..."
		curl --insecure --location http://code.jquery.com/jquery-1.9.1.js > $SOURCE_JS_LIB_PATH/jquery.js
		curl --insecure --location http://code.jquery.com/jquery-1.9.1.min.js > $MINIFIED_JS_PATH/jquery.js

		echo ">> Downloading jQuery GitHub archive..."
		curl --insecure --location http://github.com/jquery/jquery/archive/master.zip > $EXTERNAL_SUBPATH/jquery.zip

		echo ">> Extracting jQuery license..."
		unzip $EXTERNAL_SUBPATH/jquery.zip jquery-master/MIT-LICENSE.txt -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/jquery-master/MIT-LICENSE.txt $EXTERNAL_SUBPATH/LICENSE &&\
			rmdir $EXTERNAL_SUBPATH/jquery-master
	fi
}

#------------------------------------------------------------------------------#
# Chosen Javascript Library

function __setup_chosen__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/chosen-0.11.1
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading Chosen GitHub archive..."
		curl --insecure --location http://chosen.getharvest.com.s3.amazonaws.com/chosen_v0.11.1.zip > $EXTERNAL_SUBPATH/chosen_v0.11.1.zip
		curl --insecure --location http://github.com/harvesthq/chosen/archive/master.zip > $EXTERNAL_SUBPATH/chosen-github.zip
	
		echo ">> Uncompressing Chosen javascript library..."
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen.jquery.js -d $SOURCE_JS_LIB_PATH
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen.jquery.min.js -d $MINIFIED_JS_PATH &&\
			mv $MINIFIED_JS_PATH/chosen.jquery.min.js $MINIFIED_JS_PATH/chosen.jquery.js
	
		echo ">> Uncompressing Chosen CSS resources..."
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen.css -d $SOURCE_CSS_PATH
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen.min.css -d $MINIFIED_CSS_PATH &&\
			mv $MINIFIED_CSS_PATH/chosen.min.css $MINIFIED_CSS_PATH/chosen.css
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen-sprite.png -d $SOURCE_CSS_PATH
		unzip $EXTERNAL_SUBPATH/chosen_v0.11.1.zip chosen-sprite.png -d $MINIFIED_CSS_PATH
	
		echo ">> Extracting Chosen license..."
		unzip $EXTERNAL_SUBPATH/chosen-github.zip chosen-master/LICENSE.md -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/chosen-master/LICENSE.md $EXTERNAL_SUBPATH/LICENSE &&\
			rmdir $EXTERNAL_SUBPATH/chosen-master
	fi
}

#------------------------------------------------------------------------------#
# Font Awesome Library

function __setup_font_awesome__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/font-awesome-latest
	if [ ! -d "$EXTERNAL_SUBPATH" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading Font Awesome..."
		curl --insecure --location http://fortawesome.github.io/Font-Awesome/assets/font-awesome.zip > $EXTERNAL_SUBPATH/font-awesome.zip
	
		echo ">> Uncompressing Font Awesome library..."
		unzip $EXTERNAL_SUBPATH/font-awesome.zip -d $EXTERNAL_SUBPATH
	
		echo ">> Moving Font Awesome resources..."
		mv $EXTERNAL_SUBPATH/font-awesome/css/font-awesome.css $SOURCE_CSS_PATH
		mv $EXTERNAL_SUBPATH/font-awesome/css/font-awesome-ie7.css $SOURCE_CSS_PATH
		mv $EXTERNAL_SUBPATH/font-awesome/css/font-awesome.min.css $MINIFIED_CSS_PATH/font-awesome.css
		mv $EXTERNAL_SUBPATH/font-awesome/css/font-awesome-ie7.min.css $MINIFIED_CSS_PATH/font-awesome-ie7.css
		cp -R $EXTERNAL_SUBPATH/font-awesome/less $SOURCE_PATH
		cp -R $EXTERNAL_SUBPATH/font-awesome/font $SOURCE_PATH
		cp -R $EXTERNAL_SUBPATH/font-awesome/less $MINIFIED_PATH
		cp -R $EXTERNAL_SUBPATH/font-awesome/font $MINIFIED_PATH
		rm -rf $EXTERNAL_SUBPATH/font-awesome
	fi
}

#------------------------------------------------------------------------------#
# Google closure compiler for Javascript

function __setup_closure__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/closure-latest
	TOOL_SUBPATH=$TOOLS_PATH/closure
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading Google Closure Compiler..."
		curl --insecure --location http://closure-compiler.googlecode.com/files/compiler-latest.zip > $EXTERNAL_SUBPATH/compiler-latest.zip

		echo ">> Uncompressing Google Closure Compiler..."
		unzip $EXTERNAL_SUBPATH/compiler-latest.zip compiler.jar -d $TOOL_SUBPATH

		echo ">> Extracting Google Closure Compiler License..."
		unzip $EXTERNAL_SUBPATH/compiler-latest.zip COPYING -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/COPYING $EXTERNAL_SUBPATH/LICENSE
	fi
}

#------------------------------------------------------------------------------#
# YUI minification for CSS

function __setup_yui__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/yui-2.4.7
	TOOL_SUBPATH=$TOOLS_PATH/yui-2.4.7
	if [ ! -f "$EXTERNAL_SUBPATH/LICENSE" ]
	then
		__create_folder__ $EXTERNAL_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading YUI Compressor 2.4.7..."
		curl --insecure --location https://github.com/downloads/yui/yuicompressor/yuicompressor-2.4.7.zip > $EXTERNAL_SUBPATH/yuicompressor-2.4.7.zip
		
		echo ">> Uncompressing YUI Compressor 2.4.7..."
		unzip $EXTERNAL_SUBPATH/yuicompressor-2.4.7.zip yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar -d $TOOL_SUBPATH &&\
			mv $TOOL_SUBPATH/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar $TOOL_SUBPATH/yuicompressor-2.4.7.jar &&\
			rmdir $TOOL_SUBPATH/yuicompressor-2.4.7/build &&\
			rmdir $TOOL_SUBPATH/yuicompressor-2.4.7 &&\

		echo ">> Extracting YUI Compressor License..."
		unzip $EXTERNAL_SUBPATH/yuicompressor-2.4.7.zip yuicompressor-2.4.7/LICENSE.TXT -d $EXTERNAL_SUBPATH &&\
			mv $EXTERNAL_SUBPATH/yuicompressor-2.4.7/LICENSE.TXT $EXTERNAL_SUBPATH/LICENSE &&\
			rmdir $EXTERNAL_SUBPATH/yuicompressor-2.4.7
	fi
}


#------------------------------------------------------------------------------#
# Main setup script

function __run_setup__ {
	echo "This script downloads external tools used by Termite, and performs one-time setups."
	echo

	# Common folders
	__create_folder__ $EXTERNALS_PATH
	__create_folder__ $TOOLS_PATH
	__create_folder__ $MINIFIED_PATH
	__create_folder__ $MINIFIED_JS_PATH
	__create_folder__ $MINIFIED_CSS_PATH

	# Google closure compiler for Javascript
	__setup_closure__
	
	# YUI Compressor for CSS
	__setup_yui__

	# D3 Visualization Javascript Library
	__setup_d3__

	# jQuery Javascript Library
	__setup_jquery__

	# Underscore Javascript Library
	__setup_underscore__

	# Backbone Javascript Library
	__setup_backbone__

	# Chosen Javascript Library
#	__setup_chosen__

	# Font Awesome Library
	__setup_font_awesome__

	# Stanford Topic Modeling Toolkit
	__setup_stmt__

	# Mallet (topic modeling library)
	__setup_mallet__
	
	# Compile tree-TM
#	__setup_tree_tm__

	# Minify javascript and css files
	__minify_js__
	__minify_css__

	echo "Completed setup."
}

#------------------------------------------------------------------------------#
# Minify JS and CSS files

function __minify_js__ {
	__create_folder__ $MINIFIED_PATH/js
	echo ">> Minifying javascript files..."
	java -jar $TOOLS_PATH/closure/compiler.jar --js $JS_MINIFICATION_FILES --js_output_file $MINIFIED_PATH/js/termite.js
#	java -jar $TOOLS_PATH/closure/compiler.jar --js `ls $SOURCE_PATH/js/*.js | awk '{ ORS=" "; print; }'` --js_output_file $MINIFIED_PATH/js/Termite.js
}

function __minify_css__ {
	__create_folder__ $MINIFIED_PATH/css
	echo ">> Minifying cascade stylesheet files..."
	java -jar $TOOLS_PATH/yui-2.4.7/yuicompressor-2.4.7.jar -o $MINIFIED_PATH/css/termite.css $CSS_MINIFICATION_FILES
}

#------------------------------------------------------------------------------#

function __download_data__ {
	EXTERNAL_SUBPATH=$EXTERNALS_PATH/20newsgroups
	DATA_SUBPATH=$CORPUS_PATH/20newsgroups
	if [ ! -d "$DATA_SUBPATH" ]
	then
		__create_folder__ $CORPUS_PATH
		__create_folder__ $DATA_SUBPATH
		__create_folder__ $EXTERNAL_SUBPATH

		echo ">> Downloading the 20 newsgroup dataset..."
		curl --insecure --location http://qwone.com/~jason/20Newsgroups/20news-18828.tar.gz > $EXTERNAL_SUBPATH/20news-18828.tar.gz
		
		echo ">> Uncompressing the 20 newsgroup dataset..."
		tar -zxvf $EXTERNAL_SUBPATH/20news-18828.tar.gz 20news-18828 &&\
			mv 20news-18828/* $DATA_SUBPATH &&\
			rmdir 20news-18828
	fi
	
}

#------------------------------------------------------------------------------#

function __generate_documentations__ {
	JSDOC=node_modules/jsdoc/jsdoc
	OUTPUT=documentation

	if [ ! -f "$JSDOC" ]
	then
		echo "Installing jsdoc3 (requires 'npm')..."
		npm install git://github.com/jsdoc3/jsdoc.git
	fi

	echo "Generating documentations in '$OUTPUT/'..."
	$JSDOC client_src/js/termite --destination $OUTPUT
	echo "Generated documentations."
}

#------------------------------------------------------------------------------#

function __generate_tests__ {
	MOCHA=node_modules/mocha

	if [ ! -d "$MOCHA" ]
	then
		echo "Installing mocha..."
		npm install mocha

		echo "Installing require..."
		npm install require

		echo "Installing chai..."
		npm install chai

		echo "Installing d3..."
		npm install d3

		echo "Installing jquery..."
		npm install jquery

		echo "Installing underscore..."
		npm install underscore

		echo "Installing backbone..."
		npm install backbone
	fi
	
	echo "Executing javascript test cases..."
	$MOCHA/bin/mocha
	echo "Executed all test cases."
}

#------------------------------------------------------------------------------#

RUN_TOOLS=0
RUN_DATA=0
RUN_DOCS=0
RUN_TESTS=0
RUN_HELP=0
UNKNOWN_OPTION=

if [ $# -eq 0 ]
then
	RUN_TOOLS=1
fi
for ARG in "$@"
do
	if [ "$ARG" = "-h" ]
	then
		RUN_HELP=1
	elif [ "$ARG" = "--help" ]
	then
		RUN_HELP=1
	elif [ "$ARG" = "tools" ]
	then
		RUN_TOOLS=1
	elif [ "$ARG" = "data" ]
	then
		RUN_DATA=1
	elif [ "$ARG" = "docs" ]
	then
		RUN_DOCS=1
	elif [ "$ARG" = "tests" ]
	then
		RUN_TESTS=1
	else
		RUN_HELP=1
		UNKNOWN_OPTION=$ARG
	fi
done

if [ $RUN_HELP -eq 1 ]
then
	echo "Usage: `basename $0` [-h|--help] [tools] [data] [docs] [tests]"
	echo
	
	if [ ! -z $UNKNOWN_OPTION ]
	then
		echo "  Unknown option: $ARG"
		exit -1
	else
		echo "  tools [default]:"
		echo "    Download external tools used by Termite."
		echo "    Perform one-time setups including javascript minification."
		echo
		echo "  data:"
		echo "    Download the 20 Newsgroups dataset."
		echo
		echo "  docs (require npm; not officially supported):"
		echo "    Download JSDoc."
		echo "    Generate JSDoc documntation."
		echo
		echo "  tests (require npm; not officially supported):"
		echo "    Download Mocha and other utilities required by the test cases."
		echo "    Execuate all Mocha test cases."
		echo
		exit 0
	fi
else
	if [ $RUN_TOOLS -eq 1 ]
	then
		__run_setup__
		exit 0
	fi
	if [ $RUN_DATA -eq 1 ]
	then
		__download_data__
	fi
	if [ $RUN_DOCS -eq 1 ]
	then
		__generate_documentations__
		exit 0
	fi
	if [ $RUN_TESTS -eq 1 ]
	then
		__generate_tests__
		exit 0
	fi
fi
