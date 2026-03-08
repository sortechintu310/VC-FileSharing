export const getAuthCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,                 // ✅ HTTPS only in prod
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
};
