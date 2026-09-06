import app from "./app";
import config from "./config";
import { autoSubmitExpiredAttempts, updateAssessmentStatus } from "./lib/cron";
import { transporter } from "./lib/nodemailer";
import { prisma } from "./lib/prisma";
import { redisClient } from "./lib/redis";
import { seedTesterAdmin } from "./utils/seed";

const PORT = config.port;
const main = async () => {
  try {
    await prisma.$connect();
    console.log("database connected successfullly!");
    await redisClient.connect();
    console.log("Redis connected successfully.");

    try {
      await transporter.verify();
      console.log("Nodemailer connected successfully.");
    } catch (error) {
      console.error("Nodemailer verification failed:", error);
    }

    await seedTesterAdmin();

    await updateAssessmentStatus();
    await autoSubmitExpiredAttempts();

    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}`);
    });
  } catch (error) {
    console.log(`error starting the server: ${error}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
