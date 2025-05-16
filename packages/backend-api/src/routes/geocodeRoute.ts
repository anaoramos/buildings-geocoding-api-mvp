import { loadGeocodeResult } from "@challenge/database-services";
import {
  ApiErrorSchema,
  GeocodeRequestSchema,
  GeocodeResponseSchema,
} from "@challenge/library-schemas";
import { FastifyInstance, FastifyRequest } from "fastify";

import {
  GeocodeResultNotFoundError,
  InvalidGeocodeRequestError,
  InvalidGeocodeResponseFormatError,
} from "../errors";
import { GeocodeRouteBody } from "packages/types/src/geocode";
import { MethodType } from "@challenge/types";
import { ApiError } from "@challenge/library-utils";

export const geocodeRoute = (fastify: FastifyInstance) => {
  fastify.route({
    method: MethodType.Post,
    url: "/geocoding",
    schema: {
      operationId: "geocode",
      tags: ["Geocoding"],
      summary: "Geocode an address",
      security: [{ apiKey: [] }],
      body: GeocodeRequestSchema,
      response: {
        200: GeocodeResponseSchema,
        400: ApiErrorSchema,
        404: ApiErrorSchema,
        500: ApiErrorSchema,
      },
    },
    handler: async (
      request: FastifyRequest<{ Body: GeocodeRouteBody }>,
      reply,
    ) => {
      try {
        const { searchText, limit = 5 } = request.body;
        const results = loadGeocodeResult(searchText);

        if (!results) {
          throw new GeocodeResultNotFoundError(searchText);
        }

        const limited = results.slice(0, Math.min(limit, 10));

        const responseCheck = GeocodeResponseSchema.safeParse(limited);
        if (!responseCheck.success) {
          throw new InvalidGeocodeResponseFormatError();
        }

        return reply.send(limited);
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
