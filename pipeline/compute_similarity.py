#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import ConfigParser
import logging

import math
import itertools
from api_utils import TokensAPI, SimilarityAPI

class ComputeSimilarity( object ):
	"""
	Similarity measures.
	
	Compute term similarity based on co-occurrence and
	collocation likelihoods.
	"""
	
	DEFAULT_SLIDING_WINDOW_SIZE = 10
	MAX_FREQ = 100.0
	
	def __init__( self, logging_level ):
		self.logger = logging.getLogger( 'ComputeSimilarity' )
		self.logger.setLevel( logging_level )
		handler = logging.StreamHandler( sys.stderr )
		handler.setLevel( logging_level )
		self.logger.addHandler( handler )
	
	def execute( self, data_path, sliding_window_size = None ):
		
		assert data_path is not None
		if sliding_window_size is None:
			sliding_window_size = ComputeSimilarity.DEFAULT_SLIDING_WINDOW_SIZE
		
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Computing term similarity...'                                                     )
		self.logger.info( '    data_path = %s', data_path                                                    )
		self.logger.info( '    sliding_window_size = %d', sliding_window_size                                )
		
		self.logger.info( 'Connecting to data...' )
		self.tokens = TokensAPI( data_path )
		self.similarity = SimilarityAPI( data_path )
		
		self.logger.info( 'Reading data from disk...' )
		self.tokens.read()
		
		self.logger.info( 'Computing document co-occurrence...' )
		self.computeDocumentCooccurrence()
		
		self.logger.info( 'Computing sliding-window co-occurrence...' )
		self.computeSlidingWindowCooccurrence( sliding_window_size )
		
		self.logger.info( 'Counting total number of tokens, unigrams, and bigrams in the corpus...' )
		self.computeTokenCounts()
		
		self.logger.info( 'Computing document co-occurrence likelihood...' )
		self.similarity.document_g2 = self.getG2Stats( self.document_count, self.similarity.document_occurrence, self.similarity.document_cooccurrence )
		
		self.logger.info( 'Computing sliding-window co-occurrence likelihood...' )
		self.similarity.window_g2 = self.getG2Stats( self.window_count, self.similarity.window_occurrence, self.similarity.window_cooccurrence )
		
		self.logger.info( 'Computing collocation likelihood...' )
		self.similarity.collocation_g2 = self.getG2Stats( self.token_count, self.similarity.unigram_counts, self.similarity.bigram_counts )
		
		self.combineSimilarityMatrices()
		
		self.logger.info( 'Writing data to disk...' )
		self.similarity.write()
		
		self.logger.info( '--------------------------------------------------------------------------------' )
	
	def incrementCount( self, occurrence, key ):
		if key not in occurrence:
			occurrence[ key ] = 1
		else:
			occurrence[ key ] += 1
	
	def computeDocumentCooccurrence( self ):
		document_count = 0
		occurrence = {}
		cooccurrence = {}
		for docID, docTokens in self.tokens.data.iteritems():
			self.logger.debug( '    %s (%d tokens)', docID, len(docTokens) )
			tokenSet = frozenset(docTokens)
			document_count += 1
			for token in tokenSet:
				self.incrementCount( occurrence, token )
			for aToken in tokenSet:
				for bToken in tokenSet:
					if aToken < bToken:
						self.incrementCount( cooccurrence, (aToken, bToken) )
		
		self.document_count = document_count
		self.similarity.document_occurrence = occurrence
		self.similarity.document_cooccurrence = cooccurrence
	
	def computeSlidingWindowCooccurrence( self, sliding_window_size ):
		window_count = 0
		occurrence = {}
		cooccurrence = {}
		for docID, docTokens in self.tokens.data.iteritems():
			allWindowTokens = self.getSlidingWindowTokens( docTokens, sliding_window_size )
			self.logger.debug( '    %s (%d tokens, %d windows)', docID, len(docTokens), len(allWindowTokens) )
			for windowTokens in allWindowTokens:
				tokenSet = frozenset(windowTokens)
				window_count += 1
				for token in tokenSet:
					self.incrementCount( occurrence, token )
				for aToken in tokenSet:
					for bToken in tokenSet:
						if aToken < bToken:
							self.incrementCount( cooccurrence, (aToken, bToken) )
		
		self.window_count = window_count
		self.similarity.window_occurrence = occurrence
		self.similarity.window_cooccurrence = cooccurrence
	
	def getSlidingWindowTokens( self, tokens, sliding_window_size ):
		allWindows = []
		aIndex = 0 - sliding_window_size
		bIndex = len(tokens) + sliding_window_size
		for index in range( aIndex, bIndex ):
			a = max( 0           , index - sliding_window_size )
			b = min( len(tokens) , index + sliding_window_size )
			allWindows.append( tokens[a:b] )
		return allWindows
	
	def computeTokenCounts( self ):
		token_count = sum( len(docTokens) for docTokens in self.tokens.data.itervalues() )
		
		unigram_counts = {}
		for docTokens in self.tokens.data.itervalues():
			for token in docTokens:
				self.incrementCount( unigram_counts, token )
		
		bigram_counts = {}
		for docTokens in self.tokens.data.itervalues():
			prevToken = None
			for currToken in docTokens:
				if prevToken is not None:
					self.incrementCount( bigram_counts, (prevToken, currToken) )
				prevToken = currToken
		
		self.token_count = token_count
		self.similarity.unigram_counts = unigram_counts
		self.similarity.bigram_counts = bigram_counts
	
	def getBinomial( self, B_given_A, any_given_A, B_given_notA, any_given_notA ):
		assert B_given_A >= 0
		assert B_given_notA >= 0
		assert any_given_A >= B_given_A
		assert any_given_notA >= B_given_notA
		
		a = float( B_given_A )
		b = float( B_given_notA )
		c = float( any_given_A )
		d = float( any_given_notA )
		E1 = c * ( a + b ) / ( c + d )
		E2 = d * ( a + b ) / ( c + d )
		
		g2a = 0
		g2b = 0
		if a > 0:
			g2a = a * math.log( a / E1 )
		if b > 0:
			g2b = b * math.log( b / E2 )
		return 2 * ( g2a + g2b )
	
	def getG2( self, freq_all, freq_ab, freq_a, freq_b ):
		assert freq_all >= freq_a
		assert freq_all >= freq_b
		assert freq_a >= freq_ab
		assert freq_b >= freq_ab
		assert freq_all >= 0
		assert freq_ab >= 0
		assert freq_a >= 0
		assert freq_b >= 0
		
		B_given_A = freq_ab
		B_given_notA = freq_b - freq_ab
		any_given_A = freq_a
		any_given_notA = freq_all - freq_a
		
		return self.getBinomial( B_given_A, any_given_A, B_given_notA, any_given_notA )
	
	def getG2Stats( self, max_count, occurrence, cooccurrence ):
		g2_stats = {}
		freq_all = max_count
		for ( firstToken, secondToken ) in cooccurrence:
			freq_a = occurrence[ firstToken ]
			freq_b = occurrence[ secondToken ]
			freq_ab = cooccurrence[ (firstToken, secondToken) ]
			
			scale = ComputeSimilarity.MAX_FREQ / freq_all
			rescaled_freq_all = freq_all * scale
			rescaled_freq_a = freq_a * scale
			rescaled_freq_b = freq_b * scale
			rescaled_freq_ab = freq_ab * scale
			if rescaled_freq_a > 1.0 and rescaled_freq_b > 1.0:
				g2_stats[ (firstToken, secondToken) ] = self.getG2( freq_all, freq_ab, freq_a, freq_b )
		return g2_stats
	
	def combineSimilarityMatrices( self ):
		self.logger.info( 'Combining similarity matrices...' )
		self.similarity.combined_g2 = {}
		
		keys_queued = []
		for key in self.similarity.document_g2:
			( firstToken, secondToken ) = key
			otherKey = ( secondToken, firstToken )
			keys_queued.append( key )
			keys_queued.append( otherKey )
		for key in self.similarity.window_g2:
			( firstToken, secondToken ) = key
			otherKey = ( secondToken, firstToken )
			keys_queued.append( key )
			keys_queued.append( otherKey )
		for key in self.similarity.collocation_g2:
			keys_queued.append( key )
		
		keys_processed = {}
		for key in keys_queued:
			keys_processed[ key ] = False
		
		for key in keys_queued:
			if not keys_processed[ key ]:
				keys_processed[ key ] = True
				
				( firstToken, secondToken ) = key
				if firstToken < secondToken:
					orderedKey = key
				else:
					orderedKey = ( secondToken, firstToken )
				score = 0.0
				if orderedKey in self.similarity.document_g2:
					score += self.similarity.document_g2[ orderedKey ]
				if orderedKey in self.similarity.window_g2:
					score += self.similarity.window_g2[ orderedKey ]
				if key in self.similarity.collocation_g2:
					score += self.similarity.collocation_g2[ key ]
				if score > 0.0:
					self.similarity.combined_g2[ key ] = score

