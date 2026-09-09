import { authRepository } from "./auth.repository.js";
import {
  generateToken,
  hashPassword,
  needsPasswordRehash,
  verifyPassword
} from "../../shared/auth.utils.js";
import { AppError } from "../../shared/errors.js";
const authService = {
  async register(data) {
    const existing = await authRepository.findByEmail(data.email);
    if (existing) {
      throw AppError.conflict("An account with this email address already exists");
    }
    const password_hash = await hashPassword(data.password);
    const user = await authRepository.create({
      email: data.email,
      password_hash,
      display_name: data.display_name,
      language: data.language || "en",
      role: "user"
    });
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    const { password_hash: _, auth_uid: __, ...safeUser } = user;
    return { user: safeUser, token };
  },
  async login(data) {
    const user = await authRepository.findByEmail(data.email);
    if (!user || !user.password_hash) {
      await hashPassword(data.password);
      throw AppError.unauthenticated("Invalid email or password");
    }
    const isValid = await verifyPassword(data.password, user.password_hash);
    if (!isValid) {
      throw AppError.unauthenticated("Invalid email or password");
    }
    if (user.account_status === "suspended") {
      throw AppError.forbidden("Your account has been suspended. Please contact support.");
    }
    if (user.account_status !== "active") {
      throw AppError.forbidden("Your account is not active. Please contact support.");
    }
    if (needsPasswordRehash(user.password_hash)) {
      await authRepository.updateProfile(user.id, {
        password_hash: await hashPassword(data.password)
      });
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    const { password_hash: _, auth_uid: __, ...safeUser } = user;
    return { user: safeUser, token };
  },
  async getMe(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    const { password_hash: _, auth_uid: __, ...safeUser } = user;
    return safeUser;
  },
  async updateProfile(userId, data) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    let password_hash;
    if (data.new_password) {
      if (user.password_hash) {
        if (!data.current_password) {
          throw AppError.badRequest("Current password is required to set a new password");
        }
        const isValid = await verifyPassword(data.current_password, user.password_hash);
        if (!isValid) {
          throw AppError.badRequest("Current password does not match");
        }
      }
      password_hash = await hashPassword(data.new_password);
    }
    const updated = await authRepository.updateProfile(userId, {
      display_name: data.display_name,
      language: data.language,
      avatar_url: data.avatar_url,
      password_hash
    });
    if (!updated) {
      throw AppError.internal("Failed to update profile");
    }
    const { password_hash: _, auth_uid: __, ...safeUser } = updated;
    return safeUser;
  }
};
export {
  authService
};
