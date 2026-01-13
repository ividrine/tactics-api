/* eslint-disable no-console */
import { PrismaClient, Role } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const totalUsers = 100;
  const hashedPassword = await bcrypt.hash("password123", 10);
  const admin = {
    email: "admin@app.com",
    username: "admin",
    password: hashedPassword,
    role: Role.ADMIN
  };

  const users = Array.from({ length: totalUsers }).map(() => ({
    email: faker.internet.email(),
    username: faker.internet.username(),
    role: Role.USER,
    password: hashedPassword,
    createdAt: faker.date.past(),
    updatedAt: new Date()
  }));

  await prisma.user.create({ data: admin });

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true
  });

  console.log("Seed data inserted");
}

main()
  .catch((err) => {
    console.log(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
