const PASSWORD_REQUIREMENTS = [
  "At least 8 characters long",
  "Contains uppercase and lowercase letters",
  "Contains at least one number",
  "Contains at least one special character",
] as const;

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Password must contain uppercase and lowercase letters.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}

export { PASSWORD_REQUIREMENTS };
