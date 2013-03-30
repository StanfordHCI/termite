#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import ConfigParser
import logging

import time
from operator import itemgetter
from api_utils import SaliencyAPI, SimilarityAPI, SeriationAPI

class ComputeSeriation( object ):
	"""Seriation algorithm.

	Re-order words to improve promote the legibility of multi-word
	phrases and reveal the clustering of related terms.
	
	As output, the algorithm produces a list of seriated terms and its 'ranking'
	(i.e., the iteration in which a term was seriated).
	"""
	
	DEFAULT_NUM_SERIATED_TERMS = 100
	
	def __init__( self, logging_level ):
		self.logger = logging.getLogger( 'ComputeSeriation' )
		self.logger.setLevel( logging_level )
		handler = logging.StreamHandler( sys.stderr )
		handler.setLevel( logging_level )
		self.logger.addHandler( handler )
	
	def execute( self, data_path, numSeriatedTerms = None ):
		
		assert data_path is not None
		if numSeriatedTerms is None:
			numSeriatedTerms = ComputeSeriation.DEFAULT_NUM_SERIATED_TERMS
		
		self.logger.info( '--------------------------------------------------------------------------------' )
		self.logger.info( 'Computing term seriation...'                                                      )
		self.logger.info( '    data_path = %s', data_path                                                    )
		self.logger.info( '    number_of_seriated_terms = %d', numSeriatedTerms                              )
		
		self.logger.info( 'Connecting to data...' )
		self.saliency = SaliencyAPI( data_path )
		self.similarity = SimilarityAPI( data_path )
		self.seriation = SeriationAPI( data_path )
		
		self.logger.info( 'Reading data from disk...' )
		self.saliency.read()
		self.similarity.read()
		
		self.logger.info( 'Reshaping saliency data...' )
		self.reshape()
		
		self.logger.info( 'Computing seriation...' )
		self.compute( numSeriatedTerms )
		
		self.logger.info( 'Writing data to disk...' )
		self.seriation.write()
		
		self.logger.info( '--------------------------------------------------------------------------------' )
	
	def reshape( self ):
		self.candidateSize = 100
		self.orderedTermList = []
		self.termSaliency = {}
		self.termFreqs = {}
		self.termDistinct = {}
		self.termRank = {}
		self.termVisibility = {}
		for element in self.saliency.term_info:
			term = element['term']
			self.orderedTermList.append( term )
			self.termSaliency[term] = element['saliency']
			self.termFreqs[term] = element['frequency']
			self.termDistinct[term] = element['distinctiveness']
			self.termRank[term] = element['rank']
			self.termVisibility[term] = element['visibility']
	
	def compute( self, numSeriatedTerms ):
		# Elicit from user (1) the number of terms to output and (2) a list of terms that should be included in the output...
		# set in init (i.e. read from config file)
		
		# Seriate!
		start_time = time.time()
		candidateTerms = self.orderedTermList
		self.seriation.term_ordering = []
		self.seriation.term_iter_index = []
		self.buffers = [0,0]
		
		preBest = []
		postBest = []
		
		for iteration in range(numSeriatedTerms):
			print "Iteration no. ", iteration
			
			addedTerm = 0
			if len(self.seriation.term_iter_index) > 0:
				addedTerm = self.seriation.term_iter_index[-1]
			if iteration == 1:
				(preBest, postBest) = self.initBestEnergies(addedTerm, candidateTerms)
			(preBest, postBest, self.bestEnergies) = self.getBestEnergies(preBest, postBest, addedTerm)
			(candidateTerms, self.seriation.term_ordering, self.seriation.term_iter_index, self.buffers) = self.iterate_eff(candidateTerms, self.seriation.term_ordering, self.seriation.term_iter_index, self.buffers, self.bestEnergies, iteration)
			
			print "---------------"
		seriation_time = time.time() - start_time
		
		# Output consists of (1) a list of ordered terms, and (2) the iteration index in which a term was ordered
		#print "term_ordering: ", self.seriation.term_ordering
		#print "term_iter_index: ", self.seriation.term_iter_index   # Feel free to pick a less confusing variable name
		
		#print "similarity matrix generation time: ", compute_sim_time
		#print "seriation time: ", seriation_time
		self.logger.debug("seriation time: " +  str(seriation_time))

