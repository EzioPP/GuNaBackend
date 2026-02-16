import { FilePersistence } from '@/modules/persistence';
import { FileCreateInput, FileUploadResponse } from '@/modules/types';
import { UserStoragePersistence } from '@/modules/persistence';
import { ValidationError } from '@/shared/errors/HttpsErrors';

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

    console.log('Remaining storage:', remainingStorage.remainingSpace, 'File size:', fileSize);
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
}
