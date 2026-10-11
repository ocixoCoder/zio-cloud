import { useState, useEffect, useCallback } from 'react';
import FileGrid from './FileGrid';
import UploadModal from './UploadModal';
import StorageStats from './StorageStats';
import { FileItem, ServerStats } from '../types';

interface Props {
  serverUrl: string;
  onDisconnect: () => void;
}

export default function Dashboard({ serverUrl, onDisconnect }: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = currentFolder ? `?folder=${encodeURIComponent(currentFolder)}` : '';
      const res = await fetch(`${serverUrl}/api/files${params}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      showNotification('Failed to fetch files', 'error');
    }
    setLoading(false);
  }, [serverUrl, currentFolder]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${serverUrl}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      // silently fail
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, [fetchFiles, fetchStats]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', currentFolder);

    try {
      const res = await fetch(`${serverUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`"${file.name}" uploaded successfully!`);
        fetchFiles();
        fetchStats();
      } else {
        showNotification(data.error || 'Upload failed', 'error');
      }
    } catch {
      showNotification('Upload failed - server unreachable', 'error');
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${serverUrl}/api/delete/${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`"${file.name}" deleted`);
        fetchFiles();
        fetchStats();
      } else {
        showNotification(data.error || 'Delete failed', 'error');
      }
    } catch {
      showNotification('Delete failed - server unreachable', 'error');
    }
  };

  const handleDownload = (file: FileItem) => {
    const url = `${serverUrl}/api/download/${encodeURIComponent(file.path)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleNavigate = (folder: string) => {
    setCurrentFolder(folder);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const params = new URLSearchParams({
        folder: currentFolder,
        name: newFolderName.trim(),
      });
      const res = await fetch(`${serverUrl}/api/mkdir?${params}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification(`Folder "${newFolderName}" created`);
        setNewFolderName('');
        setShowNewFolder(false);
        fetchFiles();
        fetchStats();
      } else {
        showNotification(data.error || 'Failed to create folder', 'error');
      }
    } catch {
      showNotification('Failed to create folder', 'error');
    }
  };

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const breadcrumbs = currentFolder ? currentFolder.split('/').filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border transition-all animate-slide-in ${
          notification.type === 'success'
            ? 'bg-green-500/20 border-green-500/30 text-green-200'
            : 'bg-red-500/20 border-red-500/30 text-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Zio-Cloud</h1>
              <p className="text-xs text-purple-300">Connected to {serverUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDisconnect}
              className="px-4 py-2 text-sm text-purple-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Stats */}
        {stats && <StorageStats stats={stats} />}

        {/* Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm">
              <button
                onClick={() => handleNavigate('')}
                className="px-2 py-1 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                🏠 Root
              </button>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-purple-500">/</span>
                  <button
                    onClick={() => handleNavigate(breadcrumbs.slice(0, i + 1).join('/'))}
                    className="px-2 py-1 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    {crumb}
                  </button>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500 w-48"
              />
            </div>

            <button
              onClick={() => setShowNewFolder(true)}
              className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              New Folder
            </button>

            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {/* File Grid */}
        <div className="mt-6">
          <FileGrid
            files={filteredFiles}
            loading={loading}
            onNavigate={handleNavigate}
            onDelete={handleDelete}
            onDownload={handleDownload}
            currentFolder={currentFolder}
          />
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Folder name"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                className="px-4 py-2 text-sm text-purple-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
