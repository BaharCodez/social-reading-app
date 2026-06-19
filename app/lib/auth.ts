import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { credentialsSchema } from "@/app/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials sign-in requires JWT sessions (it can't persist a DB session).
  // Keep the signed session cookie for 30 days so logins persist.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  // Allow sign-in over the LAN IP / non-localhost hosts in dev.
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the environment.
    // `select_account` lets you pick an account without re-granting consent
    // every time, so repeat logins are one click.
    Google({
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    // Surface the user id on the session for the API layer.
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
