const { PrismaClient } = require('@prisma/client');

let prisma;

try {
  prisma = new PrismaClient();
  console.log("Prisma Client Successfully Initialized");
} catch (error) {
  console.error("Prisma Initialization Error:", error);
}

module.exports = prisma;
