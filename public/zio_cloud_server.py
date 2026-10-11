#!/usr/bin/env python3
"""
Zio-Cloud Server - Self-Hosted Cloud Storage Backend
=====================================================
A simple Python server that provides cloud storage functionality.
No external dependencies required - uses only Python standard library.

Usage:
    python zio_cloud_server.py [--port PORT] [--storage PATH]

Options:
    --port PORT      Port to run on (default: 5000)
    --storage PATH   Storage directory (default: ./zio_cloud_storage)
"""

import os
import sys
import json
import shutil
import argparse
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime


class ZioCloudHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for Zio-Cloud Storage Server"""

    def __init__(self, *args, storage_path=None, **kwargs):
        self.storage_path = storage_path
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        """Custom log format"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        sys.stderr.write(f"[{timestamp}] Zio-Cloud: {format % args}\n")

    def _set_cors_headers(self):
        """Set CORS headers for cross-origin requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error_json(self, message, status=400):
        """Send error JSON response"""
        self._send_json({'error': message}, status)

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == '/api/status':
            self._handle_status()
        elif path == '/api/files':
            self._handle_list_files(parsed)
        elif path.startswith('/api/download/'):
            self._handle_download(path)
        elif path == '/api/stats':
            self._handle_stats()
        else:
            self._send_error_json('Not found', 404)

    def do_POST(self):
        """Handle POST requests"""
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == '/api/upload':
            self._handle_upload()
        elif path.startswith('/api/mkdir'):
            self._handle_mkdir(parsed)
        else:
            self._send_error_json('Not found', 404)

    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path.startswith('/api/delete/'):
            self._handle_delete(path)
        else:
            self._send_error_json('Not found', 404)

    def _handle_status(self):
        """Return server status"""
        self._send_json({
            'status': 'online',
            'server': 'Zio-Cloud',
            'version': '1.0.0',
            'storage_path': self.storage_path,
            'timestamp': datetime.now().isoformat()
        })

    def _handle_list_files(self, parsed):
        """List files in a directory"""
        params = parse_qs(parsed.query)
        folder = params.get('folder', [''])[0]

        target = os.path.join(self.storage_path, folder)
        target = os.path.normpath(target)

        # Security check - prevent directory traversal
        if not target.startswith(os.path.normpath(self.storage_path)):
            self._send_error_json('Invalid path', 403)
            return

        if not os.path.exists(target):
            self._send_json({'files': [], 'folder': folder})
            return

        files = []
        try:
            for item in os.listdir(target):
                item_path = os.path.join(target, item)
                stat = os.stat(item_path)
                files.append({
                    'name': item,
                    'path': os.path.join(folder, item) if folder else item,
                    'is_dir': os.path.isdir(item_path),
                    'size': stat.st_size if not os.path.isdir(item_path) else 0,
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })
            # Sort: directories first, then by name
            files.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))
        except PermissionError:
            self._send_error_json('Permission denied', 403)
            return

        self._send_json({'files': files, 'folder': folder})

    def _handle_download(self, path):
        """Download a file"""
        file_path = path.replace('/api/download/', '', 1)
        full_path = os.path.join(self.storage_path, file_path)
        full_path = os.path.normpath(full_path)

        # Security check
        if not full_path.startswith(os.path.normpath(self.storage_path)):
            self._send_error_json('Invalid path', 403)
            return

        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self._send_error_json('File not found', 404)
            return

        mime_type, _ = mimetypes.guess_type(full_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'

        file_size = os.path.getsize(full_path)

        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-Type', mime_type)
        self.send_header('Content-Length', str(file_size))
        self.send_header('Content-Disposition', f'attachment; filename="{os.path.basename(full_path)}"')
        self.end_headers()

        with open(full_path, 'rb') as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def _handle_upload(self):
        """Handle file upload"""
        content_type = self.headers.get('Content-Type', '')

        if 'multipart/form-data' not in content_type:
            self._send_error_json('Expected multipart/form-data', 400)
            return

        # Parse the multipart form data
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        # Extract boundary
        boundary = content_type.split('boundary=')[1].strip()
        if boundary.startswith('"') and boundary.endswith('"'):
            boundary = boundary[1:-1]

        # Parse multipart data
        parts = body.split(f'--{boundary}'.encode())

        folder = ''
        file_data = None
        filename = None

        for part in parts:
            if not part or part.strip() == b'--':
                continue

            # Check for headers in this part
            if b'\r\n\r\n' in part:
                header_section, data = part.split(b'\r\n\r\n', 1)
                header_str = header_section.decode('utf-8', errors='ignore')

                if 'name="folder"' in header_str:
                    folder = data.decode('utf-8', errors='ignore').strip()
                elif 'name="file"' in header_str:
                    # Extract filename
                    for line in header_str.split('\r\n'):
                        if 'filename=' in line:
                            filename = line.split('filename=')[1].strip('"').strip("'")
                            break
                    file_data = data.rstrip(b'\r\n')

        if not filename or file_data is None:
            self._send_error_json('No file provided', 400)
            return

        # Create target directory
        target_dir = os.path.join(self.storage_path, folder) if folder else self.storage_path
        os.makedirs(target_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(target_dir, filename)
        file_path = os.path.normpath(file_path)

        # Security check
        if not file_path.startswith(os.path.normpath(self.storage_path)):
            self._send_error_json('Invalid path', 403)
            return

        with open(file_path, 'wb') as f:
            f.write(file_data)

        file_size = len(file_data)
        self._send_json({
            'success': True,
            'filename': filename,
            'size': file_size,
            'path': os.path.join(folder, filename) if folder else filename,
        })

    def _handle_mkdir(self, parsed):
        """Create a new directory"""
        params = parse_qs(parsed.query)
        folder = params.get('folder', [''])[0]
        name = params.get('name', [''])[0]

        if not name:
            self._send_error_json('Directory name required', 400)
            return

        target = os.path.join(self.storage_path, folder, name)
        target = os.path.normpath(target)

        # Security check
        if not target.startswith(os.path.normpath(self.storage_path)):
            self._send_error_json('Invalid path', 403)
            return

        try:
            os.makedirs(target, exist_ok=True)
            self._send_json({'success': True, 'path': os.path.join(folder, name)})
        except Exception as e:
            self._send_error_json(str(e), 500)

    def _handle_delete(self, path):
        """Delete a file or directory"""
        item_path = path.replace('/api/delete/', '', 1)
        full_path = os.path.join(self.storage_path, item_path)
        full_path = os.path.normpath(full_path)

        # Security check
        if not full_path.startswith(os.path.normpath(self.storage_path)):
            self._send_error_json('Invalid path', 403)
            return

        if full_path == os.path.normpath(self.storage_path):
            self._send_error_json('Cannot delete root storage', 403)
            return

        if not os.path.exists(full_path):
            self._send_error_json('Not found', 404)
            return

        try:
            if os.path.isdir(full_path):
                shutil.rmtree(full_path)
            else:
                os.remove(full_path)
            self._send_json({'success': True})
        except Exception as e:
            self._send_error_json(str(e), 500)

    def _handle_stats(self):
        """Get storage statistics"""
        total_size = 0
        file_count = 0
        dir_count = 0

        for root, dirs, files in os.walk(self.storage_path):
            total_size += sum(os.path.getsize(os.path.join(root, f)) for f in files)
            file_count += len(files)
            dir_count += len(dirs)

        # Get disk usage
        disk_usage = shutil.disk_usage(self.storage_path)

        self._send_json({
            'total_size': total_size,
            'file_count': file_count,
            'directory_count': dir_count,
            'disk_total': disk_usage.total,
            'disk_used': disk_usage.used,
            'disk_free': disk_usage.free,
        })


def run_server(port=5000, storage_path='./zio_cloud_storage'):
    """Start the Zio-Cloud server"""
    # Create storage directory if it doesn't exist
    os.makedirs(storage_path, exist_ok=True)

    # Create handler with storage path
    def handler(*args, **kwargs):
        return ZioCloudHandler(*args, storage_path=storage_path, **kwargs)

    server = HTTPServer(('0.0.0.0', port), handler)

    print(f"""
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   ☁️  Zio-Cloud Storage Server v1.0.0               ║
║                                                      ║
║   Server running at: http://localhost:{port:<5}         ║
║   Storage location:  {storage_path:<35}║
║                                                      ║
║   Press Ctrl+C to stop the server                    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
    """)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down Zio-Cloud server...")
        server.shutdown()
        print("Server stopped. Goodbye!")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Zio-Cloud Storage Server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run on (default: 5000)')
    parser.add_argument('--storage', type=str, default='./zio_cloud_storage', help='Storage directory (default: ./zio_cloud_storage)')
    args = parser.parse_args()

    run_server(port=args.port, storage_path=args.storage)
