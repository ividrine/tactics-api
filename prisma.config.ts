import type { PrismaConfig } from "prisma";
import path from "path";

export default {
  schema: path.join("db", "schema.prisma"),
  migrations: {
    path: path.join("db", "migrations"),
    seed: "tsx db/seed.ts"
  }
} satisfies PrismaConfig;
