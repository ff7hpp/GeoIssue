import { categoriesRepository } from "./categories.repository.js";
import { AppError } from "../../shared/errors.js";
const categoriesService = {
  async getAllCategories(onlyActive = true) {
    return categoriesRepository.listAll(onlyActive);
  },
  async getCategoryById(id) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw AppError.notFound("Category not found");
    }
    return category;
  },
  async createCategory(data) {
    const existing = await categoriesRepository.findBySlug(data.slug);
    if (existing) {
      throw AppError.conflict(`Category with slug "${data.slug}" already exists`);
    }
    return categoriesRepository.create(data);
  },
  async updateCategory(id, data) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw AppError.notFound("Category not found");
    }
    if (data.slug && data.slug !== category.slug) {
      const existing = await categoriesRepository.findBySlug(data.slug);
      if (existing) {
        throw AppError.conflict(`Category with slug "${data.slug}" already exists`);
      }
    }
    return categoriesRepository.update(id, data);
  }
};
export {
  categoriesService
};
