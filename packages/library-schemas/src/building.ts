import { z } from "./zod";
import { registry } from "./openapi";
import { AddressSchema, CoordinatesSchema } from "./shared";
import { AttachmentType, HeatingType } from "@challenge/types";

const IdSchema = z
  .string()
  .regex(/^CH-\d+$/, 'ID must start with "CH-" followed by digits');

export const BuildingSchema = z
  .object({
    id: IdSchema.optional().describe(
      'Optional unique building ID starting with "CH-".',
    ),
    address: AddressSchema.describe(
      "Street address and postal information of the building.",
    ),
    coordinates: CoordinatesSchema.describe(
      "Geographic location of the building.",
    ),
    attachmentType: z
      .nativeEnum(AttachmentType)
      .describe("Whether the building is detached or attached."),
    basementCeilingRenovationYear: z
      .number()
      .int()
      .describe("Year basement ceiling was renovated."),
    constructionYear: z
      .number()
      .int()
      .describe("Year building was constructed."),
    floorCount: z
      .number()
      .int()
      .min(1)
      .describe("Number of floors in the building."),
    heatedArea: z
      .number()
      .min(1)
      .describe("Heated surface area in square meters."),
    facadeRenovationYear: z
      .number()
      .int()
      .describe("Year building facade was last renovated."),
    heatingInstallationYear: z
      .number()
      .int()
      .describe("Year current heating system was installed."),
    heatingType: z.nativeEnum(HeatingType).describe("Heating system type."),
    photovoltaicNominalPower: z
      .number()
      .describe("Nominal power of photovoltaic installation (kWp)."),
    roofRenovationYear: z.number().int().describe("Year roof was renovated."),
    windowsRenovationYear: z
      .number()
      .int()
      .describe("Year windows were renovated."),
  })
  .strict()
  .openapi("Building");

export const BuildingCollectionSchema = z
  .array(BuildingSchema)
  .openapi("BuildingCollection");

registry.register("Building", BuildingSchema);
registry.register("BuildingCollection", BuildingCollectionSchema);

export type Building = z.infer<typeof BuildingSchema>;
export type BuildingCollection = z.infer<typeof BuildingCollectionSchema>;
