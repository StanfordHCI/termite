#!/usr/bin/env python

import BaseHTTPServer
import CGIHTTPServer
import cgitb;

# Enable error reporting
cgitb.enable()

server = BaseHTTPServer.HTTPServer
handler = CGIHTTPServer.CGIHTTPRequestHandler
server_address = ( '', 8888 )
handler.cgi_directories = [ '/client_src/model', '/client_public/model' ]

print 'Web server is now running at http://localhost:8888'
print 'Press "Ctrl + C" to stop the web server.'
httpd = server( server_address, handler )
httpd.serve_forever()
