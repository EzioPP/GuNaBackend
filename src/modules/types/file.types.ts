export type File = {
  id: number;
  filename: string;
  path: string;
  createdAt: Date;
  size: number;
  is_public: boolean;
  user_id: number;
};

export type FileCreateInput = {
  filename: string;
  path: string;
  size: number;
  is_public: boolean;
  user_id: number;
};

export type FileUploadResponse = {
  id: number;
  filename: string;
  remainingStorage: number;
};

export type FileUpdateInput = {
  filename?: string;
  is_public?: boolean;
};

export type PaginatedFiles = {
  files: {
    id: number;
    filename: string;
    path: string;
    created_at: Date;
    size: number;
    is_public: boolean;
    user_id: number;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
