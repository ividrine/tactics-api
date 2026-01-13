import { z } from "zod";

const envVarsSchema = z.object({
  // Required
  NODE_ENV: z.enum(["production", "development", "test"]),
  DATABASE_URL: z.string().describe("DB Url"),
  VALKEY_URL: z.string().describe("Valkey url"),
  JWT_SECRET: z.string().describe("JWT secret key"),

  // Optional
  PORT: z.coerce.number().default(3000).optional(),
  WS_PORT: z.coerce.number().default(8080).optional(),
  JWT_ISSUER: z.string().default("nodeapp").describe("JWT issuer").optional(),
  JWT_AUDIENCE: z.string().default("nodeapp").describe("JWT issuer").optional(),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce
    .number()
    .default(30)
    .describe("minutes after which access tokens expire")
    .optional(),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce
    .number()
    .default(30)
    .describe("days after which refresh tokens expire")
    .optional(),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.coerce
    .number()
    .default(10)
    .describe("minutes after which reset password token expires")
    .optional(),
  JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.coerce
    .number()
    .default(10)
    .describe("minutes after which verify email token expires")
    .optional(),
  SMTP_HOST: z.string().describe("server that will send the emails").optional(),
  SMTP_PORT: z.coerce
    .number()
    .describe("port to connect to the email server")
    .optional(),
  SMTP_USERNAME: z.string().describe("username for email server").optional(),
  SMTP_PASSWORD: z.string().describe("password for email server").optional(),
  EMAIL_FROM: z
    .string()
    .describe("the from field in the emails sent by the app")
    .optional()
});

const data = envVarsSchema.parse(process.env);

export default {
  env: data.NODE_ENV,
  port: data.PORT,
  ws_port: data.WS_PORT,
  db_url: data.DATABASE_URL,
  valkey_url: data.VALKEY_URL,
  jwt: {
    issuer: data.JWT_ISSUER,
    audience: data.JWT_AUDIENCE,
    secret: data.JWT_SECRET,
    accessExpirationMinutes: data.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: data.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: data.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: data.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
  },
  email: {
    smtp: {
      host: data.SMTP_HOST,
      port: data.SMTP_PORT,
      auth: {
        user: data.SMTP_USERNAME,
        pass: data.SMTP_PASSWORD
      }
    },
    from: data.EMAIL_FROM
  }
};
