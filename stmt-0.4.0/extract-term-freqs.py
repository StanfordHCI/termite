#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse

parser = argparse.ArgumentParser( description = 'Generate label-term-distributions.csv from topic-term-distributions.csv.' )
parser.add_argument( 'path', type = str, help = 'Path of STMT model output' )
args = parser.parse_args()
path = args.path

lines = open( '{}/term-counts.csv'.format( path ) ).read().splitlines()
writer = open( '{}/term-freqs.txt'.format( path ), 'w' )
for line in lines :
	values = line.split( ',' )
	writer.write( '{}\t{}\n'.format( values[0], values[1] ) )
writer.close()
