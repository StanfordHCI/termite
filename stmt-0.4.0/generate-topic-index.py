#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse

parser = argparse.ArgumentParser( description = 'Generate topic-index.txt' )
parser.add_argument( 'path', type = str, help = 'Path of STMT model output' )
parser.add_argument( 'topicCount', type = int, help = 'Number of topics' )
args = parser.parse_args()
path = args.path
topicCount = args.topicCount

f = "{}/topic-index.txt".format( path )
w = open( f, 'w' )
for i in range( topicCount ) :
	w.write( 'Topic {}\n'.format( i+1 ) )
w.close()
