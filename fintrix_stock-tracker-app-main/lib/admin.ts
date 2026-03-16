export const ADMIN_EMAIL = "admin@email.com";
export const ADMIN_PASSWORD = "admin";

export const isAdminEmail = (email?: string | null) =>
  (email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

