import cron from "node-cron";
import { prisma } from "./prisma";
import { AssessmentStatus, InvitationStatus } from "../../generated/prisma/enums";

export const updateAssessmentStatus = async () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // PUBLISHED → ONGOING
      await prisma.assessment.updateMany({
        where: {
          status: AssessmentStatus.PUBLISHED,
          startAt: {
            lte: now,
          },
          endAt: {
            gt: now,
          },
        },
        data: {
          status: AssessmentStatus.ONGOING,
        },
      });

      // ONGOING → COMPLETED
      await prisma.assessment.updateMany({
        where: {
          status: AssessmentStatus.ONGOING,
          endAt: {
            lte: now,
          },
        },
        data: {
          status: AssessmentStatus.COMPLETED,
        },
      });

      // invitation PENDING → EXPIRED
      await prisma.invitation.updateMany({
        where: {
          status: InvitationStatus.PENDING,
          expiresAt: {
            lte: now,
          },
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
      });
    } catch (error) {
      console.error("Cron job error updating assessment statuses:", error);
    }

    console.log(
      `[CRON] Assessment lifecycle synchronizer executed at ${new Date().toISOString()}`,
    );
  });
};
