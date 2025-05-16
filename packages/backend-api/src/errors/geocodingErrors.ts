import { ApiError } from "@challenge/library-utils";

export class InvalidGeocodeRequestError extends ApiError {
  statusCode = 400;
  error = "Bad Request";

  constructor(details?: unknown) {
    super("Invalid geocode request payload.", details);
  }
}

export class GeocodeResultNotFoundError extends ApiError {
  statusCode = 404;
  error = "Not Found";

  constructor(query: string) {
    super(`No geocoding results found for "${query}".`);
  }
}

export class InvalidGeocodeResponseFormatError extends ApiError {
  statusCode = 500;
  error = "Internal Server Error";

  constructor() {
    super("Invalid response format for geocoding result.");
  }
}
