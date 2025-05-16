import { z } from "./zod";
import { registry } from "./openapi";

export const AddressSchema = z
  .object({
    line1: z.string().min(1).describe("Street address line 1."),
    postCode: z.string().min(1).describe("Postal or ZIP code."),
    city: z.string().min(1).describe("City name."),
    countryCode: z
      .string()
      .min(1)
      .length(2)
      .describe('ISO 2-letter country code (e.g., "US", "CH").'),
  })
  .openapi("Address");

export const CoordinatesSchema = z
  .object({
    lat: z.number().min(-90).max(90).describe("Latitude in decimal degrees."),
    lon: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude in decimal degrees."),
  })
  .openapi("Coordinates");

registry.register("Address", AddressSchema);
registry.register("Coordinates", CoordinatesSchema);

export type Address = z.infer<typeof AddressSchema>;
export type Coordinates = z.infer<typeof CoordinatesSchema>;
