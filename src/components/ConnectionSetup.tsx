import { useState } from 'react';

interface Props {
  onConnect: (url: string) => void;
}

export default function ConnectionSetup({ onConnect }: Props) {
  const [url, setUrl] = useState('http://localhost:5000');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showScript, setShowScript] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch(`${url}/api/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        onConnect(url);
      } else {
        setError('Server responded but returned an error. Make sure Zio-Cloud server is running.');
      }
    } catch {
      setError('Cannot connect to server. Make sure the Python server is running at this URL.');
    }
    setConnecting(false);
  };

  const downloadScript = () => {
    const pythonScript = getPythonScript();
    const blob = new Blob([pythonScript], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'zio_cloud_server.py';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-purple-500/30 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Zio-Cloud</h1>
          <p className="text-purple-300 text-lg">Your Personal Self-Hosted Cloud Storage</p>
        </div>

        {/* Connection Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Connect to Your Server</h2>
          <p className="text-purple-200 text-sm mb-6">
            Enter the URL of your running Zio-Cloud Python server. No browser cache or local storage is used — all files are stored on your hosted server.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Server URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="http://localhost:5000"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            How to Set Up Your Storage Server
          </h3>
          <ol className="text-purple-200 text-sm space-y-2 list-decimal list-inside">
            <li>Download the Python server script below</li>
            <li>Make sure you have Python 3.7+ installed</li>
            <li>Run: <code className="bg-white/10 px-2 py-0.5 rounded text-violet-300">python zio_cloud_server.py</code></li>
            <li>The server starts on port 5000 by default</li>
            <li>Connect this app to your server URL above</li>
          </ol>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadScript}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Server Script
            </button>
            <button
              onClick={() => setShowScript(!showScript)}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              {showScript ? 'Hide' : 'View'} Script
            </button>
          </div>

          {showScript && (
            <div className="mt-4 bg-black/40 rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
              <pre className="text-xs text-green-300 font-mono whitespace-pre">{getPythonScript()}</pre>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="text-white font-medium text-sm">Private & Secure</h4>
            <p className="text-purple-300 text-xs mt-1">Your files stay on your own server</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl mb-2">💾</div>
            <h4 className="text-white font-medium text-sm">No Browser Cache</h4>
            <p className="text-purple-300 text-xs mt-1">Never uses browser storage</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 text-center">
            <div className="text-2xl mb-2">🌐</div>
            <h4 className="text-white font-medium text-sm">Remote Access</h4>
            <p className="text-purple-300 text-xs mt-1">Upload from anywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPythonScript(): string {
  return `#!/usr/bin/env python3
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
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime
import cgi
import io

class ZioCloudHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for Zio-Cloud Storage Server"""

    def __init__(self, *args, storage_path=None, **kwargs):
        self.storage_path = storage_path
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        """Custom log format"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        sys.stderr.write(f"[{timestamp}] Zio-Cloud: {format % args}\\n")

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
            if b'\\r\\n\\r\\n' in part:
                header_section, data = part.split(b'\\r\\n\\r\\n', 1)
                header_str = header_section.decode('utf-8', errors='ignore')

                if 'name="folder"' in header_str:
                    folder = data.decode('utf-8', errors='ignore').strip()
                elif 'name="file"' in header_str:
                    # Extract filename
                    for line in header_str.split('\\r\\n'):
                        if 'filename=' in line:
                            filename = line.split('filename=')[1].strip('"').strip("'")
                            break
                    file_data = data.rstrip(b'\\r\\n')

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
        print("\\n\\nShutting down Zio-Cloud server...")
        server.shutdown()
        print("Server stopped. Goodbye!")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Zio-Cloud Storage Server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run on (default: 5000)')
    parser.add_argument('--storage', type=str, default='./zio_cloud_storage', help='Storage directory (default: ./zio_cloud_storage)')
    args = parser.parse_args()

    run_server(port=args.port, storage_path=args.storage)
`;
}
