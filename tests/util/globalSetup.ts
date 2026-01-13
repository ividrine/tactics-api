import prisma from "../../src/lib/prisma";
export async function teardown() {
  await prisma.$transaction([
    prisma.token.deleteMany(),
    prisma.user.deleteMany()
  ]);
}
