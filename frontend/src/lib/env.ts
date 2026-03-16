export function getEnv(name: string, fallback?: string) {
  const value = import.meta.env[name] as string | undefined;
  if (value === undefined || value === "") return fallback;
  return value;
}

export function isTruthyEnv(name: string, fallback = false) {
  const value = getEnv(name);
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
