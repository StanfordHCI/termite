#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import json
from io_utils import CheckAndMakeDirs
from io_utils import ReadAsList, ReadAsVector, ReadAsMatrix, ReadAsSparseVector, ReadAsSparseMatrix, ReadAsJson
from io_utils import WriteAsList, WriteAsVector, WriteAsMatrix, WriteAsSparseVector, WriteAsSparseMatrix, WriteAsJson, WriteAsTabDelimited
from utf8_utils import UnicodeReader, UnicodeWriter

class DocumentsAPI( object ):
	ACCEPTABLE_FORMATS = frozenset( [ 'file' ] )
	
	def __init__( self, format, path ):
		assert format in DocumentsAPI.ACCEPTABLE_FORMATS
		self.format = format
		self.path = path
		self.data = []
	
	def read( self ):
		self.data = {}
		filename = self.path
		with open( filename, 'r' ) as f:
			lines = f.read().decode( 'utf-8', 'ignore' ).splitlines()
			for line in lines:
				docID, docContent = line.split( '\t' )
				self.data[ docID ] = docContent

class TokensAPI( object ):
	SUBFOLDER = 'tokens'
	TOKENS = 'tokens.txt'
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, TokensAPI.SUBFOLDER )
		self.data = {}
	
	def read( self ):
		self.data = {}
		filename = self.path + TokensAPI.TOKENS
		with open( filename, 'r' ) as f:
			lines = UnicodeReader( f )
			for ( docID, docTokens ) in lines:
				self.data[ docID ] = docTokens.split( ' ' )
	
	def write( self ):
		CheckAndMakeDirs( self.path )
		filename = self.path + TokensAPI.TOKENS
		with open( filename, 'w' ) as f:
			writer = UnicodeWriter( f )
			for ( docID, docTokens ) in self.data.iteritems():
				writer.writerow( [ docID, ' '.join(docTokens) ] )

class ModelAPI( object ):
	SUBFOLDER = 'model'
	TOPIC_INDEX = 'topic-index.txt'
	TERM_INDEX = 'term-index.txt'
	TERM_TOPIC_MATRIX = 'term-topic-matrix.txt'
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, ModelAPI.SUBFOLDER )
		self.topic_index = []
		self.term_index = []
		self.topic_count = 0
		self.term_count = 0
		self.term_topic_matrix = []
	
	def read( self ):
		self.topic_index = ReadAsList( self.path + ModelAPI.TOPIC_INDEX )
		self.term_index = ReadAsList( self.path + ModelAPI.TERM_INDEX )
		self.term_topic_matrix = ReadAsMatrix( self.path + ModelAPI.TERM_TOPIC_MATRIX )
		self.verify()
	
	def verify( self ):
		self.topic_count = len( self.topic_index )
		self.term_count = len( self.term_index )
		
		assert self.term_count == len( self.term_topic_matrix )
		for row in self.term_topic_matrix:
			assert self.topic_count == len(row)
	
	def write( self ):
		self.verify()
		CheckAndMakeDirs( self.path )
		WriteAsList( self.topic_index, self.path + ModelAPI.TOPIC_INDEX )
		WriteAsList( self.term_index, self.path + ModelAPI.TERM_INDEX )
		WriteAsMatrix( self.term_topic_matrix, self.path + ModelAPI.TERM_TOPIC_MATRIX )

class SaliencyAPI( object ):
	SUBFOLDER = 'saliency'
	TOPIC_WEIGHTS = 'topic-info.json'
	TOPIC_WEIGHTS_TXT = 'topic-info.txt'
	TOPIC_WEIGHTS_FIELDS = [ 'term', 'saliency', 'frequency', 'distinctiveness', 'rank', 'visibility' ]
	TERM_SALIENCY = 'term-info.json'
	TERM_SALIENCY_TXT = 'term-info.txt'
	TERM_SALIENCY_FIELDS = [ 'topic', 'weight' ]
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, SaliencyAPI.SUBFOLDER )
		self.term_info = {}
		self.topic_info = {}
	
	def read( self ):
		self.term_info = ReadAsJson( self.path + SaliencyAPI.TERM_SALIENCY )
		self.topic_info = ReadAsJson( self.path + SaliencyAPI.TOPIC_WEIGHTS )
	
	def write( self ):
		CheckAndMakeDirs( self.path )
		WriteAsJson( self.term_info, self.path + SaliencyAPI.TERM_SALIENCY )
		WriteAsTabDelimited( self.term_info, self.path + SaliencyAPI.TERM_SALIENCY_TXT, SaliencyAPI.TOPIC_WEIGHTS_FIELDS )
		WriteAsJson( self.topic_info, self.path + SaliencyAPI.TOPIC_WEIGHTS )
		WriteAsTabDelimited( self.topic_info, self.path + SaliencyAPI.TOPIC_WEIGHTS_TXT, SaliencyAPI.TERM_SALIENCY_FIELDS )

