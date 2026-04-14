import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const admin = await prisma.admin.findUnique({ where: { email: credentials.email } });
        if (!admin) return null;
        const isValid = await bcrypt.compare(credentials.password, admin.password);
        if (!isValid) return null;
        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
  pages: { signIn: "/backoffice/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
