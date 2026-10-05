export interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  ALLOWED_ORIGINS: string;
  ANALYZE_RATE_LIMITER: RateLimit;
}
