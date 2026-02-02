// pages/api/auth/[...nextauth].js (or app/api/auth/[...nextauth]/route.ts)
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";


export const authOptions = {
  session: {
    // Use JWTs for sessions
    strategy: "jwt",

    // Set the session maxAge and updateAge from environment variables
    // This allows control over how long a session lasts and how often it refreshes.
    maxAge: parseInt(process.env.NEXTAUTH_SESSION_MAX_AGE || "3600"), // Default to 1 hour
    updateAge: parseInt(process.env.NEXTAUTH_SESSION_UPDATE_AGE || "0"), // Default to 0 (always update on interaction or as per default)
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`;
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.error("Login failed:", errorData.message || res.statusText);
            return null;
          }

          const responseData = await res.json();
          const user = responseData.data.user;
          const token = responseData.data.auth_token;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profile_image,
            accessToken: token,
          };
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],

  // 4. Configure Callbacks
  callbacks: {
    /**
     * @param  {object}  token     Decrypted JSON Web Token
     * @param  {object}  user      The object returned from the `authorize` function
     */
    async jwt({ token, user }) {
      // `user` is only available on the initial sign-in
      if (user) {
        token.accessToken = user.accessToken;
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.profileImage,
        };

        // Fetch permissions from /me endpoint
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/me`, {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              Accept: "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && data.data?.user) {
              const userData = data.data.user;

              // FLATTEN PERMISSIONS TO REDUCE JWT SIZE (Fixes 431 Error)
              const permissions = new Set();
              if (userData.roles) {
                userData.roles.forEach(role => {
                  if (role.permissions) {
                    role.permissions.forEach(p => permissions.add(p.name));
                  }
                });
              }

              token.user = {
                ...token.user,
                roles: (userData.roles || []).map(r => r.name),
                permissions: Array.from(permissions),
                organization_id: userData.organization_id,
                branches: userData.branches || [],
              };
            }
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
        }
      }
      return token;
    },

    /**
     * @param  {object}  session   Session object
     * @param  {object}  token     Decrypted JSON Web Token (from `jwt` callback)
     */
    async session({ session, token }) {
      // Pass the access token and user info to the client-side session
      session.accessToken = token.accessToken;
      session.user = token.user;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };