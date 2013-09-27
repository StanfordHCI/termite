# -*- coding: utf-8 -*-

from gluon.fileutils import listdir
import json

# Initialize databases
db = DAL( 'sqlite://visualizations.db' )
db.define_table( 'TermTopicMatrix',
	Field( 'id' ),
	Field( 'timestamp', notnull = True, required = True, type = 'datetime' ),
	Field( 'state'	  , notnull = True, required = True, type = 'text' ),
	Field( 'prevId'   , notnull = True, required = True, type = 'integer' )
)

def index():
	return response.render()

def info():
	return response.render()

@request.restful()
def data():
	response.view = 'generic.json'
	def GET( table ):
		if table == 'TermTopicMatrix' :
			path = 'applications/{}/databases'.format( request.application )
			terms = __ReadTerms( path )
			topics = __ReadTopics( path )
			matrix = __ReadTermTopicMatrix( path )
			if terms is not None and topics is not None and matrix is not None:
				return { 'terms' : terms, 'topics' : topics, 'matrix' : matrix }
		raise HTTP(400)
	return locals()

@request.restful()
def state():
	response.view = 'generic.json'
	def GET( table ):
		if table == 'TermTopicMatrix' :
			row = db( db.TermTopicMatrix ).select().sort( lambda row : -row.id ).first()
			if row is not None:
				state = json.loads( row.state, encoding = 'utf-8' )
				state[ 'stateId' ] = row.id
				return state
			return {}
		raise HTTP(400)
	def POST( table, **state ):
		if table == 'TermTopicMatrix' :
			if 'stateId' not in state:
				state[ 'stateId' ] = db( db.TermTopicMatrix ).count()
			prevId = state[ 'stateId' ]
			state[ 'stateId' ] = prevId + 1
			row = { 'timestamp' : request.now, 'state' : json.dumps( state, encoding = 'utf-8' ), 'prevId' : prevId }
			db.TermTopicMatrix.validate_and_insert( **row )
			return row
		raise HTTP(400)
	return locals()

def __ReadTerms( path ):
	filename = '{}/term-index.txt'.format( path )
	try:
		with open( filename ) as f:
			return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
	except IOError:
		return None

def __ReadTopics( path ):
	filename = '{}/topic-index.txt'.format( path )
	try:
		with open( filename ) as f:
			return [ line for line in f.read().decode( 'utf-8' ).splitlines() ]
	except IOError:
		return None

def __ReadTermTopicMatrix( path ):
	filename = '{}/term-topic-matrix.txt'.format( path )
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

def __ReadTermTopicEntries( path ):
	filename = '{}/term-topic-entries.txt'.format( path )
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
