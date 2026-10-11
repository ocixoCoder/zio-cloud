import { FileItem } from '../types';

interface Props {
  files: FileItem[];
  loading: boolean;
  onNavigate: (folder: string) => void;
  onDelete: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  currentFolder: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(file: FileItem): string {
  if (file.is_dir) return '📁';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    pdf: '📄',
    doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📽️', pptx: '📽️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    mp4: '🎬', avi: '🎬', mkv: '🎬', mov: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '💻', ts: '💻', py: '💻', java: '💻', cpp: '💻', c: '💻', html: '💻', css: '💻',
    txt: '📃', md: '📃', log: '📃',
    exe: '⚙️', dmg: '⚙️', app: '⚙️',
  };
  return iconMap[ext] || '📄';
}

export default function FileGrid({ files, loading, onNavigate, onDelete, onDownload, currentFolder }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse border border-white/5">
            <div className="w-12 h-12 bg-white/10 rounded-xl mb-3" />
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📂</div>
        <h3 className="text-xl font-medium text-white mb-2">This folder is empty</h3>
        <p className="text-purple-300">Upload files or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.path}
          className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => file.is_dir && onNavigate(file.path)}
        >
          <div className="flex items-start justify-between">
            <div className="text-3xl mb-3">{getFileIcon(file)}</div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!file.is_dir && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                  className="p-1.5 bg-white/10 hover:bg-violet-500/30 rounded-lg transition-all"
                  title="Download"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                className="p-1.5 bg-white/10 hover:bg-red-500/30 rounded-lg transition-all"
                title="Delete"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>

          <h4 className="text-white font-medium text-sm truncate mb-1" title={file.name}>
            {file.name}
          </h4>
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>{file.is_dir ? 'Folder' : formatSize(file.size)}</span>
            <span>{formatDate(file.modified)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
