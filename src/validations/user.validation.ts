import * as z from "zod";
import { Role } from "@prisma/client";
import { EMAIL, USERNAME, PASSWORD } from "../constants/validate.constants.js";

const createUser = {
  body: z.object({
    email: EMAIL.optional(),
    username: USERNAME,
    password: PASSWORD,
    role: z.enum(Role)
  })
};

const getUsers = {
  query: z.object({
    email: z.string().optional(),
    role: z.string().optional(),
    isEmailVerified: z.boolean().optional(),
    order: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).optional()
  })
};

const getUser = {
  params: z.object({
    userId: z.string()
  })
};

const updateUser = {
  params: z.object({ userId: z.string() }),
  body: z.object({
    email: EMAIL.optional(),
    username: USERNAME.optional(),
    password: PASSWORD.optional()
  })
};

const deleteUser = {
  params: z.object({ userId: z.string() })
};

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
