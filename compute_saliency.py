#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import ConfigParser
import logging

import math
from api_utils import ModelAPI, SaliencyAPI

class ComputeSaliency( object ):
	"""
	Distinctiveness and saliency.
	
	Compute term distinctiveness and term saliency, based on
	the term probability distributions associated with a set of
	latent topics.
	
	Input is term-topic probability distribution, stored in 3 separate files:
	    'term-topic-matrix.txt' contains the entries of the matrix.
	    'term-index.txt' contains the terms corresponding to the rows of the matrix.
	    'topic-index.txt' contains the topic labels corresponding to the columns of the matrix.
	
	Output is a list of term distinctiveness and saliency values,
	in two duplicate formats, a tab-delimited file and a JSON object:
	    'term-info.txt'
	    'term-info.json'
	
	An auxiliary output is a list topic weights (i.e., the number of
	tokens in the corpus assigned to each latent topic) in two
	duplicate formats, a tab-delimited file and a JSON object:
	    'topic-info.txt'
	    'topic-info.json'
	"""
	
	def __init__( self, logging_level ):
		self.logger = logging.getLogger( 'ComputeSaliency' )
		self.logger.setLevel( logging_level )
		handler = logging.StreamHandler( sys.stderr )
		handler.setLevel( logging_level )
		self.logger.addHandler( handler )
	
	def execute( self, data_path ):
		
		assert data_path is not None
		
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Computing term saliency...'                                                       )
		self.logger.info( '    data_path = %s', data_path                                                    )
		
		self.logger.info( 'Connecting to data...' )
		self.model = ModelAPI( data_path )
		self.saliency = SaliencyAPI( data_path )
		
		self.logger.info( 'Reading data from disk...' )
		self.model.read()
		
		self.logger.info( 'Computing...' )
		self.computeTopicInfo()
		self.computeTermInfo()
		self.rankResults()
		
		self.logger.info( 'Writing data to disk...' )
		self.saliency.write()
		
		self.logger.info( '--------------------------------------------------------------------------------' )
	
	def computeTopicInfo( self ):
		topic_weights = [ sum(x) for x in zip( *self.model.term_topic_matrix ) ]
		topic_info = []
		for i in range(self.model.topic_count):
			topic_info.append( {
				'topic' : self.model.topic_index[i],
				'weight' : topic_weights[i]
			} )
		
		self.saliency.topic_info = topic_info
	
	def computeTermInfo( self ):
		"""Iterate over the list of terms. Compute frequency, distinctiveness, saliency."""
		
		topic_marginal = self.getNormalized( [ d['weight'] for d in self.saliency.topic_info ] )
		term_info = []
		for i in range(self.model.term_count):
			term = self.model.term_index[i]
			counts = self.model.term_topic_matrix[i]
			frequency = sum( counts )
			probs = self.getNormalized( counts )
			distinctiveness = self.getKLDivergence( probs, topic_marginal )
			saliency = frequency * distinctiveness
			term_info.append( {
				'term' : term,
				'saliency' : saliency,
				'frequency' : frequency,
				'distinctiveness' : distinctiveness,
				'rank' : None,
				'visibility' : 'default'
			} )
		self.saliency.term_info = term_info
	
	def getNormalized( self, counts ):
		"""Rescale a list of counts, so they represent a proper probability distribution."""
		tally = sum( counts )
		if tally == 0:
			probs = [ d for d in counts ]
		else:
			probs = [ d / tally for d in counts ]
		return probs
	
	def getKLDivergence( self, P, Q ):
		"""Compute KL-divergence from P to Q"""
		divergence = 0
		assert len(P) == len(Q)
		for i in range(len(P)):
			p = P[i]
			q = Q[i]
			assert p >= 0
			assert q >= 0
			if p > 0:
				divergence += p * math.log( p / q )
		return divergence
	
	def rankResults( self ):
		"""Sort topics by decreasing weight. Sort term frequencies by decreasing saliency."""
		self.saliency.topic_info = sorted( self.saliency.topic_info, key = lambda topic_weight : -topic_weight['weight'] )
		self.saliency.term_info = sorted( self.saliency.term_info, key = lambda term_freq : -term_freq['saliency'] )
		for i, element in enumerate( self.saliency.term_info ):
			element['rank'] = i

#-------------------------------------------------------------------------------#

def main():
	parser = argparse.ArgumentParser( description = 'Compute term saliency for TermiteVis.' )
	parser.add_argument( 'config_file', type = str, default = None    , help = 'Path of Termite configuration file.' )
	parser.add_argument( '--data-path', type = str, dest = 'data_path', help = 'Override data path.'                 )
	parser.add_argument( '--logging'  , type = int, dest = 'logging'  , help = 'Override logging level.'             )
	args = parser.parse_args()
	
	data_path = None
	logging_level = 20
	
	# Read in default values from the configuration file
	if args.config_file is not None:
		config = ConfigParser.RawConfigParser()
		config.read( args.config_file )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'path' ):
			data_path = config.get( 'Termite', 'path' )
		if config.has_section( 'Misc' ) and config.has_option( 'Misc', 'logging' ):
			logging_level = config.getint( 'Misc', 'logging' )
	
	# Read in user-specifiec values from the program arguments
	if args.data_path is not None:
		data_path = args.data_path
	if args.logging is not None:
		logging_level = args.logging
	
	ComputeSaliency( logging_level ).execute( data_path )

if __name__ == '__main__':
	main()
