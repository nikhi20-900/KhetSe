import type { ZodError } from "zod";

export interface FieldError {
  path: string;
  message: string;
}

/** RFC 7807 problem details used by the harvest and plan APIs. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: FieldError[];
}

export function validationProblem(
  error: ZodError,
  instance: string
): ProblemDetails {
  const errors = error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "body",
    message: issue.message,
  }));

  return {
    type: "https://khetse.org/errors/validation",
    title: "The request is invalid",
    status: 422,
    detail: errors[0]?.message ?? "One or more fields failed validation.",
    instance,
    errors,
  };
}
