import httpStatus from "http-status";
import tokenService from "./token.service.js";
import userService from "./user.service.js";
import ApiError from "../utils/ApiError.js";
import { TokenType } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma/index.js";
import { INVALID_LOGIN_ERROR } from "../constants/error.constants.js";

const loginWithPassword = async (username: string, password: string) => {
  const user = await userService.getUserByUsername(username, true);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_LOGIN_ERROR);
  }
  return { ...user, ...{ password: undefined } };
};

const logout = async (token: string) => {
  const refreshToken = await prisma.token.findUnique({
    where: { token, type: TokenType.REFRESH, revoked: false }
  });
  if (!refreshToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await tokenService.removeToken(token);
};

const refreshAuth = async (refreshToken: string) => {
  try {
    const token = await tokenService.verifyToken(
      refreshToken,
      TokenType.REFRESH
    );

    const user = await userService.getUserById(token.userId);

    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist.");
    }

    await tokenService.removeToken(refreshToken);
    return await tokenService.generateAuthTokens(user);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

const resetPassword = async (
  resetPasswordToken: string,
  newPassword: string
) => {
  try {
    const resetPasswordTokenRow = await tokenService.verifyToken(
      resetPasswordToken,
      TokenType.RESET_PASSWORD
    );

    const user = resetPasswordTokenRow.user;

    await userService.updateUserById(user.id, {
      password: newPassword
    });

    await tokenService.removeManyTokens(user.id, TokenType.RESET_PASSWORD);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

const verifyEmail = async (verifyEmailToken: string) => {
  try {
    const verifyEmailTokenRow = await tokenService.verifyToken(
      verifyEmailToken,
      TokenType.VERIFY_EMAIL
    );

    const user = verifyEmailTokenRow.user;

    await tokenService.removeManyTokens(user.id, TokenType.VERIFY_EMAIL);
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

export default {
  loginWithPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail
};
