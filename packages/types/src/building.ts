import { Building } from "@challenge/library-schemas/src/building";
export enum HeatingType {
  Gas = "gas",
  Oil = "oil",
  HeatPumpAir = "heatPumpAir",
}

export enum AttachmentType {
  Detached = "detached",
  Attached = "attached",
}

export interface BuildingParams {
  id: string;
}

export type CreateBuildingBody = Omit<Building, "id">;
export type UpdateBuildingBody = Partial<CreateBuildingBody>;
