import { GeocodeResult } from "@challenge/library-schemas";

const DB: Record<string, GeocodeResult[]> = {
  berninastrasse: [
    {
      address: {
        line1: "Berninastrasse 1",
        postCode: "4313",
        city: "Möhlin",
        countryCode: "CH",
      },
      coordinates: {
        lat: 47.55795669555664,
        lon: 7.850382328033447,
      },
    },
    {
      address: {
        line1: "Berninastrasse 2",
        postCode: "8057",
        city: "Zürich",
        countryCode: "CH",
      },
      coordinates: {
        lat: 47.402687072753906,
        lon: 8.55298900604248,
      },
    },
    {
      address: {
        line1: "Berninastrasse 2",
        postCode: "5430",
        city: "Wettingen",
        countryCode: "CH",
      },
      coordinates: {
        lat: 47.462093353271484,
        lon: 8.314849853515625,
      },
    },
  ],
};

export const loadGeocodeResult = (query: string): GeocodeResult[] | null => {
  return DB[query.toLowerCase()];
};
