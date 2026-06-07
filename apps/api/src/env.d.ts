export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  HASHIDS_SALT: string;
  S3_ENDPOINT: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_REGION: string;
}