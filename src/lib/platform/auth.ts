import { betterAuth } from 'better-auth';
import { prisma } from '@/lib/store/prisma';
import bcrypt from 'bcryptjs';

// Better Auth instance
export const auth = betterAuth({
  database: {
    provider: 'prisma',
    prisma,
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
