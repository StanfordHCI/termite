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

	entryID = form.getvalue( 'entry' )
	if entryID is None:
		print "Content-Type: text/plain;charset=utf-8"
		print
		print "Error: Entry identifier is not specified."
		return
	entryID = int( entryID, 10 )
	if not dataManager.HasEntry( dataID, entryID ):
		print "Content-Type: text/plain;charset=utf-8"
		print
		print "Error: Invalid entry identifier ({}/{}).".format( dataID, entryID )
		return
	
	content = form.getvalue( 'content' )
	if content is None:
		print "Content-Type: text/plain;charset=utf-8"
		print
		print "Error: Entry content is not provided."
		return

	response = dataManager.SetStates( dataID, entryID, content )
	print "Content-Type: application/json;charset=utf-8"
	print
	print json.dumps( response, encoding = 'utf-8' )

if __name__ == '__main__':
	main()
