import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 실제로는 데이터베이스와 연동하여 사용자 인증을 해야 합니다.
        // 여기서는 예시로 하드코딩된 사용자 정보를 사용합니다.
        const user = { id: "1", name: "Test User", email: "test@example.com" };

        if (credentials?.username === "test" && credentials?.password === "password") {
          return user;
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = { ...session.user, id: token.id as string };
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 