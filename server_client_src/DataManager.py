#!/usr/bin/env python

import glob
import os.path
import json

class DataManager:
	ROOT = 'data'

	def __ReadIndex( self, dataID ):
		filename = '{}/{}/index.json'.format( self.ROOT, dataID )
		try:
			with open( filename ) as f:
				return json.load( f, encoding = 'utf-8' )
		except IOError:
			return None
	
	def __ReadTerms( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/term-index.txt'.format( self.ROOT, dataID, entryID )
		try:
			with open( filename ) as f:
				return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
		except IOError:
			return None
	
	def __ReadTopics( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/topic-index.txt'.format( self.ROOT, dataID, entryID )
		try:
			with open( filename ) as f:
				return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
		except IOError:
			return None
	
	def __ReadTermTopicMatrix( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/term-topic-matrix.txt'.format( self.ROOT, dataID, entryID )
		try:
			entries = []
			with open( filename ) as f:
				for s, line in enumerate( f.read().decode( 'utf-8' ).splitlines() ):
					for t, field in enumerate( line.split( '\t' ) ):
						value = float(field)
						if value > 0.01:
							entries.append({
								'rowIndex' : s,
								'columnIndex' : t,
								'value' : value
							})
			return entries
		except IOError:
			return None

	def __ReadTermTopicEntries( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/term-topic-entries.txt'.format( self.ROOT, dataID, entryID )
		try:
			entries = []
			with open( filename ) as f:
				for line in f.read().decode( 'utf-8' ).splitlines():
					s, t, value = line.split( '\t' )
					s = int( s, 10 )
					t = int( t, 10 )
					value = float( value )
					if value > 0.01:
						entries.append({
							'rowIndex' : s,
							'columnIndex' : t,
							'value' : value
						})
			return entries
		except IOError:
			return None

	def __ReadStates( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/states.json'.format( self.ROOT, dataID, entryID )
		try:
			with open( filename ) as f:
				return json.load( f, encoding = 'utf-8' )
		except IOError:
			return None
	
	def __WriteStates( self, dataID, entryID, states ):
		filename = '{}/{}/entry-{:04d}/states.json'.format( self.ROOT, dataID, entryID )
		try:
			with open( filename, 'w' ) as f:
				json.dump( states, f, encoding = 'utf-8', indent = 2, sort_keys = True )
			with open( filename, 'r' ) as f:
				return json.load( f, encoding = 'utf-8' )
		except IOError:
			return None
	
	def ListDatasets( self ):
		results = {
			'dataIDs' : None
		}
		path = '{}/*'.format( self.ROOT )
		dataIDs = []
		for folder in glob.glob( path ):
			if os.path.isdir( folder ):
				dataID = folder[ len(path)-1 : ]
				dataIDs.append( dataID )
		results['dataIDs'] = dataIDs
		return results

	def HasDataset( self, dataID ):
		path = '{}/{}'.format( self.ROOT, dataID )
		return os.path.exists( path )

	def ListEntries( self, dataID ):
		results = {
			'dataID' : dataID,
			'entryIDs' : None
		}
		if not self.HasDataset( dataID ):
			return results
		index = self.__ReadIndex( dataID )
		results['entryIDs'] = index['entryIDs']
		return results

	def HasEntry( self, dataID, entryID ):
		index = self.__ReadIndex( dataID )
		if index is None:
			return False
		return entryID in index['entryIDs']

	def GetEntry( self, dataID, entryID ):
		results = {
			'dataID' : dataID,
			'entryID' : entryID,
			'terms' : None,
			'topics' : None,
			'entries' : None,
			'states' : None
		}
		if not self.HasDataset( dataID ):
			return results
		if not self.HasEntry( dataID, entryID ):
			return results
		results['terms'] = self.__ReadTerms( dataID, entryID )
		results['topics'] = self.__ReadTopics( dataID, entryID )
		results['matrix'] = self.__ReadTermTopicMatrix( dataID, entryID )
		if results['matrix'] is None:
			results['matrix'] = self.__ReadTermTopicEntries( dataID, entryID )
		results['states'] = self.__ReadStates( dataID, entryID )
		return results

	def SetEntry( self, dataID, entryID, request ):
		results = {
			'dataID' : dataID,
			'entryID' : entryID,
			'terms' : None,
			'topics' : None,
			'entries' : None,
			'states' : None
		}
		if not self.HasDataset( dataID ):
			return results
		if not self.HasEntry( dataID, entryID ):
			return results
		results['terms'] = self.__ReadTerms( dataID, entryID )
		results['topics'] = self.__ReadTopics( dataID, entryID )
		results['matrix'] = self.__ReadTermTopicMatrix( dataID, entryID )
		if results['matrix'] is None:
			results['matrix'] = self.__ReadTermTopicEntries( dataID, entryID )
		results['states'] = self.__WriteStates( dataID, entryID, request['states'] )
		return results
