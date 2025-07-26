#!/usr/bin/env python3
"""
Simple HTTP Server for Church Member Management Web App
Run this script to serve the web app locally for testing

Usage:
    python3 start-server.py          # Default port 8080
    python3 start-server.py 80       # Custom port (80 requires sudo)
    sudo python3 start-server.py 80  # Port 80 with admin privileges
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
DEFAULT_PORT = 8080
PREFERRED_PORT = 80  # Preferred port for direct localhost access
HTML_FILE = "index.html"

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        return local_ip
    except Exception:
        return "127.0.0.1"

def find_available_port(start_port=DEFAULT_PORT):
    """Find an available port starting from the given port"""
    port = start_port
    while port < start_port + 100:  # Try up to 100 ports
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            port += 1
    raise RuntimeError(f"No available ports found starting from {start_port}")

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve the HTML file for root requests
        if self.path == '/' or self.path == '':
            self.path = f'/{HTML_FILE}'
        return super().do_GET()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"📱 {self.client_address[0]} - {format % args}")

def main():
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if HTML file exists
    if not os.path.exists(HTML_FILE):
        print(f"❌ Error: {HTML_FILE} not found in current directory")
        print(f"📁 Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Check for command line port argument
    target_port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            target_port = int(sys.argv[1])
        except ValueError:
            print(f"❌ Error: Invalid port number '{sys.argv[1]}'")
            sys.exit(1)
    
    # Try preferred port 80 first, then fallback to specified port
    port_to_try = [PREFERRED_PORT] if target_port == DEFAULT_PORT else [target_port]
    if target_port != PREFERRED_PORT:
        port_to_try.append(target_port)
    
    port = None
    for try_port in port_to_try:
        try:
            # Test if port is available
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as test_socket:
                test_socket.bind(('', try_port))
                port = try_port
                break
        except OSError as e:
            if try_port == PREFERRED_PORT:
                print(f"⚠️  Port {PREFERRED_PORT} unavailable (may require sudo): {e}")
                print(f"🔄 Falling back to port {DEFAULT_PORT}")
            continue
    
    if port is None:
        print(f"❌ Error: No available ports found")
        if PREFERRED_PORT in port_to_try:
            print(f"💡 Try running: sudo python3 start-server.py {PREFERRED_PORT}")
        sys.exit(1)
    
    # Get network information
    local_ip = get_local_ip()
    
    # Create server
    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print("🚀 Church Member Management - Local Server")
            print("=" * 50)
            print(f"📁 Serving: {HTML_FILE}")
            print(f"🌐 Port: {port}")
            print()
            print("📱 Access URLs:")
            if port == 80:
                print(f"   Local:    http://localhost")
                print(f"   Network:  http://{local_ip}")
            else:
                print(f"   Local:    http://localhost:{port}")
                print(f"   Network:  http://{local_ip}:{port}")
            print()
            print("📋 Instructions:")
            print("   1. Open the URLs above in your browser")
            print("   2. For mobile testing, use the Network URL")
            print("   3. Make sure your devices are on the same WiFi network")
            print("   4. Press Ctrl+C to stop the server")
            if port != 80:
                print(f"   5. For direct localhost access, run: sudo python3 start-server.py 80")
            print()
            print("🔍 QR Code for Mobile Testing:")
            if port == 80:
                print(f"   Generate QR code for: http://{local_ip}")
            else:
                print(f"   Generate QR code for: http://{local_ip}:{port}")
            print()
            
            # Try to open browser automatically
            try:
                url = f"http://localhost:{port}" if port != 80 else "http://localhost"
                webbrowser.open(url)
                print("🌐 Browser opened automatically")
            except Exception:
                print("⚠️  Could not open browser automatically")
            
            print("\n🎯 Server is running... (Press Ctrl+C to stop)")
            print("-" * 50)
            
            # Start server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
