import { FilePersistence } from '@/modules/persistence';
import { FileCreateInput, FileUploadResponse, FileUpdateInput, PaginatedFiles } from '@/modules/types';
import { UserStoragePersistence } from '@/modules/persistence';
import { ValidationError } from '@/shared/errors/HttpsErrors';
import fs from 'fs/promises';
import path from 'path';

export class FileService {
  constructor(
    private readonly filePersistence: FilePersistence,
    private readonly userStoragePersistence: UserStoragePersistence,
  ) {
    //
  }
  
  async createFile(input: FileCreateInput): Promise<FileUploadResponse> {
    //has enough storage space?
    const remainingStorage = await this.userStoragePersistence.remainingStorage(input.user_id);
    if (input.size < 0) {
      throw new ValidationError('File size must be a positive number');
    }
    const fileSize = BigInt(input.size);
    if (remainingStorage.remainingSpace < fileSize) {
      throw new ValidationError('Insufficient storage space');
    }
    const uploadedFile = await this.filePersistence.createFile(input);
    const newUsedSpace = remainingStorage.usedSpace + fileSize;
    const updatedStorage = await this.userStoragePersistence.updateUsedStorage(
      input.user_id,
      newUsedSpace,
    );
    const remainingSpace = updatedStorage.total_space - updatedStorage.used_space;
    //convert bytes to mb
    const remainingSpaceInMB = Number(remainingSpace) / (1024 * 1024);
    return {
      id: uploadedFile.id,
      filename: uploadedFile.filename,
      remainingStorage: remainingSpaceInMB,
    };
  }
  async getStorageUsage(userId: number): Promise<{ usage: number, total: number }> {
    const storage = await this.userStoragePersistence.remainingStorage(userId);
    const usageInMB = Number(storage.usedSpace) / (1024 * 1024);
    const totalInMB = Number(storage.totalSpace) / (1024 * 1024);
    return { usage: usageInMB, total: totalInMB };
  }
  async getUserFiles(userId: number) {
    return this.filePersistence.getUserFiles(userId);
  }
  async getFileByIdUser(fileId: number, userId: number) {
    const file = await this.filePersistence.getFileById(fileId);
    if (!file) {
      throw new ValidationError('File not found');
    }
    if (file.user_id !== userId && !file.is_public) {
      throw new ValidationError('File does not belong to user');
    }
    return file;
  }

  async deleteFile(fileId: number, userId: number): Promise<void> {
    const file = await this.filePersistence.getFileById(fileId);
    if (!file) throw new ValidationError('File not found');
    if (file.user_id !== userId) throw new ValidationError('File does not belong to user');

    await this.filePersistence.deleteFile(fileId);

    const storage = await this.userStoragePersistence.remainingStorage(userId);
    const newUsed = storage.usedSpace - BigInt(file.size);
    await this.userStoragePersistence.updateUsedStorage(
      userId,
      newUsed < 0n ? 0n : newUsed,
    );

    try {
      const fullPath = path.join(process.cwd(), file.path);
      await fs.unlink(fullPath);
    } catch {
      // file may already be gone — ignore
    }
  }

  async updateFile(fileId: number, userId: number, input: FileUpdateInput) {
    const file = await this.filePersistence.getFileById(fileId);
    if (!file) throw new ValidationError('File not found');
    if (file.user_id !== userId) throw new ValidationError('File does not belong to user');

    return this.filePersistence.updateFile(fileId, input);
  }

  async getUserFilesPaginated(userId: number, page: number, pageSize: number): Promise<PaginatedFiles> {
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100;

    const { files, total } = await this.filePersistence.getUserFilesPaginated(userId, page, pageSize);
    return {
      files,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
