import { beforeEach, beforeAll, afterAll } from "vitest";
import prisma from "../../src/lib/prisma";

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.$transaction([
    prisma.token.deleteMany(),
    prisma.user.deleteMany()
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
