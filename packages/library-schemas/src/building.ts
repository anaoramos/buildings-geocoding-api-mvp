import { z } from 'zod';

const IdSchema = z.string();

const AddressSchema = z.object({
  line1: z.string(),
  postCode: z.string(),
  city: z.string(),
  countryCode: z.string().length(2), // ISO country code (2 characters)
});

const BuildingSchema = z.object({
  id: IdSchema,
  address: AddressSchema,
  // ... other fields
});

type Building = z.infer<typeof BuildingSchema>;

export { AddressSchema, type Building, BuildingSchema };
