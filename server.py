import http.server
import socketserver
import os

PORT = 8088

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Normalize and fallback any typos like /studio]html or /studio to /studio.html
        clean_path = self.path.split('?')[0].lower()
        if clean_path in ['/', '/studio', '/studio%5dhtml', '/studio]html', '/index']:
            self.path = '/studio.html'
        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🚀 Achuva 3D Studio Server running at http://0.0.0.0:{PORT}")
        httpd.serve_forever()
