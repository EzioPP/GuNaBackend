import { UserPersistence } from '../persistence';
import { AuthService } from '@/modules/service';
import { prisma } from '../persistence/prisma';

class AuthFactory {
  static create() {
    const userPersistence = new UserPersistence(prisma);
    return new AuthService(userPersistence);
  }
}

export const authFactory = AuthFactory.create();
