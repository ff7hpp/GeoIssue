import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import { authService } from "../modules/auth/auth.service.js";
import { authRepository } from "../modules/auth/auth.repository.js";
import { hashPassword, verifyPassword, generateToken, verifyToken } from "../shared/auth.utils.js";
import { initDb } from "../db/pool.js";
describe("Authentication & Cryptography", () => {
  beforeAll(async () => {
    await initDb();
  });
  it("should securely hash passwords and verify matching hashes", async () => {
    const password = "SecretPassword123!";
    const hash = await hashPassword(password);
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash).not.toContain(password);
    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);
    const isWrongMatch = await verifyPassword("WrongPassword", hash);
    expect(isWrongMatch).toBe(false);
  });
  it("should generate and verify signed JWT tokens", () => {
    const payload = {
      id: "a1000000-0000-0000-0000-000000000001",
      email: "resident@geoissue.local",
      role: "user"
    };
    const token = generateToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
    const verified = verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe("user");
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(verifyToken(tampered)).toBeNull();
    const expired = generateToken(payload, -1);
    expect(verifyToken(expired)).toBeNull();
  });
  it("should register a new citizen user and reject duplicate emails", async () => {
    const testEmail = `test_citizen_${Date.now()}@geoissue.local`;
    const result = await authService.register({
      email: testEmail,
      password: "StrongPassword123!",
      display_name: "Test Citizen User",
      language: "ar"
    });
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail.toLowerCase());
    expect(result.user.display_name).toBe("Test Citizen User");
    expect(result.user.language).toBe("ar");
    expect(result.token).toBeDefined();
    await expect(
      authService.register({
        email: testEmail,
        password: "AnotherPassword123!",
        display_name: "Duplicate Citizen"
      })
    ).rejects.toThrow("already exists");
  });
  it("should authenticate registered user with correct password and reject invalid password", async () => {
    const testEmail = `login_test_${Date.now()}@geoissue.local`;
    await authService.register({
      email: testEmail,
      password: "MyCorrectPassword123!",
      display_name: "Login Tester"
    });
    const loginResult = await authService.login({
      email: testEmail,
      password: "MyCorrectPassword123!"
    });
    expect(loginResult.user.email).toBe(testEmail.toLowerCase());
    expect(loginResult.token).toBeDefined();
    await expect(
      authService.login({
        email: testEmail,
        password: "WrongPassword!"
      })
    ).rejects.toThrow("Invalid email or password");
  });
  it("should upgrade a valid legacy PBKDF2 password hash after login", async () => {
    const password = "LegacyPassword123!";
    const salt = crypto.randomBytes(16).toString("hex");
    const key = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
    const email = `legacy_${Date.now()}@geoissue.local`;
    const user = await authRepository.create({
      email,
      password_hash: `${salt}:${key}`,
      display_name: "Legacy User",
      role: "user",
      language: "en"
    });

    await authService.login({ email, password });
    const upgraded = await authRepository.findById(user.id);
    expect(upgraded.password_hash.startsWith("scrypt$")).toBe(true);
  });
  it("should reject password login for legacy users without a password hash", async () => {
    await expect(
      authService.login({
        email: "citizen@geoissue.org",
        password: "Password123!"
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
