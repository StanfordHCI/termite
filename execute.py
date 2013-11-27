#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import ConfigParser
import logging

import time
import os
from pipeline.tokenize import Tokenize
from pipeline.import_mallet import ImportMallet
from pipeline.import_stmt import ImportStmt
from pipeline.compute_saliency import ComputeSaliency
from pipeline.compute_similarity import ComputeSimilarity
from pipeline.compute_seriation import ComputeSeriation
from pipeline.prepare_data_for_client import PrepareDataForClient

class Execute( object ):

	"""
	Runs entire data processing pipeline and sets up client.
	
	Execute data processing scripts in order:
		1. tokenize.py:				Tokenize corpus
		2. train_stmt/mallet.py:	Train model
		3. compute_saliency.py:		Compute term saliency
		4. compute_similarity.py:	Compute term similarity
		5. compute_seriation.py:	Seriates terms
		6. prepare_data_for_client.py:	Generates datafiles for client
		7. prepare_vis_for_client.py:	Copies necessary scripts for client
	
	Input is configuration file specifying target corpus and destination directory.
	
	Creates multiple directories that store files from each stage of the pipeline. 
	Among the directories is the public_html directory that holds all client files.
	"""
	
	DEFAULT_NUM_TOPICS = 25
	
	def __init__( self, logging_level ):
		self.logger = logging.getLogger( 'Execute' )
		self.logger.setLevel( logging_level )
		handler = logging.StreamHandler( sys.stderr )
		handler.setLevel( logging_level )
		self.logger.addHandler( handler )
	
	def execute( self, corpus_format, corpus_path, tokenization, model_library, model_path, data_path, num_topics, number_of_seriated_terms ):
		
		assert corpus_format is not None
		assert corpus_path is not None
		assert model_library is not None
		assert model_library == 'stmt' or model_library == 'mallet'
		assert model_path is not None
		assert data_path is not None
		if num_topics is None:
			num_topics = Execute.DEFAULT_NUM_TOPICS
		assert number_of_seriated_terms is not None
		
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Tokenizing source corpus...'                                                      )
		self.logger.info( '    corpus_path = %s (%s)', corpus_path, corpus_format                            )
		self.logger.info( '    model_path = %s (%s)', model_path, model_library                              )
		self.logger.info( '    data_path = %s', data_path                                                    )
		self.logger.info( '    num_topics = %d', num_topics                                                  )
		self.logger.info( '    number_of_seriated_terms = %s', number_of_seriated_terms                      )
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )
		
		Tokenize( self.logger.level ).execute( corpus_format, corpus_path, data_path, tokenization )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )
		
		if model_library == 'stmt':
			command = 'pipeline/train_stmt.sh {} {} {}'.format( data_path + '/tokens/tokens.txt', model_path, num_topics )
			os.system( command )
			ImportStmt( self.logger.level ).execute( model_library, model_path, data_path )
		if model_library == 'mallet':
			command = 'pipeline/train_mallet.sh {} {} {}'.format( data_path + '/tokens/tokens.txt', model_path, num_topics )
			os.system( command )
			ImportMallet( self.logger.level ).execute( model_library, model_path, data_path )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )
		
		ComputeSaliency( self.logger.level ).execute( data_path )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )

		ComputeSimilarity( self.logger.level ).execute( data_path )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )

		ComputeSeriation( self.logger.level ).execute( data_path, number_of_seriated_terms )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )

		PrepareDataForClient( self.logger.level ).execute( data_path )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )
		
		command = 'pipeline/prepare_vis_for_client.sh {}'.format( data_path )
		os.system( command )
		self.logger.info( 'Current time = {}'.format( time.ctime() ) )

#-------------------------------------------------------------------------------#

def main():
	parser = argparse.ArgumentParser( description = 'Prepare data for Termite.' )
	parser.add_argument( 'config_file'    , type = str, help = 'Termite configuration file.' )
	parser.add_argument( '--corpus-format', type = str, dest = 'corpus_format', help = 'Override corpus format in the config file.' )
	parser.add_argument( '--corpus-path'  , type = str, dest = 'corpus_path'  , help = 'Override corpus path in the config file.' )
	parser.add_argument( '--model-library', type = str, dest = 'model_library', help = 'Override model library in the config file.' )
	parser.add_argument( '--model-path'   , type = str, dest = 'model_path'   , help = 'Override model path in the config file.' )
	parser.add_argument( '--num-topcis'   , type = int, dest = 'num_topics'   , help = 'Override number of topics in the config file.' )
	parser.add_argument( '--data-path'    , type = str, dest = 'data_path'    , help = 'Override data path in the config file.' )
	parser.add_argument( '--number-of-seriated-terms', type = int, dest = 'number_of_seriated_terms', help = 'Override the number of terms to seriate.' )
	parser.add_argument( '--logging'      , type = int, dest = 'logging'      , help = 'Override logging level specified in config file.' )
	args = parser.parse_args()
	
	corpus_format = None
	corpus_path = None
	model_library = None
	model_path = None
	data_path = None
	num_topics = None
	number_of_seriated_terms = None
	logging_level = 20
	
	# Read in default values from the configuration file
	config = ConfigParser.RawConfigParser()
	config.read( args.config_file )
	if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'format' ):
		corpus_format = config.get( 'Corpus', 'format' )
	if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'path' ):
		corpus_path = config.get( 'Corpus', 'path' )
	if config.has_section( 'Corpus' ) and config.has_option( 'Corpus', 'tokenization' ):
		tokenization = config.get( 'Corpus', 'tokenization' )
	if config.has_section( 'TopicModel' ) and config.has_option( 'TopicModel', 'library' ):
		model_library = config.get( 'TopicModel', 'library' )
	if config.has_section( 'TopicModel' ) and config.has_option( 'TopicModel', 'path' ):
		model_path = config.get( 'TopicModel', 'path' )
	if config.has_section( 'TopicModel' ) and config.has_option( 'TopicModel', 'num_topics' ):
		num_topics = config.getint( 'TopicModel', 'num_topics' )
	if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'path' ):
		data_path = config.get( 'Termite', 'path' )
	if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'number_of_seriated_terms' ):
		number_of_seriated_terms = config.getint( 'Termite', 'number_of_seriated_terms' )
	if config.has_section( 'Misc' ) and config.has_option( 'Misc', 'logging' ):
		logging_level = config.getint( 'Misc', 'logging' )
	
	# Read in user-specifiec values from the program arguments
	if args.corpus_format is not None:
		corpus_format = args.corpus_format
	if args.corpus_path is not None:
		corpus_path = args.corpus_path
	if args.model_library is not None:
		model_library = args.model_library
	if args.model_path is not None:
		model_path = args.model_path
	if args.num_topics is not None:
		num_topics = args.num_topics
	if args.data_path is not None:
		data_path = args.data_path
	if args.number_of_seriated_terms is not None:
		number_of_seriated_terms = args.number_of_seriated_terms
	if args.logging is not None:
		logging_level = args.logging
	
	Execute( logging_level ).execute( corpus_format, corpus_path, tokenization, model_library, model_path, data_path, num_topics, number_of_seriated_terms )

if __name__ == '__main__':
	main()
