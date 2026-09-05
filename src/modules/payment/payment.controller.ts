import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentServices } from "./payment.service";
import httpStatus from "http-status";

const createPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id!;
    const result = await paymentServices.createPayment(
      userId,
      req.body.assessmentId,
    );

    sendResponse(
      res,
      {
        message: "Payment created successfully.",
        data: result,
      },
      httpStatus.CREATED,
    );
  },
);

const bkashPaymentCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { redirectUrl } =
      await paymentServices.bkashPaymentCallback(req.query);

    
    res.redirect(redirectUrl);

    // sendResponse(
    //   res,
    //   {
    //     message: "Payment created successfully.",
    //     data: {},
    //   },
    //   httpStatus.CREATED,
    // );
  },
);

export const paymentControllers = {
  createPayment,
  bkashPaymentCallback,
};
