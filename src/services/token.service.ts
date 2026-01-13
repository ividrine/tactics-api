import dayjs from "dayjs";
import httpStatus from "http-status";
import config from "../config/config.js";
import ApiError from "../utils/ApiError.js";
import userService from "./user.service.js";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma/index.js";
import { Role, TokenType } from "@prisma/client";

import type { AuthUser } from "../types/user.type.js";

const {
  issuer,
  audience,
  accessExpirationMinutes,
  refreshExpirationDays,
  resetPasswordExpirationMinutes,
  verifyEmailExpirationMinutes
} = config.jwt;

const generateToken = (
  sub: string,
  username: string,
  role: Role,
  type: TokenType,
  exp: number,
  secret: string = config.jwt.secret
): string => {
  const payload: object = {
    sub,
    username,
    role,
    type,
    exp,
    iat: dayjs().unix()
  };
  const options: jwt.SignOptions = { issuer, audience, algorithm: "HS256" };
  return jwt.sign(payload, secret, options);
};

const saveToken = async (
  token: string,
  userId: string,
  type: string,
  expires: Date,
  revoked: boolean = false
) => {
  const tokenRow = await prisma.token.create({
    data: {
      token,
      userId,
      type,
      expires,
      revoked
    }
  });
  return tokenRow;
};

const verifyToken = async (token: string, type: string) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const userId = payload.sub as string;

  const tokenRow = await prisma.token.findUnique({
    where: { token, type, userId, revoked: false },
    include: { user: true }
  });

  if (!tokenRow) {
    throw new Error("Token not found");
  }

  return tokenRow;
};

const generateAuthTokens = async (user: AuthUser) => {
  const accessTokenExpires = dayjs().add(
    accessExpirationMinutes as number,
    "minutes"
  );
  const refreshTokenExpires = dayjs().add(
    refreshExpirationDays as number,
    "days"
  );

  const accessToken = generateToken(
    user.id,
    user.username,
    user.role,
    TokenType.ACCESS,
    accessTokenExpires.unix()
  );

  const refreshToken = generateToken(
    user.id,
    user.username,
    user.role,
    TokenType.REFRESH,
    refreshTokenExpires.unix()
  );

  await saveToken(
    refreshToken,
    user.id,
    TokenType.REFRESH,
    refreshTokenExpires.toDate()
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate()
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate()
    }
  };
};

const generateResetPasswordToken = async (email: string) => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found with this email");
  }

  const expires = dayjs().add(
    resetPasswordExpirationMinutes as number,
    "minutes"
  );

  const resetPasswordToken = generateToken(
    user.id,
    user.username,
    user.role,
    TokenType.RESET_PASSWORD,
    expires.unix()
  );

  await saveToken(
    resetPasswordToken,
    user.id,
    TokenType.RESET_PASSWORD,
    expires.toDate()
  );

  return resetPasswordToken;
};

const generateVerifyEmailToken = async (
  userId: string,
  username: string,
  role: Role
) => {
  const expires = dayjs().add(
    verifyEmailExpirationMinutes as number,
    "minutes"
  );

  const verifyEmailToken = generateToken(
    userId,
    username,
    role,
    TokenType.VERIFY_EMAIL,
    expires.unix()
  );

  await saveToken(
    verifyEmailToken,
    userId,
    TokenType.VERIFY_EMAIL,
    expires.toDate()
  );

  return verifyEmailToken;
};

const removeToken = async (token: string) =>
  await prisma.token.delete({ where: { token } });

const removeManyTokens = async (userId: string, type: string) =>
  await prisma.token.deleteMany({ where: { userId, type } });

export default {
  generateToken,
  saveToken,
  removeToken,
  removeManyTokens,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken
};
