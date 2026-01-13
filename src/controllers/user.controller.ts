import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import userService from "../services/user.service.js";
import { User } from "@prisma/client";
import type { PaginationArgs } from "../lib/prisma/extensions/paginate.js";

const createUser = catchAsync(async (req, res) => {
  const { body } = res.locals.input;
  const user = await userService.createUser(body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const { page, limit, order, email, role } = res.locals.input.query;

  const expressions = [
    email && { email: { contains: email } },
    role && { role }
  ].filter((exp) => exp);

  const userQuery: PaginationArgs<User> = {
    page: page as unknown as number,
    limit: limit as unknown as number,
    order: order as string,
    where: expressions.length > 0 ? { AND: expressions } : {}
  };

  const result = await userService.queryUsers(userQuery);

  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const { userId } = res.locals.input.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const { body, params } = res.locals.input;
  const { userId } = params;
  const user = await userService.updateUserById(userId, body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = res.locals.input.params;
  await userService.deleteUserById(userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
