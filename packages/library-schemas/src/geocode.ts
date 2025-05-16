import "@fastify/swagger";
import { z } from "./zod";
import { registry } from "./openapi";
import { AddressSchema, CoordinatesSchema } from "./shared";

export const GeocodeResultSchema = z
  .object({
    address: AddressSchema.describe(
      "Full address details of the geocoded location.",
    ),
    coordinates: CoordinatesSchema.describe(
      "Latitude and longitude of the location.",
    ),
  })
  .openapi("GeocodeResult");

export const GeocodeRequestSchema = z
  .object({
    searchText: z
      .string()
      .min(1)
      .describe("Text to search for geocoding, e.g., street or place name."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Maximum number of results to return."),
  })
  .strict()
  .openapi("GeocodeRequest");

export const GeocodeResponseSchema = z
  .array(GeocodeResultSchema)
  .describe("List of geocoding results.")
  .openapi("GeocodeResponse");

registry.register("GeocodeResult", GeocodeResultSchema);
registry.register("GeocodeRequest", GeocodeRequestSchema);
registry.register("GeocodeResponse", GeocodeResponseSchema);

export type GeocodeRequest = z.infer<typeof GeocodeRequestSchema>;
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;
