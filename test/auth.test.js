import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionCookie,
  isAuthenticated,
  parseCookies,
  verifyPassword
} from "../src/auth.js";

test("verifyPassword accepts the configured password", () => {
  assert.equal(verifyPassword("xueyidabendan", "xueyidabendan"), true);
  assert.equal(verifyPassword("wrong-password", "xueyidabendan"), false);
});

test("parseCookies reads cookie header values", () => {
  const cookies = parseCookies("theme=light; resume_auth=abc123; other=value");

  assert.equal(cookies.theme, "light");
  assert.equal(cookies.resume_auth, "abc123");
  assert.equal(cookies.other, "value");
});

test("isAuthenticated requires the expected session token", () => {
  assert.equal(isAuthenticated("resume_auth=session-token", "session-token"), true);
  assert.equal(isAuthenticated("resume_auth=other-token", "session-token"), false);
});

test("buildSessionCookie creates an httpOnly same-site cookie", () => {
  const cookie = buildSessionCookie("session-token");

  assert.match(cookie, /resume_auth=session-token/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});
