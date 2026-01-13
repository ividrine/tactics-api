import { User } from "@prisma/client";

export type InsertableUser = Pick<
  User,
  "email" | "username" | "password" | "role"
>;
export type SelectableUser = Omit<User, "password">;
export type UpdatableUser = Omit<User, "createdAt" | "updatedAt" | "id">;
export type AuthUser = Pick<User, "id" | "role" | "username">;
