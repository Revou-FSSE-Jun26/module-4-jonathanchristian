export interface E2ECredentials {
  email: string;
  password: string;
}

/** Read a required environment variable, throwing an error naming the variable if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Read the E2E user credentials from `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`. */
export function requireCredentials(): E2ECredentials {
  return {
    email: requireEnv("E2E_USER_EMAIL"),
    password: requireEnv("E2E_USER_PASSWORD"),
  };
}

/** Derive a wrong password at runtime without embedding any literal credential. */
export function buildWrongPassword(password: string): string {
  return `${password}-wrong-${Date.now()}`;
}

/** Build a unique email per run by plus-addressing the local part of `baseEmail`. */
export function buildUniqueEmail(baseEmail: string, label = "e2e"): string {
  const atIdx = baseEmail.indexOf("@");
  if (atIdx <= 0) {
    throw new Error("E2E_USER_EMAIL must be a valid email address.");
  }
  const local = baseEmail.slice(0, atIdx).split("+")[0];
  const domain = baseEmail.slice(atIdx + 1);
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${local}+${suffix}@${domain}`;
}
