import { PrismaClient, Prisma } from '@@/generated/prisma/client';
import { UserCreateInput, RemainingStorage } from '@/modules/types';
import {
  NotFoundError,
  ConflictError,
  InternalError,
  AppError,
  ValidationError,
} from '@/shared/errors';

export class UserStoragePersistence {
  constructor(private prisma: PrismaClient) {}

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
