#!/usr/bin/env python
# -*- coding: UTF-8 -*-

import cgi
import json
from DataManager import DataManager

# Enable debugging
import cgitb
cgitb.enable()

def main():
	dataManager = DataManager()
	form = cgi.FieldStorage()
	
	dataID = form.getvalue( 'data' )
	if dataID is None:
		print "Content-Type: text/plain;charset=utf-8"
		print
		print "Error: Dataset identifier is not specified."
		return
	if not dataManager.HasDataset( dataID ):
		print "Content-Type: text/plain;charset=utf-8"
		print
		print "Error: Invalid dataset identifier ({}).".format( dataID )
		return
		
	content = dataManager.ListEntries( dataID )
	print "Content-Type: application/json;charset=utf-8"
	print
	print json.dumps( content, encoding = 'utf-8' )

if __name__ == '__main__':
	main()
