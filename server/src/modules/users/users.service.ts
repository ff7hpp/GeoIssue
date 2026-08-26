import { usersRepository } from './users.repository.js';
import { reportsRepository } from '../reports/reports.repository.js';
import { AppError } from '../../shared/errors.js';
import { DbUser, Language, UserRole } from '../../shared/types.js';

function withoutPasswordHash(user: DbUser) {
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User profile not found');
    }
    return withoutPasswordHash(user);
  },

  async syncUser(userId: string, data: {
    display_name?: string | null;
    language?: Language;
  }) {
    const updated = await usersRepository.update(userId, {
      display_name: data.display_name,
      language: data.language,
    });
    if (!updated) {
      throw AppError.notFound('User not found');
    }
    return withoutPasswordHash(updated);
  },

  async updateSettings(
    userId: string,
    data: { display_name?: string; language?: Language }
  ) {
    const updated = await usersRepository.update(userId, data);
    if (!updated) {
      throw AppError.notFound('User not found');
    }
    return withoutPasswordHash(updated);
  },

  async getUserReports(userId: string, page = 1, limit = 20) {
    return reportsRepository.findByUserId(userId, page, limit);
  },

  async listAllUsers(page = 1, limit = 20) {
    const result = await usersRepository.listAll(page, limit);
    return {
      ...result,
      users: result.users.map(withoutPasswordHash),
    };
  },

  async updateUserRoleOrStatus(
    id: string,
    data: { role?: UserRole; account_status?: any }
  ) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    const updated = await usersRepository.update(id, data);
    return updated ? withoutPasswordHash(updated) : null;
  },
};
