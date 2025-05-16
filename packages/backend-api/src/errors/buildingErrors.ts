import { ApiError } from "@challenge/library-utils";

export class DuplicateBuildingIdError extends ApiError {
  statusCode = 409;
  error = "Conflict";

  constructor(id: string) {
    super(`Building with ID "${id}" already exists.`);
  }
}

export class BuildingNotFoundError extends ApiError {
  statusCode = 404;
  error = "Not Found";

  constructor(id: string) {
    super(`Building with ID "${id}" not found.`);
  }
}

export class InvalidBuildingUpdateError extends ApiError {
  statusCode = 400;
  error = "Bad Request";

  constructor(details?: unknown) {
    super("Invalid building update payload.", details);
  }
}

export class EmptyUpdatePayloadError extends ApiError {
  statusCode = 400;
  error = "Bad Request";

  constructor() {
    super("Request body must include at least one field to update.");
  }
}
