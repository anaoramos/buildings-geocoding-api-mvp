import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { buildingRoute, geocodeRoute } from "./routes";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import fastifyAuth from "@fastify/auth";

import { verifyApiKey } from "./utils/auth";

export function createBackendApi() {
  const app = fastify({ logger: true });

  // Setup Zod validator & serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyAuth);

  app.register(swagger, {
    openapi: {
      info: {
        title: "Buildings Geocoding API",
        description:
          "API for geocoding building addresses and managing building data.",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
      tags: [
        {
          name: "Geocoding",
          description: "Endpoints for geocoding addresses.",
        },
        { name: "Building", description: "Endpoints for building management." },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "x-api-key",
            in: "header",
          },
        },
      },
    },
  });

  app.register(swaggerUI, {
    routePrefix: "/docs",
  });

  // // Register routes with /v1 prefix
  app.addHook("preHandler", verifyApiKey);
  app.register(geocodeRoute, { prefix: "/v1" });
  app.register(buildingRoute, { prefix: "/v1" });

  // Add health check endpoint
  app.get("/status", async () => ({ status: "ok" }));

  return app;
}