class SimilarityAPI( object ):
	SUBFOLDER = 'similarity'
	DOCUMENT_OCCURRENCE = 'document-occurrence.txt'
	DOCUMENT_COOCCURRENCE = 'document-cooccurrence.txt'
	WINDOW_OCCURRENCE = 'window-occurrence.txt'
	WINDOW_COOCCURRENCE = 'window-cooccurrence.txt'
	UNIGRAM_COUNTS = 'unigram-counts.txt'
	BIGRAM_COUNTS = 'bigram-counts.txt'
	DOCUMENT_G2 = 'document-g2.txt'
	WINDOW_G2 = 'window-g2.txt'
	COLLOCATAPIN_G2 = 'collocation-g2.txt'
	COMBINED_G2 = 'combined-g2.txt'
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, SimilarityAPI.SUBFOLDER )
		self.document_occurrence = {}
		self.document_cooccurrence = {}
		self.window_occurrence = {}
		self.window_cooccurrence = {}
		self.unigram_counts = {}
		self.bigram_counts = {}
		self.document_g2 = {}
		self.window_g2 = {}
		self.collcation_g2 = {}
		self.combined_g2 = {}
	
	def read( self ):
#		self.document_occurrence = ReadAsSparseVector( self.path + SimilarityAPI.DOCUMENT_OCCURRENCE )
#		self.document_cooccurrence = ReadAsSparseMatrix( self.path + SimilarityAPI.DOCUMENT_COOCCURRENCE )
#		self.window_occurrence = ReadAsSparseVector( self.path + SimilarityAPI.WINDOW_OCCURRENCE )
#		self.window_cooccurrence = ReadAsSparseMatrix( self.path + SimilarityAPI.WINDOW_COOCCURRENCE )
#		self.unigram_counts = ReadAsSparseVector( self.path + SimilarityAPI.UNIGRAM_COUNTS )
#		self.bigram_counts = ReadAsSparseMatrix( self.path + SimilarityAPI.BIGRAM_COUNTS )
#		self.document_g2 = ReadAsSparseMatrix( self.path + SimilarityAPI.DOCUMENT_G2 )
#		self.window_g2 = ReadAsSparseMatrix( self.path + SimilarityAPI.WINDOW_G2 )
#		self.collocation_g2 = ReadAsSparseMatrix( self.path + SimilarityAPI.COLLOCATAPIN_G2 )
		self.combined_g2 = ReadAsSparseMatrix( self.path + SimilarityAPI.COMBINED_G2 )
	
	def write( self ):
		CheckAndMakeDirs( self.path )
#		WriteAsSparseVector( self.document_occurrence, self.path + SimilarityAPI.DOCUMENT_OCCURRENCE )
#		WriteAsSparseMatrix( self.document_cooccurrence, self.path + SimilarityAPI.DOCUMENT_COOCCURRENCE )
#		WriteAsSparseVector( self.window_occurrence, self.path + SimilarityAPI.WINDOW_OCCURRENCE )
#		WriteAsSparseMatrix( self.window_cooccurrence, self.path + SimilarityAPI.WINDOW_COOCCURRENCE )
#		WriteAsSparseVector( self.unigram_counts, self.path + SimilarityAPI.UNIGRAM_COUNTS )
#		WriteAsSparseMatrix( self.bigram_counts, self.path + SimilarityAPI.BIGRAM_COUNTS )
#		WriteAsSparseMatrix( self.document_g2, self.path + SimilarityAPI.DOCUMENT_G2 )
#		WriteAsSparseMatrix( self.window_g2, self.path + SimilarityAPI.WINDOW_G2 )
#		WriteAsSparseMatrix( self.collocation_g2, self.path + SimilarityAPI.COLLOCATAPIN_G2 )
		WriteAsSparseMatrix( self.combined_g2, self.path + SimilarityAPI.COMBINED_G2 )

class SeriationAPI( object ):
	SUBFOLDER = 'seriation'
	TERM_ORDERING = 'term-ordering.txt'
	TERM_ITER_INDEX = 'term-iter-index.txt'
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, SeriationAPI.SUBFOLDER )
		self.term_ordering = []
		self.term_iter_index = []
	
	def read( self ):
		self.term_ordering = ReadAsList( self.path + SeriationAPI.TERM_ORDERING )
		self.term_iter_index = ReadAsList( self.path + SeriationAPI.TERM_ITER_INDEX )
	
	def write( self ):
		CheckAndMakeDirs( self.path )
		WriteAsList( self.term_ordering, self.path + SeriationAPI.TERM_ORDERING )
		WriteAsList( self.term_iter_index, self.path + SeriationAPI.TERM_ITER_INDEX )

class ClientAPI( object ):
	SUBFOLDER = 'public_html/data'
	SERIATED_PARAMETERS = 'seriated-parameters.json'
	FILTERED_PARAMETERS = 'filtered-parameters.json'
	GLOBAL_TERM_FREQS = 'global-term-freqs.json'
	
	def __init__( self, path ):
		self.path = '{}/{}/'.format( path, ClientAPI.SUBFOLDER )
		self.seriated_parameters = {}
		self.filtered_parameters = {}
		self.global_term_freqs = {}
	
	def read( self ):
		self.seriated_parameters = ReadAsJson( self.path + ClientAPI.SERIATED_PARAMETERS )
		self.filtered_parameters = ReadAsJson( self.path + ClientAPI.FILTERED_PARAMETERS )
		self.global_term_freqs = ReadAsJson( self.path + ClientAPI.GLOBAL_TERM_FREQS )
	
	def write( self ):
		CheckAndMakeDirs( self.path )
		WriteAsJson( self.seriated_parameters, self.path + ClientAPI.SERIATED_PARAMETERS )
		WriteAsJson( self.filtered_parameters, self.path + ClientAPI.FILTERED_PARAMETERS )
		WriteAsJson( self.global_term_freqs, self.path + ClientAPI.GLOBAL_TERM_FREQS )
