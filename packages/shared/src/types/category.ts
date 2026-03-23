export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  color: string;
  icon: string;
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
  isFavorite?: boolean;
}
