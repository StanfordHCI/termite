#!/bin/bash

# Default source and target folders
SOURCE_PATH=client_source
TARGET_PATH=client_public

# Output folders
LIB_PATH=externals
TOOL_PATH=tools
JS_SOURCE_PATH=$SOURCE_PATH/lib
JS_TARGET_PATH=$TARGET_PATH/lib
CSS_SOURCE_PATH=$SOURCE_PATH/css
CSS_TARGET_PATH=$TARGET_PATH/css

# List of javascript files to minify (in subfolder "js")
JS_MINIFICATION_FILES=(TermTopicMatrixObject TermTopicMatrixVis)

# List of css files to minify (in subfolder "css")
CSS_MINIFICATION_FILES=(TermTopicMatrixVis)

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
	LIB_SUBPATH=$LIB_PATH/mallet-2.0.7
	TOOL_SUBPATH=$TOOL_PATH/mallet-2.0.7
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading MALLET (MAchine Learning for LanguagE Toolkit)..."
		curl --insecure --location http://mallet.cs.umass.edu/dist/mallet-2.0.7.tar.gz > $LIB_SUBPATH/mallet-2.0.7.tar.gz

		echo ">> Uncompressing MALLET..."
		tar -zxvf $LIB_SUBPATH/mallet-2.0.7.tar.gz mallet-2.0.7 &&\
			mv mallet-2.0.7/* $TOOL_SUBPATH &&\
			rmdir mallet-2.0.7

		echo ">> Extracting MALLET License..."
		cp $TOOL_SUBPATH/LICENSE $LIB_SUBPATH/LICENSE
	fi
}

#------------------------------------------------------------------------------#
# Stanford Topic Modeling Toolkit

function __setup_stmt__ {
	LIB_SUBPATH=$LIB_PATH/stmt-0.4.0
	TOOL_SUBPATH=$TOOL_PATH/stmt-0.4.0
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading STMT (Stanford Topic Modeling Toolkit)..."
		curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0-src.zip > $LIB_SUBPATH/tmt-0.4.0-src.zip
		curl --insecure --location http://nlp.stanford.edu/software/tmt/tmt-0.4/tmt-0.4.0.jar > $TOOL_SUBPATH/tmt-0.4.0.jar

		echo ">> Extracting STMT License..."
		unzip $LIB_SUBPATH/tmt-0.4.0-src.zip LICENSE -d $LIB_SUBPATH
	fi
}

#------------------------------------------------------------------------------#
# D3 Visualization Javascript Library

function __setup_d3__ {
	LIB_SUBPATH=$LIB_PATH/d3-v3
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading D3 javascript library..."
		curl --insecure --location http://d3js.org/d3.v3.zip > $LIB_SUBPATH/d3.v3.zip

		echo ">> Uncompressing D3 javascript library..."
		unzip $LIB_SUBPATH/d3.v3.zip d3.v3.js -d $JS_SOURCE_PATH &&\
			mv $JS_SOURCE_PATH/d3.v3.js $JS_SOURCE_PATH/d3.js
		unzip $LIB_SUBPATH/d3.v3.zip d3.v3.min.js -d $JS_TARGET_PATH &&\
			mv $JS_TARGET_PATH/d3.v3.min.js $JS_TARGET_PATH/d3.js

		echo ">> Extracting D3 license..."
		unzip $LIB_SUBPATH/d3.v3.zip LICENSE -d $LIB_SUBPATH
	fi
}

#------------------------------------------------------------------------------#
# Google closure compiler for Javascript

function __setup_closure__ {
	LIB_SUBPATH=$LIB_PATH/closure-latest
	TOOL_SUBPATH=$TOOL_PATH/closure
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH
		__create_folder__ $TOOL_SUBPATH

		echo ">> Downloading Google Closure Compiler..."
		curl --insecure --location http://closure-compiler.googlecode.com/files/compiler-latest.zip > $LIB_SUBPATH/compiler-latest.zip

		echo ">> Uncompressing Google Closure Compiler..."
		unzip $LIB_SUBPATH/compiler-latest.zip compiler.jar -d $TOOL_SUBPATH

		echo ">> Extracting Google Closure Compiler License..."
		unzip $LIB_SUBPATH/compiler-latest.zip COPYING -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/COPYING $LIB_SUBPATH/LICENSE
	fi
}

#------------------------------------------------------------------------------#
# Backbone Javascript Library

function __setup_backbone__ {
	LIB_SUBPATH=$LIB_PATH/backbone-latest
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading Backbone GitHub archive..."
		curl --insecure --location http://github.com/documentcloud/backbone/archive/master.zip > $LIB_SUBPATH/backbone.zip

		echo ">> Uncompressing Backbone javascript library..."
		unzip $LIB_SUBPATH/backbone.zip backbone-master/backbone.js -d $JS_SOURCE_PATH &&\
			mv $JS_SOURCE_PATH/backbone-master/backbone.js $JS_SOURCE_PATH/backbone.js &&\
			rmdir $JS_SOURCE_PATH/backbone-master
		unzip $LIB_SUBPATH/backbone.zip backbone-master/backbone-min.js -d $JS_TARGET_PATH &&\
			mv $JS_TARGET_PATH/backbone-master/backbone-min.js $JS_TARGET_PATH/backbone.js &&\
			rmdir $JS_TARGET_PATH/backbone-master
		
		echo "Extracting Backbone license..."
		unzip $LIB_SUBPATH/backbone.zip backbone-master/LICENSE -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/backbone-master/LICENSE $LIB_SUBPATH/LICENSE &&\
			rmdir $LIB_SUBPATH/backbone-master
	fi
}

#------------------------------------------------------------------------------#
# Underscore Javascript Library

function __setup_underscore__ {
	LIB_SUBPATH=$LIB_PATH/underscore-latest
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading Underscore GitHub archive..."
		curl --insecure --location http://github.com/documentcloud/underscore/archive/master.zip > $LIB_SUBPATH/underscore.zip

		echo ">> Uncompressing Underscore javascript library..."
		unzip $LIB_SUBPATH/underscore.zip underscore-master/underscore.js -d $JS_SOURCE_PATH &&\
			mv $JS_SOURCE_PATH/underscore-master/underscore.js $JS_SOURCE_PATH/underscore.js &&\
			rmdir $JS_SOURCE_PATH/underscore-master
		unzip $LIB_SUBPATH/underscore.zip underscore-master/underscore-min.js -d $JS_TARGET_PATH &&\
			mv $JS_TARGET_PATH/underscore-master/underscore-min.js $JS_TARGET_PATH/underscore.js &&\
			rmdir $JS_TARGET_PATH/underscore-master

		echo ">> Extracting Underscore license..."
		unzip $LIB_SUBPATH/underscore.zip underscore-master/LICENSE -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/underscore-master/LICENSE $LIB_SUBPATH/LICENSE &&\
			rmdir $LIB_SUBPATH/underscore-master
	fi
}

#------------------------------------------------------------------------------#
# jQuery Javascript Library

function __setup_jquery__ {
	LIB_SUBPATH=$LIB_PATH/jquery-1.9.1
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading jQuery javascript library..."
		curl --insecure --location http://code.jquery.com/jquery-1.9.1.js > $JS_SOURCE_PATH/jquery.js
		curl --insecure --location http://code.jquery.com/jquery-1.9.1.min.js > $JS_TARGET_PATH/jquery.js

		echo ">> Downloading jQuery GitHub archive..."
		curl --insecure --location http://github.com/jquery/jquery/archive/master.zip > $LIB_SUBPATH/jquery.zip

		echo ">> Extracting jQuery license..."
		unzip $LIB_SUBPATH/jquery.zip jquery-master/MIT-LICENSE.txt -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/jquery-master/MIT-LICENSE.txt $LIB_SUBPATH/LICENSE &&\
			rmdir $LIB_SUBPATH/jquery-master
	fi
}

#------------------------------------------------------------------------------#
# jQuery UI Javascript Library

function __setup_jquery_ui__ {
	LIB_SUBPATH=$LIB_PATH/jquery-ui-1.10.3
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading jQuery UI javascript library..."
		curl --insecure --location http://code.jquery.com/ui/1.10.3/jquery-ui.js > $JS_SOURCE_PATH/jquery-ui.js
		curl --insecure --location http://code.jquery.com/ui/1.10.3/jquery-ui.min.js > $JS_TARGET_PATH/jquery-ui.js

		echo ">> Downloading jQuery UI GitHub archive..."
		curl --insecure --location http://github.com/jquery/jquery-ui/archive/master.zip > $LIB_SUBPATH/jquery-ui.zip

		echo ">> Extracting jQuery UI license..."
		unzip $LIB_SUBPATH/jquery-ui.zip jquery-ui-master/MIT-LICENSE.txt -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/jquery-ui-master/MIT-LICENSE.txt $LIB_SUBPATH/LICENSE &&\
			rmdir $LIB_SUBPATH/jquery-ui-master
	fi
}

#------------------------------------------------------------------------------#
# Chosen Javascript Library

function __setup_chosen__ {
	LIB_SUBPATH=$LIB_PATH/chosen-0.11.1
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading Chosen GitHub archive..."
		curl --insecure --location http://chosen.getharvest.com.s3.amazonaws.com/chosen_v0.11.1.zip > $LIB_SUBPATH/chosen_v0.11.1.zip
		curl --insecure --location http://github.com/harvesthq/chosen/archive/master.zip > $LIB_SUBPATH/chosen-github.zip
	
		echo ">> Uncompressing Chosen javascript library..."
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen.jquery.js -d $JS_SOURCE_PATH
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen.jquery.min.js -d $JS_TARGET_PATH &&\
			mv $JS_TARGET_PATH/chosen.jquery.min.js $JS_TARGET_PATH/chosen.jquery.js
	
		echo ">> Uncompressing Chosen CSS resources..."
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen.css -d $CSS_SOURCE_PATH
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen.min.css -d $CSS_TARGET_PATH &&\
			mv $CSS_TARGET_PATH/chosen.min.css $CSS_TARGET_PATH/chosen.css
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen-sprite.png -d $CSS_SOURCE_PATH
		unzip $LIB_SUBPATH/chosen_v0.11.1.zip chosen-sprite.png -d $CSS_TARGET_PATH
	
		echo ">> Extracting Chosen license..."
		unzip $LIB_SUBPATH/chosen-github.zip chosen-master/LICENSE.md -d $LIB_SUBPATH &&\
			mv $LIB_SUBPATH/chosen-master/LICENSE.md $LIB_SUBPATH/LICENSE &&\
			rmdir $LIB_SUBPATH/chosen-master
	fi
}

#------------------------------------------------------------------------------#
# Slider for Firefox

function __setup_slider__ {
	LIB_SUBPATH=$LIB_PATH/html5slider
	if [ ! -f "$LIB_SUBPATH/LICENSE" ]
	then
		__create_folder__ $LIB_SUBPATH

		echo ">> Downloading html5slider GitHub archive..."
		curl --insecure --location http://github.com/fryn/html5slider/archive/master.zip > $LIB_SUBPATH/html5slider.zip

		echo ">> Uncompressing html5slider.js..."
		unzip $LIB_SUBPATH/html5slider.zip html5slider-master/html5slider.js -d $JS_SOURCE_PATH &&\
			mv $JS_SOURCE_PATH/html5slider-master/html5slider.js $JS_SOURCE_PATH/html5slider.js &&\
			rmdir $JS_SOURCE_PATH/html5slider-master

		echo ">> Minifying html5slider.js..."
		java -jar $TOOL_PATH/closure/compiler.jar --warning_level QUIET --js=$JS_SOURCE_PATH/html5slider.js --js_output_file=$JS_TARGET_PATH/html5slider.js
		
		echo ">> Downloading the MIT License..."
		curl --insecure --location http://opensource.org/licenses/MIT > $LIB_SUBPATH/LICENSE
	fi
}

#------------------------------------------------------------------------------#
# Main setup script

function __run_setup__ {
	echo "This script downloads external tools used by Termite, and performs one-time setups."
	echo

	# Common folders
	__create_folder__ $LIB_PATH
	__create_folder__ $TOOL_PATH
	__create_folder__ $TARGET_PATH
	__create_folder__ $JS_TARGET_PATH
	__create_folder__ $CSS_TARGET_PATH

	# Google closure compiler for Javascript
	__setup_closure__

	# D3 Visualization Javascript Library
	__setup_d3__

	# jQuery Javascript Library
	__setup_jquery__

	# jQuery UI Javascript Library
	__setup_jquery_ui__

	# Underscore Javascript Library
	__setup_underscore__

	# Backbone Javascript Library
	__setup_backbone__

	# Chosen Javascript Library
	__setup_chosen__

	# Slider for Firefox
	__setup_slider__

	# Stanford Topic Modeling Toolkit
	__setup_stmt__

	# Mallet (topic modeling library)
	__setup_mallet__

	# Minify javascript and css files
	__minify_js__
	__minify_css__

	echo "Completed setup."
}

#------------------------------------------------------------------------------#
# Minify JS and CSS files

function __minify_js__ {
	__create_folder__ $TARGET_PATH/js
	echo ">> Minifying javascript files..."
	for JS_FILE in ${JS_MINIFICATION_FILES[@]}
	do
		echo "    Minifying $JS_FILE.js"
		java -jar $TOOL_PATH/closure/compiler.jar --js=$SOURCE_PATH/js/$JS_FILE.js --js_output_file=$TARGET_PATH/js/$JS_FILE.js
	done
}

function __minify_css__ {
	__create_folder__ $TARGET_PATH/css
	echo ">> Minifying cascade stylesheet files..."
	for CSS_FILE in ${CSS_MINIFICATION_FILES[@]}
	do
		echo "    Copying $CSS_FILE.css"
		cp $SOURCE_PATH/css/$CSS_FILE.css $TARGET_PATH/css/$CSS_FILE.css
	done
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
	$JSDOC client_source/js --destination $OUTPUT
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
	echo "Usage: `basename $0` [-h|--help] [tools] [docs] [tests]"
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
		echo "  minify_only:"
		echo "    Perform javascript minification only; for development purposes."
		echo
		echo "  docs:"
		echo "    Download JSDoc."
		echo "    Generate JSDoc documntation."
		echo "    (require npm; not officially supported)"
		echo
		echo "  tests:"
		echo "    Download Mocha and other utilities required by the test cases."
		echo "    Execuate all Mocha test cases."
		echo "    (require npm; not officially supported)"
		exit 0
	fi
else
	if [ $RUN_TOOLS -eq 1 ]
	then
		__run_setup__
		exit 0
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
