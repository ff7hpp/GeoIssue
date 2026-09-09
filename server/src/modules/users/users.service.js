import { usersRepository } from "./users.repository.js";
import { reportsRepository } from "../reports/reports.repository.js";
import { AppError } from "../../shared/errors.js";
function withoutPasswordHash(user) {
  const { password_hash: _, auth_uid: __, ...safeUser } = user;
  return safeUser;
}
const usersService = {
  async getProfile(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User profile not found");
    }
    return withoutPasswordHash(user);
  },
  async syncUser(userId, data) {
    const updated = await usersRepository.update(userId, {
      display_name: data.display_name,
      language: data.language
    });
    if (!updated) {
      throw AppError.notFound("User not found");
    }
    return withoutPasswordHash(updated);
  },
  async updateSettings(userId, data) {
    const updated = await usersRepository.update(userId, data);
    if (!updated) {
      throw AppError.notFound("User not found");
    }
    return withoutPasswordHash(updated);
  },
  async getUserReports(userId, page = 1, limit = 20) {
    return reportsRepository.findByUserId(userId, page, limit);
  },
  async listAllUsers(page = 1, limit = 20) {
    const result = await usersRepository.listAll(page, limit);
    return {
      ...result,
      users: result.users.map(withoutPasswordHash)
    };
  },
  async updateUserRoleOrStatus(id, data) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    const updated = await usersRepository.update(id, data);
    return updated ? withoutPasswordHash(updated) : null;
  }
};
export {
  usersService
};
