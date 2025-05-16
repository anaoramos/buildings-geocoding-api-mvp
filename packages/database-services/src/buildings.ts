import { Building, BuildingSchema } from "@challenge/library-schemas";
import { randomInt } from "crypto";

import {
  BuildingNotFoundError,
  DuplicateBuildingIdError,
  InvalidBuildingUpdateError,
} from "../../backend-api/src/errors";
import { AttachmentType, HeatingType } from "@challenge/types";

const DB: Record<string, Building> = {
  "CH-12345": {
    id: "CH-12345",
    address: {
      city: "Ossingen",
      countryCode: "CH",
      line1: "Wyden 1",
      postCode: "8475",
    },
    coordinates: {
      lat: 47.607623,
      lon: 8.715901,
    },
    attachmentType: AttachmentType.Detached,
    constructionYear: 1650,
    floorCount: 2,
    heatedArea: 286,
    heatingType: HeatingType.Gas,
    heatingInstallationYear: 1980,
    photovoltaicNominalPower: 12,
    basementCeilingRenovationYear: 1996,
    facadeRenovationYear: 1992,
    roofRenovationYear: 1990,
    windowsRenovationYear: 1994,
  },
};

const generateBuildingId = (): string => `CH-${randomInt(100000, 999999)}`;

export const loadBuilding = (id: string): Building | null => {
  return DB[id] || null;
};

export const saveBuilding = (building: Partial<Building>): Building => {
  let id = building.id;

  if (id && loadBuilding(id)) {
    throw new DuplicateBuildingIdError(id);
  }

  if (!id) {
    do {
      id = generateBuildingId();
    } while (loadBuilding(id));
  }

  const complete: Building = { ...building, id } as Building;

  DB[id] = complete;
  return complete;
};

export const deleteBuilding = (id: string): boolean => {
  if (!DB[id]) {
    throw new BuildingNotFoundError(id);
  }
  delete DB[id];
  return true;
};

export const listBuildings = (): Building[] => {
  return Object.values(DB);
};

export const updateBuilding = (
  id: string,
  updates: Partial<Building>,
): Building => {
  const existing = loadBuilding(id);
  if (!existing) throw new BuildingNotFoundError(id);

  const merged: Partial<Building> = {
    ...existing,
    ...updates,
  };

  const parsed = BuildingSchema.safeParse(merged);
  if (!parsed.success) {
    throw new InvalidBuildingUpdateError(parsed.error.format());
  }

  DB[id] = parsed.data;
  return parsed.data;
};
