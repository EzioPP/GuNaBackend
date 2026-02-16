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
