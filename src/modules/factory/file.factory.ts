import { prisma } from '@/modules/persistence/prisma';
import { FilePersistence, UserStoragePersistence } from '@/modules/persistence';
import { FileService } from '@/modules/service';

class FileFactory {
  static create() {
    const filePersistence = new FilePersistence(prisma);
    const userStoragePersistence = new UserStoragePersistence(prisma);
    return new FileService(filePersistence, userStoragePersistence);
  }
}

export const fileFactory = FileFactory.create();
