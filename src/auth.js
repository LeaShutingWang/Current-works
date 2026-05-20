const AUTH_COOKIE = "resume_auth";

export function verifyPassword(input, expectedPassword) {
  return String(input ?? "") === String(expectedPassword ?? "");
}

export function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return cookies;
      const key = decodeURIComponent(part.slice(0, separatorIndex));
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

export function isAuthenticated(cookieHeader, sessionToken) {
  const cookies = parseCookies(cookieHeader);
  return cookies[AUTH_COOKIE] === sessionToken;
}

export function buildSessionCookie(sessionToken) {
  return `${AUTH_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;
}
