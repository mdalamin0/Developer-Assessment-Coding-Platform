import config from "../../config";
import AppError from "../../errors/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import {
  PaymentMethod,
  PaymentStatus,
  UserStatus,
} from "../../../generated/prisma/enums";

const createPayment = async (userId: string, assessmentId: string) => {
  // 1. Recruiter check
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      recruiter: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  // 2. Assessment check
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found.");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { assessmentId },
  });

  if (existingPayment?.status === PaymentStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment has already been completed for this assessment.",
    );
  }

  // 4. Payment amount
  const amount = config.assessment_publish_fee;

  // 5. Unique merchant invoice number
  const merchantInvoiceNumber = `INV-${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;

  // 6. Payment DB record
  const payment = await prisma.payment.upsert({
    where: {
      assessmentId,
    },
    update: {
      amount,
      merchantInvoiceNumber,
      paymentMethod: PaymentMethod.BKASH,
      status: PaymentStatus.PENDING,
    },
    create: {
      recruiterId: user.recruiter.id,
      assessmentId,
      amount,
      currency: "BDT",
      paymentMethod: PaymentMethod.BKASH,
      status: PaymentStatus.PENDING,
      merchantInvoiceNumber,
    },
  });

  // 7. bKash token
  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get bKash access token.",
    );
  }

  // 8. Create bKash payment
  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: userId,
        callbackURL: `${config.bkash_callback_url}/payment/bkash-payment/callback`,
        amount: amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      }),
    },
  );

  if (!bkashCreatePaymentResponse.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to create bKash payment.",
    );
  }

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  // 9. Save bKash payment ID
  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      bkashPaymentId: bkashCreatePaymentResult.paymentID,
      payerReference: userId,
      gatewayResponse: bkashCreatePaymentResult,
    },
  });

  return {
    paymentUrl: bkashCreatePaymentResult.bkashURL,
  };
};

const retryPayment = async (userId: string, assessmentId: string) => {
  // 1. Recruiter check
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      recruiter: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter not found");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is suspended.");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.FORBIDDEN, "Recruiter is deleted.");
  }

  if (!user.recruiter) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruiter profile not found.");
  }

  // 2. Assessment check
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      recruiterId: user.recruiter.id,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found.");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { assessmentId },
  });

  if (existingPayment?.status === PaymentStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment has already been completed for this assessment.",
    );
  }

  const payment = await prisma.payment.findFirst({
    where: {
      assessmentId,
      recruiterId: user.recruiter.id,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
  }

  if (payment.status !== PaymentStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, "Appointment Is Not Pending!");
  }

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get bKash access token.",
    );
  }

  const merchantInvoiceNumber = `INV-${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )}`;

  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: userId,
        callbackURL: `${config.bkash_callback_url}/payment/bkash-payment/callback`,
        amount: payment.amount.toString(),
        currency: payment.currency,
        intent: "sale",
        merchantInvoiceNumber,
      }),
    },
  );

  if (!bkashCreatePaymentResponse.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to create bKash payment.",
    );
  }

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.PENDING,
      merchantInvoiceNumber,
      bkashPaymentId: bkashCreatePaymentResult.paymentID,
      transactionId: null,
      payerReference: userId,
      gatewayResponse: bkashCreatePaymentResult,
    },
  });

  return {
    paymentUrl: bkashCreatePaymentResult.bkashURL,
  };
};;

const bkashPaymentCallback = async (query: Record<string, any>) => {
  const paymentId = query.paymentID;
  const status = query.status;

  if (!paymentId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is missing.");
  }

  if (!status) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment status is missing.");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      bkashPaymentId: paymentId,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
  }

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to get bKash access token.",
    );
  }

  // Cancel
  if (status === "cancel") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });

    return {
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=cancel`,
    };
  }

  // Failure
  if (status === "failure") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    return {
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=failure`,
    };
  }

  // Execute payment
  const executePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: bkashIdToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        paymentID: paymentId,
      }),
    },
  );

  if (!executePaymentResponse.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      "Failed to execute bKash payment.",
    );
  }

  const executedPaymentResult = await executePaymentResponse.json();

  // bKash successful response
  if (
    executedPaymentResult.statusCode !== "0000" ||
    executedPaymentResult.transactionStatus !== "Completed"
  ) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: executedPaymentResult,
      },
    });

    return {
      redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=failure`,
    };
  }

  // Payment completed
  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.COMPLETED,
      transactionId: executedPaymentResult.trxID,
      paidAt: new Date().toISOString(),
      gatewayResponse: executedPaymentResult,
    },
  });

  return {
    redirectUrl: `${config.frontend_url}/dashboard/my-payments?status=success`,
  };
};

export const paymentServices = {
  createPayment,
  bkashPaymentCallback,
  retryPayment
};
