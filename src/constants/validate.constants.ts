import * as z from "zod";
import {
  EMAIL_REQUIRED_ERROR,
  EMAIL_INVALID_ERROR,
  USERNAME_MAX_LEN_ERROR,
  USERNAME_MIN_LEN_ERROR,
  USERNAME_PATTERN_ERROR,
  USERNAME_REQUIRED_ERROR,
  PW_LENGTH_ERROR,
  PW_PATTERN_ERROR,
  PW_REQUIRED_ERROR,
  INVALID_TOKEN_ERROR
} from "./error.constants.js";

export const EMAIL = z.email({
  error: (iss) =>
    iss.input === undefined ? EMAIL_REQUIRED_ERROR : EMAIL_INVALID_ERROR
});

export const USERNAME = z
  .string(USERNAME_REQUIRED_ERROR)
  .min(4, USERNAME_MIN_LEN_ERROR)
  .max(15, USERNAME_MAX_LEN_ERROR)
  .refine((username) => username.match(/[a-zA-Z0-9_-]/), {
    message: USERNAME_PATTERN_ERROR
  });

export const PASSWORD = z
  .string(PW_REQUIRED_ERROR)
  .min(8, PW_LENGTH_ERROR)
  .refine((password) => password.match(/\d/) && password.match(/[a-zA-Z]/), {
    message: PW_PATTERN_ERROR
  });

export const USERNAME_RELAXED = z.string().min(1, USERNAME_REQUIRED_ERROR);

export const PASSWORD_RELAXED = z.string().min(1, PW_REQUIRED_ERROR);

export const TOKEN = z.string(INVALID_TOKEN_ERROR).min(1, INVALID_TOKEN_ERROR);
