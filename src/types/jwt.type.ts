import { Role, TokenType } from "@prisma/client";
import type { JwtPayload } from "jsonwebtoken";

export type AuthPayload = JwtPayload & {
  type: TokenType;
  role: Role;
  username: string;
};
