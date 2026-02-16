import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { UnauthorizedError } from '@/shared/errors';
import { UserPersistence } from '@/modules/persistence';

export class AuthService {
  constructor(private userPersistence: UserPersistence) {
    //
  }

  async login(username: string, password: string): Promise<{ token: string }> {
    const user = await this.userPersistence.getUserByUsername(username);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedError('Invalid credentials');

    const token = await new SignJWT({ userId: user.id, permission: user.permission })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    return { token };
  }
}
