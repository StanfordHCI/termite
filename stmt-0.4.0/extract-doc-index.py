#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse

parser = argparse.ArgumentParser( description = 'Generate doc-index.txt from document-topic-distributions.csv' )
parser.add_argument( 'path', type = str, help = 'Path of STMT model output' )
args = parser.parse_args()
path = args.path

lines = open( '{}/document-topic-distributions.csv'.format( path ) ).read().splitlines()
writer = open( '{}/doc-index.txt'.format( path ), 'w' )
for line in lines :
	values = line.split( ',' )
	writer.write( '{}\n'.format( values[0] ) )
writer.close()
