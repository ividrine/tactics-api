import * as z from "zod";
import {
  EMAIL,
  USERNAME,
  USERNAME_RELAXED,
  PASSWORD,
  PASSWORD_RELAXED,
  TOKEN
} from "../constants/validate.constants.js";

const register = {
  body: z.object({
    email: EMAIL.optional(),
    username: USERNAME,
    password: PASSWORD
  })
};

const login = {
  body: z.object({ username: USERNAME_RELAXED, password: PASSWORD_RELAXED })
};

const logout = {
  body: z.object({ refreshToken: TOKEN })
};

const refreshTokens = {
  body: z.object({ refreshToken: TOKEN })
};

const forgotPassword = {
  body: z.object({ email: EMAIL })
};

const resetPassword = {
  query: z.object({ token: TOKEN }),
  body: z.object({ password: PASSWORD })
};

const verifyEmail = {
  query: z.object({ token: TOKEN })
};

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail
};
