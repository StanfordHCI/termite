#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import sys
import argparse
import logging
import ConfigParser
from api_utils import DocumentsAPI, TokensAPI

class Tokenize( object ):

	"""
	Takes in the input corpus doc and writes it out as a list of tokens.
	
	Currently, supports only single document corpus with one document per line of format:
		doc_id<tab>document_content
	(Two fields delimited by tab.)
	
	Support for multiple files, directory(ies), and Lucene considered for future releases.
	"""
	
	WHITESPACE_TOKENIZATION = r'[^ ]+'
	ALPHANUMERIC_TOKENIZATION = r'[0-9A-Za-z_]*[A-Za-z_]+[0-9A-Za-z_]*'
	ALPHA_TOKENIZATION = r'[A-Za-z_]+'
	UNICODE_TOKENIZATION = r'[\w]+'
	DEFAULT_TOKENIZATION = ALPHA_TOKENIZATION
	
	def __init__( self, logging_level ):
		self.logger = logging.getLogger( 'Tokenize' )
		self.logger.setLevel( logging_level )
		handler = logging.StreamHandler( sys.stderr )
		handler.setLevel( logging_level )
		self.logger.addHandler( handler )
	
	def execute( self, corpus_format, corpus_path, data_path, tokenization ):		
		assert corpus_format is not None
		assert corpus_path is not None
		assert data_path is not None
		if tokenization is None:
			tokenization = Tokenize.DEFAULT_TOKENIZATION
		elif tokenization == 'unicode':
			tokenization = Tokenize.UNICODE_TOKENIZATION
		elif tokenization == 'whitespace':
			tokenization = Tokenize.WHITESPACE_TOKENIZATION
		elif tokenization == 'alpha':
			tokenization = Tokenize.ALPHA_TOKENIZATION
		elif tokenization == 'alphanumeric':
			tokenization = Tokenize.ALPHANUMERIC_TOKENIZATION
	
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Tokenizing source corpus...'                                                      )
		self.logger.info( '    corpus_path = %s (%s)', corpus_path, corpus_format                            )
		self.logger.info( '    data_path = %s', data_path                                                    )
		self.logger.info( '    tokenization = %s', tokenization                                              )
		
		self.logger.info( 'Connecting to data...' )
		self.documents = DocumentsAPI( corpus_format, corpus_path )
		self.tokens = TokensAPI( data_path )
		
		self.logger.info( 'Reading from disk...' )
		self.documents.read()
		
		self.logger.info( 'Tokenizing...' )
		self.TokenizeDocuments( re.compile( tokenization, re.UNICODE ) )
		
		self.logger.info( 'Writing to disk...' )
		self.tokens.write()
		
		self.logger.info( '--------------------------------------------------------------------------------' )
	
	def TokenizeDocuments( self, tokenizer ):
		for docID, docContent in self.documents.data.iteritems():
			docTokens = self.TokenizeDocument( docContent, tokenizer )
			self.tokens.data[ docID ] = docTokens
	
	def TokenizeDocument( self, text, tokenizer ):
		tokens = []
		for token in re.findall( tokenizer, text ):
			tokens.append( token.lower() )
		return tokens

#-------------------------------------------------------------------------------#

def main():
	parser = argparse.ArgumentParser( description = 'Tokenize a document collection for Termite.' )
	parser.add_argument( 'config_file'    , type = str, default = None        , help = 'Path of Termite configuration file.'  )
	parser.add_argument( '--corpus-format', type = str, dest = 'corpus_format', help = 'Override corpus format.'              )
	parser.add_argument( '--corpus-path'  , type = str, dest = 'corpus_path'  , help = 'Override corpus path.'                )
	parser.add_argument( '--tokenization' , type = str, dest = 'tokenization' , help = 'Override tokenization regex pattern.' )
	parser.add_argument( '--data-path'    , type = str, dest = 'data_path'    , help = 'Override data path.'                  )
	parser.add_argument( '--logging'      , type = int, dest = 'logging'      , help = 'Override logging level.'              )
	args = parser.parse_args()
	
	# Declare parameters
	corpus_format = None
	corpus_path = None
	tokenization = None
	data_path = None
	logging_level = 20
	
	# Read in default values from the configuration file
	if args.config_file is not None:
		config = ConfigParser.RawConfigParser()
		config.read( args.config_file )
		if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'format' ):
			corpus_format = config.get( 'Corpus', 'format' )
		if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'path' ):
			corpus_path = config.get( 'Corpus', 'path' )
		if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'tokenization' ):
			tokenization = config.get( 'Corpus', 'tokenization' )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'path' ):
			data_path = config.get( 'Termite', 'path' )
		if config.has_section( 'Misc' ) and config.has_option( 'Misc', 'logging' ):
			logging_level = config.getint( 'Misc', 'logging' )
	
	# Read in user-specifiec values from the program arguments
	if args.corpus_format is not None:
		corpus_format = args.corpus_format
	if args.corpus_path is not None:
		corpus_path = args.corpus_path
	if args.tokenization is not None:
		tokenization = args.tokenization
	if args.data_path is not None:
		data_path = args.data_path
	if args.logging is not None:
		logging_level = args.logging
	
	Tokenize( logging_level ).execute( corpus_format, corpus_path, data_path, tokenization )

if __name__ == '__main__':
	main()
