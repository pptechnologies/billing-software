export const authConfig = {
  accessTokenTtlSec: 15 * 60, // 15 min
  refreshTokenTtlDays: 30, // 30 days

  cookieName: "refresh_token",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth",
  },
};
 