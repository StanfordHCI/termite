#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
from utf8_utils import UnicodeReader, UnicodeWriter

def CheckAndMakeDirs( path ):
	if not os.path.exists( path ):
		os.makedirs( path )

def ReadAsList( filename ):
	"""
	Return a list of values.
	Each value corresponds to a line of the input file.
	"""
	data = []
	with open( filename, 'r' ) as f:
		lines = f.read().decode( 'utf-8' ).splitlines()
		for line in lines:
			data.append( line )
	return data

def ReadAsVector( filename ):
	vector = []
	with open( filename, 'r' ) as f:
		lines = f.read().decode( 'utf-8' ).splitlines()
		for line in lines:
			vector.append( float( line ) )
	return vector

def ReadAsMatrix( filename ):
	matrix = []
	with open( filename, 'r' ) as f:
		lines = UnicodeReader( f )
		for line in lines:
			matrix.append( map( float, line ) )
	return matrix

def ReadAsSparseVector( filename ):
	vector = {}
	with open( filename, 'r' ) as f:
		lines = UnicodeReader( f )
		for ( key, value ) in lines:
			vector[ key ] = float( value )
	return vector

def ReadAsSparseMatrix( filename ):
	matrix = {}
	with open( filename, 'r' ) as f:
		lines = UnicodeReader( f )
		for ( aKey, bKey, value ) in lines:
			matrix[ (aKey, bKey) ] = float( value )
	return matrix

def ReadAsJson( filename ):
	"""
	Expect a dict of values.
	Write dict as-is to disk as a JSON object.
	"""
	data = None
	with open( filename, 'r' ) as f:
		data = json.load( f, encoding = 'utf-8' )
	return data

def WriteAsList( data, filename ):
	with open( filename, 'w' ) as f:
		for element in data:
			f.write( element.encode( 'utf-8' ) + '\n' )

def WriteAsVector( vector, filename ):
	with open( filename, 'w' ) as f:
		for element in vector:
			f.write( str( vector ) + '\n' )

def WriteAsMatrix( matrix, filename ):
	with open( filename, 'w' ) as f:
		writer = UnicodeWriter( f )
		for row in matrix:
			writer.writerow( map( str, row ) )

def WriteAsSparseVector( vector, filename ):
	"""
	Expect a sparse vector (dict) of values.
	Generate a tab-delimited file, with 2 columns.
	Write key as the 1st column; write cell value as the 2nd column.
	"""
	sortedKeys = sorted( vector.keys(), key = lambda key : -vector[key] )
	with open( filename, 'w' ) as f:
		writer = UnicodeWriter( f )
		for key in sortedKeys:
			writer.writerow( [ key, str( vector[key] ) ] )

def WriteAsSparseMatrix( matrix, filename ):
	"""
	Expect a sparse matrix (two-level dict) of values.
	Generate a tab-delimited file, with 3 columns.
	Write two keys as the 1st and 2nd columns; write cell value as the 3rd column.
	"""
	sortedKeys = sorted( matrix.keys(), key = lambda key : -matrix[key] )
	with open( filename, 'w' ) as f:
		writer = UnicodeWriter( f )
		for ( aKey, bKey ) in sortedKeys:
			writer.writerow( [ aKey, bKey, str( matrix[ (aKey, bKey) ] ) ] )

def WriteAsJson( data, filename ):
	"""
	Expect a dict of values.
	Write dict as-is to disk as a JSON object.
	"""
	with open( filename, 'w' ) as f:
		json.dump( data, f, encoding = 'utf-8', indent = 2, sort_keys = True )

def WriteAsTabDelimited( data, filename, fields ):
	"""
	Expect a list of dict values.
	Take in a list of output fields.
	Write specified fields to disk, as a tab-delimited file (with header row).
	"""
	with open( filename, 'w' ) as f:
		writer = UnicodeWriter( f )
		writer.writerow( fields )
		for element in data:
			values = []
			for field in fields:
				if not type( element[field] ) is unicode:
					values.append( str( element[field] ) )
				else:
					values.append( element[field] )
			writer.writerow( values )
