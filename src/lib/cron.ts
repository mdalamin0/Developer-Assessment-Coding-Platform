import cron from "node-cron";
import { prisma } from "./prisma";
import {
  AssessmentStatus,
  AttemptStatus,
  AuditAction,
  AuditEntity,
  InvitationStatus,
} from "../../generated/prisma/enums";

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


export const autoSubmitExpiredAttempts = async() => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expiredAttempts = await prisma.attempt.findMany({
        where: {
          status: AttemptStatus.IN_PROGRESS,
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          candidateId: true,
        },
      });

      if (expiredAttempts.length === 0) {
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.attempt.updateMany({
          where: {
            id: {
              in: expiredAttempts.map((attempt) => attempt.id),
            },
            status: AttemptStatus.IN_PROGRESS,
          },
          data: {
            status: AttemptStatus.SUBMITTED,
            submittedAt: now,
          },
        });

        await tx.auditLog.createMany({
          data: expiredAttempts.map((attempt) => ({
            userId: attempt.candidateId,
            action: AuditAction.SUBMIT,
            entity: AuditEntity.ATTEMPT,
            entityId: attempt.id,
            oldValue: {
              status: AttemptStatus.IN_PROGRESS,
            },
            newValue: {
              status: AttemptStatus.SUBMITTED,
              reason: "TIME_EXPIRED",
            },
          })),
        });
      });

      console.log(
        `[CRON] ${expiredAttempts.length} attempt(s) auto-submitted.`,
      );
    } catch (error) {
      console.error("[CRON] Error auto-submitting expired attempts:", error);
    }
  });
};