#-------------------------------------------------------------------------------#

def main():
	parser = argparse.ArgumentParser( description = 'Compute term similarity for TermiteVis.' )
	parser.add_argument( 'config_file'          , type = str, default = None              , help = 'Path of Termite configuration file.' )
	parser.add_argument( '--data-path'          , type = str, dest = 'data_path'          , help = 'Override data path.'                 )
	parser.add_argument( '--sliding-window-size', type = int, dest = 'sliding_window_size', help = 'Override sliding window size.'       )
	parser.add_argument( '--logging'            , type = int, dest = 'logging'            , help = 'Override logging level.'             )
	args = parser.parse_args()
	
	data_path = None
	sliding_window_size = None
	logging_level = 20
	
	# Read in default values from the configuration file
	if args.config_file is not None:
		config = ConfigParser.RawConfigParser()
		config.read( args.config_file )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'path' ):
			data_path = config.get( 'Termite', 'path' )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'sliding_window_size' ):
			sliding_window_size = config.get( 'Termite', 'sliding_window_size' )
		if config.has_section( 'Misc' ) and config.has_option( 'Misc', 'logging' ):
			logging_level = config.getint( 'Misc', 'logging' )
	
	# Read in user-specifiec values from the program arguments
	if args.data_path is not None:
		data_path = args.data_path
	if args.sliding_window_size is not None:
		sliding_window_size = args.sliding_window_size
	if args.logging is not None:
		logging_level = args.logging
	
	ComputeSimilarity( logging_level ).execute( data_path, sliding_window_size )

if __name__ == '__main__':
	main()
