#!/usr/bin/env python

import glob
import os.path

class DataManager:
	ROOT = 'data'
	
	def _ReadTerms_( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/term-index.txt'.format( self.ROOT, dataID, entryID )
		with open( filename ) as f:
			return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
	
	def _ReadTopics_( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/topic-index.txt'.format( self.ROOT, dataID, entryID )
		with open( filename ) as f:
			return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
	
	def _ReadTermTopicMatrix_( self, dataID, entryID ):
		filename = '{}/{}/entry-{:04d}/term-topic-matrix.txt'.format( self.ROOT, dataID, entryID )
		with open( filename ) as f:
			entries = []
			for s, line in enumerate( f.read().decode( 'utf-8' ).splitlines() ):
				for t, d in enumerate( line.split( '\t' ) ):
					value = float(d)
					if value > 0.01:
						entries.append({
							'rowIndex' : s,
							'columnIndex' : t,
							'value' : value
						})
			return entries
		
	def HasDataset( self, dataID ):
		path = '{}/{}'.format( self.ROOT, dataID )
		return os.path.exists( path )

	def HasEntry( self, dataID, entryID ):
		path = '{}/{}/entry-{:04d}'.format( self.ROOT, dataID, entryID )
		return os.path.exists( path )

	def ListDatasets( self ):
		path = '{}/*'.format( self.ROOT )
		dataIDs = []
		for folder in glob.glob( path ):
			if os.path.isdir( folder ):
				dataID = folder[ len(path)-1 : ]
				dataIDs.append( dataID )
		return {
			'dataIDs' : dataIDs
		}
		
	def ListEntries( self, dataID ):
		if not self.HasDataset( dataID ):
			return {
				'dataID' : dataID,
				'entryIDs' : None
			}
		path = '{}/{}/entry-*'.format( self.ROOT, dataID )
		entryIDs = []
		for folder in glob.glob( path ):
			if os.path.isdir( folder ):
				entryID = int( folder[ len(path)-1 : ], 10 )
				entryIDs.append( entryID )
		return {
			'dataID' : dataID,
			'entryIDs' : entryIDs
		}
	
	def GetEntry( self, dataID, entryID ):
		if not self.HasDataset( dataID ):
			return {
				'dataID' : dataID,
				'entryID' : None,
				'terms' : None,
				'topics' : None,
				'entries' : None,
				'states' : None
			}
		if not self.HasEntry( dataID, entryID ):
			return {
				'dataID' : dataID,
				'entryID' : entryID,
				'terms' : None,
				'topics' : None,
				'entries' : None,
				'states' : None
			}
		terms = self._ReadTerms_( dataID, entryID )
		topics = self._ReadTopics_( dataID, entryID )
		matrix = self._ReadTermTopicMatrix_( dataID, entryID )
		return {
			'dataID' : dataID,
			'entryID' : entryID,
			'terms' : terms,
			'topics' : topics,
			'entries' : matrix,
			'states' : {}
		}
