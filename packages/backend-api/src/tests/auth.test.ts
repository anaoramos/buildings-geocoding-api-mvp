import { FastifyInstance } from "fastify";

import { createBackendApi } from "../api";
import { MethodType } from "@challenge/types";

describe("X-API-Key Authentication", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createBackendApi();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should reject requests without API key", async () => {
    const res = await app.inject({
      method: MethodType.Get,
      url: "/v1/buildings",
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      statusCode: 403,
      error: "Forbidden",
      message: "Invalid API key",
    });
  });

  it("should reject requests with invalid API key", async () => {
    const res = await app.inject({
      method: MethodType.Get,
      url: "/buildings",
      headers: {
        "x-api-key": "wrong-key",
      },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({
      statusCode: 403,
      error: "Forbidden",
      message: "Invalid API key",
    });
  });

  it("should allow requests with valid API key", async () => {
    const res = await app.inject({
      method: MethodType.Get,
      url: "/v1/buildings",
      headers: {
        "x-api-key": "api-key",
      },
    });

    expect(res.statusCode).toBe(200);
  });
});
