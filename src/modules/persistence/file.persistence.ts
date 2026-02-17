import { FileCreateInput, FileUpdateInput } from '@/modules/types';
import { PrismaClient, Prisma } from '@@/generated/prisma/client';
import { AppError, InternalError, NotFoundError } from '@/shared/errors';

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
  async getUserFiles(userId: number) {
    try {
      return await this.prisma.file.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError();
      }
      throw new InternalError();
    }
  }
  async getFileById(fileId: number) {
    try {
      return await this.prisma.file.findUnique({
        where: { id: fileId },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalError();
      }
      throw new InternalError();
    }
  }

  async deleteFile(fileId: number) {
    try {
      return await this.prisma.file.delete({
        where: { id: fileId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new NotFoundError('File');
      }
      if (error instanceof AppError) throw error;
      throw new InternalError();
    }
  }

  async updateFile(fileId: number, input: FileUpdateInput) {
    try {
      return await this.prisma.file.update({
        where: { id: fileId },
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new NotFoundError('File');
      }
      if (error instanceof AppError) throw error;
      throw new InternalError();
    }
  }

  async getUserFilesPaginated(userId: number, page: number, pageSize: number) {
    try {
      const [files, total] = await Promise.all([
        this.prisma.file.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.file.count({
          where: { user_id: userId },
        }),
      ]);
      return { files, total };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalError();
    }
  }
}