#-------------------------------------------------------------------------------#
# Helper Functions
	
	def initBestEnergies(self, firstTerm, candidateTerms):
		
		preBest = []
		postBest = []
		for candidate in candidateTerms:
			pre_score = 0
			post_score = 0
			
			# preBest
			if (candidate, firstTerm) in self.similarity.combined_g2:
				pre_score = self.similarity.combined_g2[(candidate, firstTerm)]
			# postBest
			if (firstTerm, candidate) in self.similarity.combined_g2:
				post_score = self.similarity.combined_g2[(firstTerm, candidate)]
			
			preBest.append((candidate, pre_score))
			postBest.append((candidate, post_score))
		
		return (preBest, postBest)
	
	def getBestEnergies(self, preBest, postBest, addedTerm):
		if addedTerm == 0:
			return (preBest, postBest, [])
		
		term_order = [x[0] for x in preBest]
		# compare candidate terms' bests against newly added term
		remove_index = -1
		for existingIndex in range(len(preBest)):
			term = term_order[existingIndex]
			if term == addedTerm:
				remove_index = existingIndex
			
			# check pre energies
			if (term, addedTerm) in self.similarity.combined_g2:
				if self.similarity.combined_g2[(term, addedTerm)] > preBest[existingIndex][1]:
					preBest[existingIndex] = (term, self.similarity.combined_g2[(term, addedTerm)])
			# check post energies
			if (addedTerm, term) in self.similarity.combined_g2:
				if self.similarity.combined_g2[(addedTerm, term)] > postBest[existingIndex][1]:
					postBest[existingIndex] = (term, self.similarity.combined_g2[(addedTerm, term)])
		
		# remove the added term's preBest and postBest scores
		if remove_index != -1:
			del preBest[remove_index]
			del postBest[remove_index]
		
		#create and sort the bestEnergies list
		energyMax = [sum(pair) for pair in zip([x[1] for x in preBest], [y[1] for y in postBest])]
		bestEnergies = zip([x[0] for x in preBest], energyMax)
		
		return (preBest, postBest, sorted(bestEnergies, key=itemgetter(1), reverse=True))
	
	def iterate_eff( self, candidateTerms, term_ordering, term_iter_index, buffers, bestEnergies, iteration_no ):
		maxEnergyChange = 0.0;
		maxTerm = "";
		maxPosition = 0;
		
		if len(bestEnergies) != 0:
			bestEnergy_terms = [x[0] for x in bestEnergies]
		else:
			bestEnergy_terms = candidateTerms
		
		breakout_counter = 0
		for candidate_index in range(len(bestEnergy_terms)):
			breakout_counter += 1
			candidate = bestEnergy_terms[candidate_index]
			for position in range(len(term_ordering)+1):
				current_buffer = buffers[position]
				candidateRank = self.termRank[candidate]
				if candidateRank <= (len(term_ordering) + self.candidateSize):
					current_energy_change = self.getEnergyChange(candidate, position, term_ordering, current_buffer, iteration_no)
					if current_energy_change > maxEnergyChange:
						maxEnergyChange = current_energy_change
						maxTerm = candidate
						maxPosition = position
			# check for early termination
			if candidate_index < len(bestEnergy_terms)-1 and len(bestEnergies) != 0:
				if maxEnergyChange >= (2*(bestEnergies[candidate_index][1] + current_buffer)):
					print "#-------- breaking out early ---------#"
					print "candidates checked: ", breakout_counter
					break;
		
		print "change in energy: ", maxEnergyChange
		print "maxTerm: ", maxTerm
		print "maxPosition: ", maxPosition
		
		candidateTerms.remove(maxTerm)
		
		# update buffers
		buf_score = 0
		if len(term_ordering) == 0:
			buffers = buffers
		elif maxPosition >= len(term_ordering):
			if (term_ordering[-1], maxTerm) in self.similarity.combined_g2:
				buf_score = self.similarity.combined_g2[(term_ordering[-1], maxTerm)]
			buffers.insert(len(buffers)-1, buf_score)
		elif maxPosition == 0:
			if (maxTerm, term_ordering[0]) in self.similarity.combined_g2:
				buf_score = self.similarity.combined_g2[(maxTerm, term_ordering[0])]
			buffers.insert(1, buf_score)
		else:
			if (term_ordering[maxPosition-1], maxTerm) in self.similarity.combined_g2:
				buf_score = self.similarity.combined_g2[(term_ordering[maxPosition-1], maxTerm)]
			buffers[maxPosition] = buf_score
			
			buf_score = 0
			if (maxTerm, term_ordering[maxPosition]) in self.similarity.combined_g2:
				buf_score = self.similarity.combined_g2[(maxTerm, term_ordering[maxPosition])]
			buffers.insert(maxPosition+1, buf_score)
		
		# update term ordering and ranking
		if maxPosition >= len(term_ordering):
			term_ordering.append(maxTerm)
		else:
			term_ordering.insert(maxPosition, maxTerm)
		term_iter_index.append(maxTerm)
			
		
		return (candidateTerms, term_ordering, term_iter_index, buffers)
	
	def getEnergyChange(self, candidateTerm, position, term_list, currentBuffer, iteration_no):
		prevBond = 0.0
		postBond = 0.0
		
		# first iteration only
		if iteration_no == 0:
			current_freq = 0.0
			current_saliency = 0.0
			
			if candidateTerm in self.termFreqs:
				current_freq = self.termFreqs[candidateTerm]
			if candidateTerm in self.termSaliency:
				current_saliency = self.termSaliency[candidateTerm]
			return 0.001 * current_freq * current_saliency
		
		# get previous term
		if position > 0:
			prev_term = term_list[position-1]
			if (prev_term, candidateTerm) in self.similarity.combined_g2:
				prevBond = self.similarity.combined_g2[(prev_term, candidateTerm)]
		
		# get next term
		if position < len(term_list):
			next_term = term_list[position]
			if (next_term, candidateTerm) in self.similarity.combined_g2:
				postBond = self.similarity.combined_g2[(candidateTerm, next_term)]
		
		return 2*(prevBond + postBond - currentBuffer)

