export type AccountSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
};

export function accountName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length > 0 && name.length <= 100 ? name : null;
}

export function passwordError(current: string, password: string, confirmation: string): string | null {
  if (!current) return "Enter your current password.";
  if (password.length < 8 || password.length > 128) return "Use 8–128 characters for your new password.";
  if (password !== confirmation) return "The new passwords do not match.";
  if (current === password) return "Choose a different new password.";
  return null;
}
