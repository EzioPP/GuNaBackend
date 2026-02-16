import { PrismaClient, Prisma } from '@@/generated/prisma/client';
import { UserCreateInput } from '@/modules/types';
import { NotFoundError, ConflictError, InternalError, AppError } from '@/shared/errors';

export class UserPersistence {
  constructor(private prisma: PrismaClient) {}

  async createUser(input: UserCreateInput) {
    try {
      return await this.prisma.user.create({
        data: input,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictError('Username already in use');
      }
      throw new InternalError();
    }
  }

  async getUserByUsername(username: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });
      if (!user) throw new NotFoundError('User');
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error; // deixa erros de domínio passar
      throw new InternalError();
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });
      if (!user) throw new NotFoundError('User');
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new InternalError();
    }
  }
}
