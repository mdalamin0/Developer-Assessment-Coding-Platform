import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { assessmentServices } from "./assessment.service";

const createAssessment = catchAsync(async (req: Request, res: Response) => {
  const recruiterId = req.user?.id!;

  const result = await assessmentServices.createAssessment(
    recruiterId,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Assessment created successfully!",
      data: result,
    },
    httpStatus.CREATED,
  );
});

const getMyAssessments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;

  const result = await assessmentServices.getMyAssessments(userId, req.query);

  sendResponse(
    res,
    {
      message: "Assessment retrive successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const getAllAssessments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;

  const result = await assessmentServices.getAllAssessments(userId, req.query);

  sendResponse(
    res,
    {
      message: "Assessment retrieved successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const getSingleAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { id } = req.params;

  const result = await assessmentServices.getSingleAssessment(
    userId,
    id as string,
  );

  sendResponse(
    res,
    {
      message: "Assessment retrieved successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const updateAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { id } = req.params;

  const result = await assessmentServices.updateAssessment(
    userId,
    id as string,
    req.body,
  );

  sendResponse(
    res,
    {
      message: "Assessment updated successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const publishAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { id } = req.params;

  const result = await assessmentServices.publishAssessment(
    userId,
    id as string,
  );

  sendResponse(
    res,
    {
      message: "Assessment published successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

const deleteAssessment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id!;
  const { id } = req.params;

  const result = await assessmentServices.deleteAssessment(
    userId,
    id as string,
  );

  sendResponse(
    res,
    {
      message: "Assessment deleted successfully!",
      data: result,
    },
    httpStatus.OK,
  );
});

// Assessment Problem Controllers
const addProblemToAssessment = catchAsync(
  async (req: Request, res: Response) => {
    const recruiterId = req.user?.id!;
    const assessmentId = req.params.assessmentId as string;

    const result = await assessmentServices.addProblemToAssessment(
      recruiterId,
      assessmentId,
      req.body,
    );

    sendResponse(
      res,
      {
        message: "Problem added to assessment successfully!",
        data: result,
      },
      httpStatus.CREATED,
    );
  },
);

const getAssessmentProblems = catchAsync(
  async (req: Request, res: Response) => {
    const recruiterId = req.user?.id!;
    const assessmentId = req.params.assessmentId as string;

    const result = await assessmentServices.getAssessmentProblems(
      recruiterId,
      assessmentId,
    );

    sendResponse(
      res,
      {
        message: "Assessment problems retrieved successfully!",
        data: result,
      },
      httpStatus.OK,
    );
  },
);

const removeProblemFromAssessment = catchAsync(
  async (req: Request, res: Response) => {
    const recruiterId = req.user?.id!;
    const { assessmentId, problemId } = req.params;

    const result = await assessmentServices.removeProblemFromAssessment(
      recruiterId,
      assessmentId as string,
      problemId as string,
    );

    sendResponse(
      res,
      {
        message: "Problem removed from assessment successfully!",
        data: result,
      },
      httpStatus.OK,
    );
  },
);

const reorderAssessmentProblems = catchAsync(
  async (req: Request, res: Response) => {
    const recruiterId = req.user?.id!;
    const { assessmentId} = req.params;

    const result = await assessmentServices.reorderAssessmentProblems(
      recruiterId,
      assessmentId as string,
      req.body
    );

    sendResponse(
      res,
      {
        message: "Reorder assessment successfully!",
        data: result,
      },
      httpStatus.OK,
    );
  },
);



export const assessmentControllers = {
  createAssessment,
  getMyAssessments,
  getSingleAssessment,
  updateAssessment,
  getAllAssessments,
  deleteAssessment,
  publishAssessment,
  addProblemToAssessment,
  getAssessmentProblems,
  removeProblemFromAssessment,
  reorderAssessmentProblems
};
