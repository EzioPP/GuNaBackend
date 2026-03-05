import { Prisma } from '@@/generated/prisma/client';
import { RemainingStorage } from '@/modules/types';
import {
  NotFoundError,
} from '@/shared/errors';

export class UserStoragePersistence {
  constructor(private prisma: Prisma.TransactionClient) {}

  async remainingStorage(userId: number): Promise<RemainingStorage> {
    const userStorage = await this.prisma.userStorage.findFirst({
      where: { user_id: userId },
    });

    if (!userStorage) {
      throw new NotFoundError('User Storage');
    }

    return {
      totalSpace: userStorage.total_space,
      usedSpace: userStorage.used_space,
      remainingSpace: userStorage.total_space - userStorage.used_space,
    };
  }

  async updateUsedStorage(userId: number, newUsedSpace: bigint) {
    const userStorage = await this.prisma.userStorage.findFirst({
      where: { user_id: userId },
    });

    if (!userStorage) {
      throw new NotFoundError('User Storage');
    }
    const updatedUserStorage = await this.prisma.userStorage.update({
      where: { id: userStorage.id },
      data: { used_space: newUsedSpace },
    });

    return updatedUserStorage;
  }
}
