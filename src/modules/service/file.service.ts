import { FilePersistence } from '@/modules/persistence';
import { FileCreateInput, FileUploadResponse, FileUpdateInput, PaginatedFiles } from '@/modules/types';
import { UserStoragePersistence } from '@/modules/persistence';
import { ValidationError } from '@/shared/errors/HttpsErrors';
import { PrismaClient } from '@@/generated/prisma/client';
import fs from 'fs/promises';
import path from 'path';

export class FileService {
  constructor(
    private readonly filePersistence: FilePersistence,
    private readonly userStoragePersistence: UserStoragePersistence,
    private readonly prisma: PrismaClient,
  ) {
    //
  }
  
  async createFile(input: FileCreateInput): Promise<FileUploadResponse> {
    if (input.size < 0) {
      throw new ValidationError('File size must be a positive number');
    }

    const remainingStorage = await this.userStoragePersistence.remainingStorage(input.user_id);
    const fileSize = BigInt(input.size);
    if (remainingStorage.remainingSpace < fileSize) {
      throw new ValidationError('Insufficient storage space');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const txFilePersistence = new FilePersistence(tx);
      const txStoragePersistence = new UserStoragePersistence(tx);

      const uploadedFile = await txFilePersistence.createFile(input);
      const newUsedSpace = remainingStorage.usedSpace + fileSize;
      const updatedStorage = await txStoragePersistence.updateUsedStorage(
        input.user_id,
        newUsedSpace,
      );

      return { uploadedFile, updatedStorage };
    });

    const remainingSpace = result.updatedStorage.total_space - result.updatedStorage.used_space;
    const remainingSpaceInMB = Number(remainingSpace) / (1024 * 1024);
    return {
      id: result.uploadedFile.id,
      filename: result.uploadedFile.filename,
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

    await this.prisma.$transaction(async (tx) => {
      const txFilePersistence = new FilePersistence(tx);
      const txStoragePersistence = new UserStoragePersistence(tx);

      await txFilePersistence.deleteFile(fileId);

      const storage = await txStoragePersistence.remainingStorage(userId);
      const newUsed = storage.usedSpace - BigInt(file.size);
      await txStoragePersistence.updateUsedStorage(
        userId,
        newUsed < 0n ? 0n : newUsed,
      );
    });

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
