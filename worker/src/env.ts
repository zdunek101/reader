export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODELS: string;
  ALLOWED_ORIGINS: string;
  CLIENT_RATE_LIMITER: RateLimit;
  GLOBAL_RATE_LIMITER: RateLimit;
}
