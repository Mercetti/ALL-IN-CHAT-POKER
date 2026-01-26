#!/usr/bin/env python3
"""
Simple HTTP server for Helm Dashboard
Run this script and access http://localhost:8082
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8082
DIRECTORY = "public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers to allow requests from Helm server
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🛡️  Helm Dashboard Server")
        print(f"🚀 Starting server on http://localhost:{PORT}")
        print(f"📱 Mobile-ready dashboard available at: http://localhost:{PORT}/helm-dashboard.html")
        print(f"�️ Complete dashboard available at: http://localhost:{PORT}/helm-dashboard-complete.html")
        print(f"�🔄 Press Ctrl+C to stop the server")
        print()
        
        # Auto-open browser
        try:
            webbrowser.open(f'http://localhost:{PORT}/helm-dashboard.html')
            print(f"🌐 Opening dashboard in default browser...")
        except:
            print(f"⚠️  Could not auto-open browser. Please manually navigate to http://localhost:{PORT}/helm-dashboard.html")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped by user")
            httpd.shutdown()
