import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
});

export const { signIn, signUp, signOut, useSession } = authClient;
