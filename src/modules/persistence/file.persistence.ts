import { FileCreateInput } from '@/modules/types';
import { PrismaClient, Prisma } from '@@/generated/prisma/client';
import { AppError, InternalError } from '@/shared/errors';

export class FilePersistence {
  constructor(private readonly prisma: PrismaClient) {
    //
  }

  async createFile(input: FileCreateInput) {
    try {
      return await this.prisma.file.create({
        data: input,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError();
      }
      throw new InternalError();
    }
  }
}
