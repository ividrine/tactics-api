import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import ApiError from "../utils/ApiError.js";
import { TokenType } from "@prisma/client";
import { ROLE_PRIVILEGES } from "../constants/role.constants.js";

import type { Request, Response, NextFunction } from "express";
import { AuthPayload } from "../types/jwt.type.js";
import { AuthRequest } from "../types/request.type.js";

const { secret } = config.jwt;

const authorize =
  (...permissions: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
    }

    jwt.verify(token, secret, async (err, payload) => {
      if (err) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
      }

      const authPayload = payload as AuthPayload;

      if (authPayload.type !== TokenType.ACCESS) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
      }

      const privileges = ROLE_PRIVILEGES.get(authPayload.role);

      const hasPrivileges = permissions?.every((permission) =>
        privileges?.includes(permission)
      );

      if (!hasPrivileges && req.params?.userId !== authPayload.sub) {
        return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
      }

      (req as AuthRequest).auth = { payload: payload as AuthPayload };

      next();
    });
  };

export default authorize;
