#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import re

parser = argparse.ArgumentParser( description = 'Generate label-term-distributions.csv from topic-term-distributions.csv.' )
parser.add_argument( 'path', type = str, help = 'Path of STMT model output' )
args = parser.parse_args()
path = args.path

################################################################################

# Get topics
topics = []
f = '{}/final-iters/topic-index.txt'.format( path )
for line in open( f ).read().splitlines() :
	topics.append( line )

# Get labels (Skip BACKGROUND)
labels = []
f = '{}/final-iters/label-index.txt'.format( path )
for line in open( f ).read().splitlines() :
	if ( line != 'BACKGROUND' ) :
		labels.append( line )

################################################################################

# Match labels and topics
match = []
for i in range( len( topics ) ) :
	topic = topics[i]
	match.append( -1 )
	
	for j in range( len( labels ) ) :
		label = labels[j]
		m = re.match( r'{} \- \d+'.format( re.escape(label) ), topic )
		if m is not None:
			match[i] = j
	
	if ( match[i] == -1 ) :
		match[i] = len(labels)
		labels.append( "Topic{:02d}".format( len(labels)+1 ) )

#print labels
#print match

# Merge rows of TOPIC-term distributions
tally = []
for label in labels:
	tally.append( [] )

f = '{}/topic-term-distributions.csv'.format( path )
lines = open( f ).read().splitlines()
assert( len(lines) == len(topics) )
for i in range( len( topics ) ) :
	values = lines[i].split( ',' )
	for j in range( len( values ) ) :
		values[j] = float( values[j] )
	target = match[i]
	if ( len( tally[target] ) == 0 ) :
		tally[target] = values
	else :
		for j in range( len( values ) ) :
			tally[target][j] += values[j]

################################################################################

# Output topics
f = '{}/topic-index.txt'.format( path )
w = open( f, 'w' )
for topic in topics :
	w.write( topic + '\n' )
w.close()

# Output labels
f = '{}/label-index.txt'.format( path )
w = open( f, 'w' )
for label in labels :
	w.write( label + '\n' )
w.close()

# Output LABEL-term distributions
f = '{}/label-term-distributions.csv'.format( path )
w = open( f, 'w' )
for values in tally :
	for j in range( len( values ) ) :
		values[j] = str( values[j] )
	w.write( ','.join( values ) + '\n' )
w.close()

