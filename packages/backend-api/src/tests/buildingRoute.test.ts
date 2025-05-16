import { FastifyInstance } from "fastify";
import * as db from "@challenge/database-services";
import { Building } from "@challenge/library-schemas";

import {
  BuildingNotFoundError,
  DuplicateBuildingIdError,
  InvalidBuildingUpdateError,
} from "../errors";
import { AttachmentType, HeatingType, MethodType } from "@challenge/types";
import {createBackendApi} from "../api";

jest.mock("@challenge/database-services", () => ({
  saveBuilding: jest.fn(),
  listBuildings: jest.fn(),
  loadBuilding: jest.fn(),
  updateBuilding: jest.fn(),
  deleteBuilding: jest.fn(),
}));

describe("buildingRoute", () => {
  let app: FastifyInstance;

  const validBuilding: Building = {
    id: "CH-12345",
    address: {
      line1: "456 Oak St",
      postCode: "67890",
      city: "Sampletown",
      countryCode: "CA",
    },
    coordinates: { lat: 30.123, lon: -90.456 },
    attachmentType: AttachmentType.Detached,
    basementCeilingRenovationYear: 2010,
    constructionYear: 1995,
    facadeRenovationYear: 2015,
    floorCount: 3,
    heatedArea: 1500.5,
    heatingInstallationYear: 2018,
    heatingType: HeatingType.Gas,
    photovoltaicNominalPower: 5.2,
    roofRenovationYear: 2020,
    windowsRenovationYear: 2019,
  };

  const validBuildingWithoutId: Omit<Building, "id"> = {
    address: {
      line1: "789 Pine Ave",
      postCode: "11223",
      city: "Villagetown",
      countryCode: "US",
    },
    coordinates: { lat: 40.789, lon: -74.123 },
    attachmentType: AttachmentType.Attached,
    basementCeilingRenovationYear: 2005,
    constructionYear: 2000,
    facadeRenovationYear: 2010,
    floorCount: 5,
    heatedArea: 2500,
    heatingInstallationYear: 2021,
    heatingType: HeatingType.HeatPumpAir,
    photovoltaicNominalPower: 10.5,
    roofRenovationYear: 2018,
    windowsRenovationYear: 2015,
  };

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

  describe("POST /buildings", () => {
    it("should create a building successfully with ID provided", async () => {
      (db.saveBuilding as jest.Mock).mockReturnValue(validBuilding);

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: validBuilding,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(validBuilding);
      expect(db.saveBuilding).toHaveBeenCalledTimes(1);
      expect(db.saveBuilding).toHaveBeenCalledWith(validBuilding);
    });

    it("should create a building successfully without ID provided", async () => {
      const createdBuildingWithId = {
        ...validBuildingWithoutId,
        id: "CH-GENERATED",
      };
      (db.saveBuilding as jest.Mock).mockReturnValue(createdBuildingWithId);

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: validBuildingWithoutId,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(createdBuildingWithId);
      expect(db.saveBuilding).toHaveBeenCalledTimes(1);
      expect(db.saveBuilding).toHaveBeenCalledWith(validBuildingWithoutId);
    });

    it("should return 400 for invalid building payload (e.g., wrong type)", async () => {
      const invalidBuilding = { ...validBuilding, name: 123 };

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: invalidBuilding,
      });

      expect(response.statusCode).toBe(400);

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "body/ Unrecognized key(s) in object: 'name'",
      );
      expect(typeof body.message).toBe("string");

      expect(db.saveBuilding).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid ID format", async () => {
      const buildingWithInvalidId = { ...validBuilding, id: "INVALID-ID" };

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: buildingWithInvalidId,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        'body/id ID must start with "CH-" followed by digits',
      );
      expect(typeof body.message).toBe("string");
    });

    it("should return 400 for missing required fields (e.g., address)", async () => {
      const { address, ...buildingWithoutAddress } = validBuilding;

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: buildingWithoutAddress,
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty("message", "body/address Required");
      expect(typeof body.message).toBe("string");
    });

    it("should return 400 for invalid enum value (e.g., attachmentType)", async () => {
      const buildingWithInvalidEnum = {
        ...validBuilding,
        attachmentType: "wrong-type",
      };

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: buildingWithInvalidEnum,
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "body/attachmentType Invalid enum value. Expected 'detached' | 'attached', received 'wrong-type'",
      );
      expect(typeof body.message).toBe("string");
    });

    it("should return 409 for duplicate building ID", async () => {
      (db.saveBuilding as jest.Mock).mockImplementation(() => {
        throw new DuplicateBuildingIdError(validBuilding.id!);
      });

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: validBuilding,
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 409);
      expect(body).toHaveProperty("error", "Conflict");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "CH-12345" already exists.',
      );
      expect(typeof body.message).toBe("string");
      expect(db.saveBuilding).toHaveBeenCalledTimes(1);
      expect(db.saveBuilding).toHaveBeenCalledWith(validBuilding);
    });

    it("should return 500 for unexpected database errors", async () => {
      (db.saveBuilding as jest.Mock).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await app.inject({
        method: "POST",
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
        payload: validBuilding,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 500);
      expect(body).toHaveProperty("error", "Internal Server Error");
      expect(body).toHaveProperty("message", "Unexpected server error");
      expect(typeof body.message).toBe("string");

      expect(db.saveBuilding).toHaveBeenCalledTimes(1);
      expect(db.saveBuilding).toHaveBeenCalledWith(validBuilding);
    });
  });

  describe("GET /buildings", () => {
    it("should return a list of buildings", async () => {
      const buildingsList = [
        validBuilding,
        { ...validBuilding, id: "CH-67890" },
      ];
      (db.listBuildings as jest.Mock).mockReturnValue(buildingsList);

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(buildingsList);
      expect(db.listBuildings).toHaveBeenCalledTimes(1);
    });

    it("should return an empty array if no buildings exist", async () => {
      (db.listBuildings as jest.Mock).mockReturnValue([]);

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
      expect(db.listBuildings).toHaveBeenCalledTimes(1);
    });

    it("should return 500 for unexpected database errors", async () => {
      (db.listBuildings as jest.Mock).mockImplementation(() => {
        throw new Error("Database read error");
      });

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: "/v1/buildings",
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 500);
      expect(body).toHaveProperty("error", "Internal Server Error");
      expect(body).toHaveProperty("message", "Database read error");
      expect(typeof body.message).toBe("string");

      expect(db.listBuildings).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /buildings/:id", () => {
    const buildingId = validBuilding.id;

    it("should return a building by ID", async () => {
      const mockBuilding = { ...validBuilding, id: buildingId };
      (db.loadBuilding as jest.Mock).mockReturnValue(mockBuilding);

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockBuilding);
      expect(db.loadBuilding).toHaveBeenCalledTimes(1);
      expect(db.loadBuilding).toHaveBeenCalledWith(buildingId);
    });

    it("should return 404 if building is not found", async () => {
      const nonExistentId = "CH-NONEXISTENT-404";
      (db.loadBuilding as jest.Mock).mockReturnValue(null);

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${nonExistentId}`,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 404);
      expect(body).toHaveProperty("error", "Not Found");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "CH-NONEXISTENT-404" not found.',
      );
      expect(typeof body.message).toBe("string");

      expect(db.loadBuilding).toHaveBeenCalledTimes(1);
      expect(db.loadBuilding).toHaveBeenCalledWith(nonExistentId);
    });

    it("should return 404 if ID format in URL is invalid (simulating DB not finding it)", async () => {
      const buildingId = "INVALID-ID-FORMAT-GET";
      (db.loadBuilding as jest.Mock).mockReturnValue(null);

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 404);
      expect(body).toHaveProperty("error", "Not Found");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "INVALID-ID-FORMAT-GET" not found.',
      );
      expect(typeof body.message).toBe("string");

      expect(db.loadBuilding).toHaveBeenCalledTimes(1);
      expect(db.loadBuilding).toHaveBeenCalledWith(buildingId);
    });

    it("should return 500 for unexpected database errors", async () => {
      const buildingId = validBuilding.id;
      (db.loadBuilding as jest.Mock).mockImplementation(() => {
        throw new Error("Database fetch error");
      });

      const response = await app.inject({
        method: MethodType.Get,
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 500);
      expect(body).toHaveProperty("error", "Internal Server Error");
      expect(body).toHaveProperty("message", "Unexpected server error");
      expect(typeof body.message).toBe("string");

      expect(db.loadBuilding).toHaveBeenCalledTimes(1);
      expect(db.loadBuilding).toHaveBeenCalledWith(buildingId);
    });
  });

  describe("PATCH /buildings/:id", () => {
    const buildingId = validBuilding.id;
    const updatePayload = {
      heatedArea: 2000.75,
    };
    const updatedBuilding = {
      ...validBuilding,
      id: buildingId,
      ...updatePayload,
    };

    it("should update a building successfully", async () => {
      (db.updateBuilding as jest.Mock).mockReturnValue(updatedBuilding);

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: updatePayload,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(updatedBuilding);
      expect(db.updateBuilding).toHaveBeenCalledTimes(1);
      expect(db.updateBuilding).toHaveBeenCalledWith(buildingId, updatePayload);
    });

    it("should return 404 if building is not found during update", async () => {
      const nonExistentId = "CH-NONEXISTENT-PATCH";
      (db.updateBuilding as jest.Mock).mockImplementation(() => {
        throw new BuildingNotFoundError(nonExistentId);
      });

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${nonExistentId}`,
        payload: updatePayload,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 404);
      expect(body).toHaveProperty("error", "Not Found");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "CH-NONEXISTENT-PATCH" not found.',
      );
      expect(typeof body.message).toBe("string");

      expect(db.updateBuilding).toHaveBeenCalledWith(
        nonExistentId,
        updatePayload,
      );
    });

    it("should return 400 for invalid update payload structure (e.g., wrong type for a field)", async () => {
      const invalidPayload = { name: 123, gfa: "invalid" };

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: invalidPayload,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "body/ Unrecognized key(s) in object: 'name', 'gfa'",
      );
      expect(typeof body.message).toBe("string");

      expect(db.updateBuilding).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid enum value in update payload", async () => {
      const invalidPayload = { heatingType: "solar" };

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: invalidPayload,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "body/heatingType Invalid enum value. Expected 'gas' | 'oil' | 'heatPumpAir', received 'solar'",
      );
      expect(typeof body.message).toBe("string");
      expect(db.updateBuilding).not.toHaveBeenCalled();
    });

    it("should return 400 for an empty update payload", async () => {
      (db.updateBuilding as jest.Mock).mockReturnValue(updatedBuilding);

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: {},
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "Request body must include at least one field to update.",
      );
      expect(typeof body.message).toBe("string");

      expect(db.updateBuilding).not.toHaveBeenCalled();
    });

    it("should return 400 for an invalid building update (custom error from DB service)", async () => {
      const invalidUpdateErrorDetails = {
        field: "gfa",
        reason: "value too low",
      };
      (db.updateBuilding as jest.Mock).mockImplementation(() => {
        throw new InvalidBuildingUpdateError(invalidUpdateErrorDetails);
      });

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: updatePayload,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 400);
      expect(body).toHaveProperty("error", "Bad Request");
      expect(body).toHaveProperty(
        "message",
        "Invalid building update payload.",
      );
      expect(typeof body.message).toBe("string");

      expect(db.updateBuilding).toHaveBeenCalledTimes(1);
      expect(db.updateBuilding).toHaveBeenCalledWith(buildingId, updatePayload);
    });

    it("should return 500 for unexpected database errors during update", async () => {
      (db.updateBuilding as jest.Mock).mockImplementation(() => {
        throw new Error("Database update failed");
      });

      const response = await app.inject({
        method: "PATCH",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
        payload: updatePayload,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 500);
      expect(body).toHaveProperty("error", "Internal Server Error");
      expect(body).toHaveProperty("message", "Unexpected server error");
      expect(typeof body.message).toBe("string");
      expect(db.updateBuilding).toHaveBeenCalledTimes(1);
      expect(db.updateBuilding).toHaveBeenCalledWith(buildingId, updatePayload);
    });
  });

  describe("DELETE /buildings/:id", () => {
    const buildingId = validBuilding.id;

    it("should delete a building successfully", async () => {
      (db.deleteBuilding as jest.Mock).mockReturnValue(undefined);

      const response = await app.inject({
        method: "DELETE",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
      expect(db.deleteBuilding).toHaveBeenCalledTimes(1);
      expect(db.deleteBuilding).toHaveBeenCalledWith(buildingId);
    });

    it("should return 404 if building is not found during delete", async () => {
      const nonExistentId = "CH-NONEXISTENT-DELETE-404";
      (db.deleteBuilding as jest.Mock).mockImplementation(() => {
        throw new BuildingNotFoundError(nonExistentId);
      });

      const response = await app.inject({
        method: "DELETE",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${nonExistentId}`,
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 404);
      expect(body).toHaveProperty("error", "Not Found");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "CH-NONEXISTENT-DELETE-404" not found.',
      );
      expect(typeof body.message).toBe("string");

      expect(db.deleteBuilding).toHaveBeenCalledTimes(1);
      expect(db.deleteBuilding).toHaveBeenCalledWith(nonExistentId);
    });

    it("should return 404 if ID format in URL is invalid (simulating DB not finding it)", async () => {
      const buildingId = "INVALID-DELETE-ID-FORMAT";
      (db.deleteBuilding as jest.Mock).mockImplementation(() => {
        throw new BuildingNotFoundError(buildingId);
      });

      const response = await app.inject({
        method: "DELETE",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });
      const body = response.json();

      expect(body).toHaveProperty("statusCode", 404);
      expect(body).toHaveProperty("error", "Not Found");
      expect(body).toHaveProperty(
        "message",
        'Building with ID "INVALID-DELETE-ID-FORMAT" not found.',
      );
      expect(typeof body.message).toBe("string");

      expect(db.deleteBuilding).toHaveBeenCalledTimes(1);
      expect(db.deleteBuilding).toHaveBeenCalledWith(buildingId);
    });

    it("should return 500 for unexpected database errors during delete", async () => {
      const buildingId = validBuilding.id;
      (db.deleteBuilding as jest.Mock).mockImplementation(() => {
        throw new Error("Database delete failed");
      });

      const response = await app.inject({
        method: "DELETE",
        headers: {
          "x-api-key": "api-key",
        },
        url: `/v1/buildings/${buildingId}`,
      });

      const body = response.json();

      expect(body).toHaveProperty("statusCode", 500);
      expect(body).toHaveProperty("error", "Internal Server Error");
      expect(body).toHaveProperty("message", "Unexpected server error");
      expect(typeof body.message).toBe("string");

      expect(db.deleteBuilding).toHaveBeenCalledTimes(1);
      expect(db.deleteBuilding).toHaveBeenCalledWith(buildingId);
    });
  });
});
