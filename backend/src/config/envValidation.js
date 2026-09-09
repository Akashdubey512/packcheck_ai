/**
 * Startup Environment Variable Validation Guard.
 * Fails fast in production if mandatory configuration secrets or service URLs are missing or insecure.
 */
export function validateStartupEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL,
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "*",
  };

  const INSECURE_DEFAULTS = [
    "replace-with-a-long-random-string",
    "packcheck_dev_secret_key_2026",
    "secret",
    "password",
    "123456",
  ];

  const missing = [];
  const warnings = [];

  for (const [key, val] of Object.entries(requiredVars)) {
    if (!val || val.trim().length === 0) {
      missing.push(key);
    } else if (key === "JWT_SECRET" && INSECURE_DEFAULTS.includes(val.trim())) {
      if (isProduction) {
        missing.push(`${key} (insecure default string used in production)`);
      } else {
        warnings.push(`Warning: ${key} is using a development default secret.`);
      }
    }
  }

  if (warnings.length > 0 && !isProduction) {
    warnings.forEach((w) => console.warn(`[Config Guard] ${w}`));
  }

  if (missing.length > 0) {
    const errorMsg = `[CRITICAL CONFIG ERROR] Missing or insecure environment variables required for startup:\n  - ${missing.join("\n  - ")}`;
    if (isProduction) {
      console.error(errorMsg);
      console.error("Shutting down gateway due to failed production configuration validation.");
      process.exit(1);
    } else {
      console.warn(`[Config Warning] ${errorMsg}`);
    }
  }
}
