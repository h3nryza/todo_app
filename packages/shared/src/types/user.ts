export interface UserPreferences {
  /** Default time for reminders in HH:mm format */
  defaultReminderTime: string;
  /** Quiet hours start time in HH:mm format, or null if disabled */
  quietHoursStart: string | null;
  /** Quiet hours end time in HH:mm format, or null if disabled */
  quietHoursEnd: string | null;
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
  /** First day of the week: 0 = Sunday, 1 = Monday */
  firstDayOfWeek: 0 | 1;
}

export interface User {
  id: string;
  email: string;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  timezone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
