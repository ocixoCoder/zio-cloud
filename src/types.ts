export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string;
}

export interface ServerStats {
  total_size: number;
  file_count: number;
  directory_count: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
}
