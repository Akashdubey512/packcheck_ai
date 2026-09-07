import { z } from 'zod';

const envSchema = z.object({
  VITE_DEMO_MODE: z
    .string()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8000/api/v1'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_API_TIMEOUT_MS: z
    .string()
    .default('15000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
});

// Safe parse environment variables from import.meta.env
const rawEnv = {
  VITE_DEMO_MODE: import.meta.env.VITE_DEMO_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_API_TIMEOUT_MS: import.meta.env.VITE_API_TIMEOUT_MS,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
}

export const env = parsed.success
  ? parsed.data
  : {
      VITE_DEMO_MODE: true,
      VITE_API_BASE_URL: 'http://localhost:8000/api/v1',
      VITE_APP_ENV: 'development' as const,
      VITE_API_TIMEOUT_MS: 15000,
    };

export const isDemoMode = (): boolean => env.VITE_DEMO_MODE;
