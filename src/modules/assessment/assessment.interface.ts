export interface ICreateAssessmentPayload {
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startAt?: string;
  endAt?: string;
}
