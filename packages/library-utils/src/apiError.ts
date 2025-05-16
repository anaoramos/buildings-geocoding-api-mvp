export abstract class ApiError extends Error {
  abstract statusCode: number;
  abstract error: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    if (details) this.details = details;
  }
}
