jest.mock("@challenge/database-services", () => ({
  loadGeocodeResult: jest.fn(),
}));
import  { FastifyInstance } from "fastify";
import * as db from "@challenge/database-services";
import {createBackendApi} from "../api";

describe("geocodeRoute", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createBackendApi();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validGeocodeResult = [
    {
      address: {
        line1: "123 Main St",
        postCode: "12345",
        city: "Test City",
        countryCode: "US",
      },
      coordinates: { lat: 10, lon: 20 },
    },
  ];

  it("should return geocoding results with default limit", async () => {
    (db.loadGeocodeResult as jest.Mock).mockReturnValue(validGeocodeResult);

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Main St" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(validGeocodeResult);
    expect(db.loadGeocodeResult).toHaveBeenCalledWith("Main St");
  });

  it("should respect custom limit parameter", async () => {
    const multipleResults = Array(7).fill(validGeocodeResult[0]);
    (db.loadGeocodeResult as jest.Mock).mockReturnValue(multipleResults);

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Main St", limit: 3 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(3);
  });

  it("should cap limit at 10 even if higher value provided (expects 400)", async () => {
    const multipleResults = Array(15).fill(validGeocodeResult[0]);
    (db.loadGeocodeResult as jest.Mock).mockReturnValue(multipleResults);

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Main St", limit: 20 },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid request body", async () => {
    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { wrongField: "value" },
    });

    const body = response.json();

    expect(body).toHaveProperty("statusCode", 400);
    expect(body).toHaveProperty("error", "Bad Request");
    expect(body).toHaveProperty(
      "message",
      "body/searchText Required, body/ Unrecognized key(s) in object: 'wrongField'",
    );
    expect(typeof body.message).toBe("string");
  });

  it("should return 404 when no results found", async () => {
    (db.loadGeocodeResult as jest.Mock).mockReturnValue(null);

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Nonexistent Address" },
    });

    const body = response.json();

    expect(body).toHaveProperty("statusCode", 404);
    expect(body).toHaveProperty("error", "Not Found");
    expect(body).toHaveProperty(
      "message",
      'No geocoding results found for "Nonexistent Address".',
    );
    expect(typeof body.message).toBe("string");
  });

  it("should return 500 when response format is invalid", async () => {
    (db.loadGeocodeResult as jest.Mock).mockReturnValue([
      { invalid: "format" },
    ]);

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Main St" },
    });

    const body = response.json();

    expect(body).toHaveProperty("statusCode", 500);
    expect(body).toHaveProperty("error", "Internal Server Error");
    expect(body).toHaveProperty(
      "message",
      "Invalid response format for geocoding result.",
    );
    expect(typeof body.message).toBe("string");
  });

  it("should return 500 for unexpected errors", async () => {
    (db.loadGeocodeResult as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const response = await app.inject({
      method: "POST",
      headers: {
        "x-api-key": "api-key",
      },
      url: "/v1/geocoding",
      payload: { searchText: "Main St" },
    });
    const body = response.json();

    expect(body).toHaveProperty("statusCode", 500);
    expect(body).toHaveProperty("error", "Internal Server Error");
    expect(body).toHaveProperty("message", "Unexpected server error");
    expect(typeof body.message).toBe("string");
  });
});
