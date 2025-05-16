import "@fastify/swagger";

import {
  deleteBuilding,
  listBuildings,
  loadBuilding,
  saveBuilding,
  updateBuilding,
} from "@challenge/database-services";
import {
  ApiErrorSchema,
  Building,
  BuildingCollectionSchema,
  BuildingSchema,
} from "@challenge/library-schemas";
import { FastifyInstance, FastifyRequest } from "fastify";

import { BuildingNotFoundError, EmptyUpdatePayloadError } from "../errors";
import {
  BuildingParams,
  CreateBuildingBody,
  UpdateBuildingBody,
} from "packages/types/src/building";
import { MethodType } from "@challenge/types";
import { ApiError } from "@challenge/library-utils";

export const buildingRoute = (fastify: FastifyInstance) => {
  fastify.route({
    method: MethodType.Post,
    url: "/buildings",
    schema: {
      operationId: "createBuilding",
      tags: ["Building"],
      summary: "Create a building",
      security: [{ apiKey: [] }],
      body: BuildingSchema,
      response: {
        200: BuildingSchema,
        400: ApiErrorSchema,
        404: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: CreateBuildingBody }>,
      reply,
    ) => {
      const parsed = BuildingSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.format(),
        });
      }

      try {
        const building = saveBuilding(parsed.data);
        return reply.status(201).send(building);
      } catch (err) {
        if (err instanceof ApiError) {
          return reply.status(err.statusCode).send({
            statusCode: err.statusCode,
            error: err.error,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Unexpected server error",
        });
      }
    },
  });

  fastify.route({
    method: MethodType.Get,
    url: "/buildings",
    schema: {
      operationId: "listBuildings",
      tags: ["Building"],
      summary: "List all buildings",
      security: [{ apiKey: [] }],
      response: {
        200: BuildingCollectionSchema,
        400: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (_request, reply) => {
      const buildings = listBuildings();
      return reply.send(buildings);
    },
  });

  fastify.route({
    method: MethodType.Get,
    url: "/buildings/:id",
    schema: {
      operationId: "getBuilding",
      tags: ["Building"],
      summary: "Get a building by ID",
      security: [{ apiKey: [] }],
      response: {
        200: BuildingSchema,
        400: ApiErrorSchema,
        404: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: BuildingParams }>,
      reply,
    ) => {
      const { id } = request.params as { id: string };

      try {
        const building = loadBuilding(id);
        if (!building) {
          throw new BuildingNotFoundError(id);
        }

        return reply.send(building);
      } catch (err) {
        if (err instanceof ApiError) {
          return reply.status(err.statusCode).send({
            statusCode: err.statusCode,
            error: err.error,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Unexpected server error",
        });
      }
    },
  });

  fastify.route({
    method: MethodType.Patch,
    url: "/buildings/:id",
    schema: {
      operationId: "updateBuilding",
      tags: ["Building"],
      summary: "Update a building by ID",
      security: [{ apiKey: [] }],
      body: BuildingSchema.partial(),
      response: {
        200: BuildingSchema,
        400: ApiErrorSchema,
        404: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{
        Params: BuildingParams;
        Body: UpdateBuildingBody;
      }>,
      reply,
    ) => {
      const { id } = request.params as { id: string };

      try {
        if (!request.body || Object.keys(request.body).length === 0) {
          throw new EmptyUpdatePayloadError();
        }

        const updated = updateBuilding(id, request.body as Partial<Building>);
        return reply.status(200).send(updated);
      } catch (err) {
        if (err instanceof ApiError) {
          return reply.status(err.statusCode).send({
            statusCode: err.statusCode,
            error: err.error,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          });
        }

        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Unexpected server error",
        });
      }
    },
  });

  fastify.route({
    method: MethodType.Delete,
    url: "/buildings/:id",
    schema: {
      operationId: "deleteBuilding",
      tags: ["Building"],
      summary: "Delete a building by ID",
      security: [{ apiKey: [] }],
      response: {
        204: { type: "null" },
        400: ApiErrorSchema,
        404: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Params: BuildingParams }>,
      reply,
    ) => {
      const { id } = request.params as { id: string };

      try {
        deleteBuilding(id);
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ApiError) {
          return reply.status(err.statusCode).send({
            statusCode: err.statusCode,
            error: err.error,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
          });
        }
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Unexpected server error",
        });
      }
    },
  });
};
