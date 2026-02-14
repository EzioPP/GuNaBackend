import { PrismaClient } from '@@/generated/prisma/client';

export class PrismaLogin {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByUsername(username: string) {
    return this.prisma.login.findUnique({
      where: { username },
    });
  }
}
