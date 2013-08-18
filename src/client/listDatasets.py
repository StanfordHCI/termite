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
	
	content = dataManager.ListDatasets()

	print "Content-Type: application/json;charset=utf-8"
	print
	print json.dumps( content, encoding = 'utf-8' )

if __name__ == '__main__':
	main()
