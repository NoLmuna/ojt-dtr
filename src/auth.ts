import NextAuth, { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encryptAES, decryptAES } from "@/lib/security";

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  jwt: {
    encode: async ({ token, secret }) => {
      // First, serialize the token normally (or just JSON stringify)
      // Then apply AES encryption
      return encryptAES(token);
    },
    decode: async ({ token, secret }) => {
      if (!token) return null;
      // Decrypt the AES payload
      const decrypted = decryptAES(token);
      return decrypted;
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
