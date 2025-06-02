export const USER_ROLES = {
  USER: 'user',
  REPRESENTATIVE: 'representative',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const FIREBASE_EMAIL_DOMAIN = 'doceacesso.app';
