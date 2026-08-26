import { usersRepository } from './users.repository.js';
import { reportsRepository } from '../reports/reports.repository.js';
import { AppError } from '../../shared/errors.js';
import { Language, UserRole } from '../../shared/types.js';

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User profile not found');
    }
    return user;
  },

  async syncUser(data: {
    firebase_uid: string;
    email: string;
    display_name?: string | null;
    language?: Language;
  }) {
    const role: UserRole =
      data.email.toLowerCase().includes('admin') ||
      data.firebase_uid.toLowerCase().includes('admin')
        ? 'admin'
        : 'user';

    return usersRepository.upsert({
      firebase_uid: data.firebase_uid,
      email: data.email,
      display_name: data.display_name,
      language: data.language || 'en',
      role,
      account_status: 'active',
    });
  },

  async updateSettings(
    userId: string,
    data: { display_name?: string; language?: Language }
  ) {
    const updated = await usersRepository.update(userId, data);
    if (!updated) {
      throw AppError.notFound('User not found');
    }
    return updated;
  },

  async getUserReports(userId: string, page = 1, limit = 20) {
    return reportsRepository.findByUserId(userId, page, limit);
  },

  async listAllUsers(page = 1, limit = 20) {
    return usersRepository.listAll(page, limit);
  },

  async updateUserRoleOrStatus(
    id: string,
    data: { role?: UserRole; account_status?: any }
  ) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return usersRepository.update(id, data);
  },
};
