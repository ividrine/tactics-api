import {
  CREATE_USERS,
  READ_USERS,
  UPDATE_USERS,
  DELETE_USERS,
  START_MATCHMAKING,
  STOP_MATCHMAKING,
  ACCEPT_MATCH
} from "./permission.constants.js";

import { Role } from "@prisma/client";

const rolePrivileges = {
  [Role.USER]: [START_MATCHMAKING, STOP_MATCHMAKING, ACCEPT_MATCH],
  [Role.ADMIN]: [
    CREATE_USERS,
    READ_USERS,
    UPDATE_USERS,
    DELETE_USERS,
    START_MATCHMAKING,
    STOP_MATCHMAKING,
    ACCEPT_MATCH
  ]
};

export const ROLE_PRIVILEGES = new Map(Object.entries(rolePrivileges));
