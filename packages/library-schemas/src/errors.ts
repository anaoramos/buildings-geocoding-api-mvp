import { z } from "./zod";
import { registry } from "./openapi";

export const ApiErrorSchema = z
  .object({
    statusCode: z.number().describe("HTTP status code"),
    error: z.string().describe('Error type, e.g. "Bad Request"'),
    message: z.string().describe("Human-readable error message"),
    details: z.any().optional().describe("Optional additional error details"),
  })
  .openapi("ApiError");

registry.register("ApiError", ApiErrorSchema);

export type ApiError = z.infer<typeof ApiErrorSchema>;