#-------------------------------------------------------------------------------#

def main():
	parser = argparse.ArgumentParser( description = 'Compute term seriation for TermiteVis.' )
	parser.add_argument( 'config_file'               , type = str, default = None                   , help = 'Path of Termite configuration file.'      )
	parser.add_argument( '--data-path'               , type = str, dest = 'data_path'               , help = 'Override data path.'                      )
	parser.add_argument( '--number-of-seriated-terms', type = int, dest = 'number_of_seriated_terms', help = 'Override the number of terms to seriate.' )
	parser.add_argument( '--logging'                 , type = int, dest = 'logging'                 , help = 'Override logging level.'                  )
	args = parser.parse_args()
	
	data_path = None
	number_of_seriated_terms = None
	logging_level = 20
	
	# Read in default values from the configuration file
	if args.config_file is not None:
		config = ConfigParser.RawConfigParser()
		config.read( args.config_file )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'path' ):
			data_path = config.get( 'Termite', 'path' )
		if config.has_section( 'Termite' ) and config.has_option( 'Termite', 'number_of_seriated_terms' ):
			number_of_seriated_terms = config.getint( 'Termite', 'number_of_seriated_terms' )
		if config.has_section( 'Misc' ) and config.has_option( 'Misc', 'logging' ):
			logging_level = config.getint( 'Misc', 'logging' )
	
	# Read in user-specifiec values from the program arguments
	if args.data_path is not None:
		data_path = args.data_path
	if args.number_of_seriated_terms is not None:
		number_of_seriated_terms = args.number_of_seriated_terms
	if args.logging is not None:
		logging_level = args.logging
	
	ComputeSeriation( logging_level ).execute( data_path, number_of_seriated_terms )

if __name__ == '__main__':
	main()
