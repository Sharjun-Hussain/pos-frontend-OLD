// pages/api/auth/[...nextauth].js (or app/api/auth/[...nextauth]/route.ts)
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/refresh`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok || refreshedTokens.status !== "success") {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.data.auth_token,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // Access tokens are 1h usually
      refreshToken: refreshedTokens.data.refresh_token ?? token.refreshToken, // Replace if new one is provided
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.NEXTAUTH_SESSION_MAX_AGE || "43200"),
    updateAge: parseInt(process.env.NEXTAUTH_SESSION_UPDATE_AGE || "3600"),
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

          const responseData = await res.json();
          if (!res.ok) {
            console.error("Login failed:", responseData.message || res.statusText);
            return null;
          }

          const user = responseData.data.user;

          const accessToken = responseData.data.auth_token;
          const refreshToken = responseData.data.refresh_token;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profile_image,
            accessToken,
            refreshToken,
          };
        } catch (error) {
          console.error("NextAuth authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
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

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      session.error = token.error;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };