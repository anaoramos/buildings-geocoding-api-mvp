// src/api.ts
import fastify from "fastify";

// src/routes/helloRoute.ts
var helloRoute = (fastify2) => {
  fastify2.route({
    method: "POST",
    url: "/webhook",
    handler: async (request, reply) => {
      const data = request.body;
      console.log({ data });
      return reply.send(data);
    }
  });
};

// src/routes/geocoding.ts
var Location = class {
  constructor(address, coordinates) {
    this.address = address;
    this.coordinates = coordinates;
  }
};
var Address = class {
  constructor(line1, postcode, city, countryCode) {
    this.line1 = line1;
    this.postcode = postcode;
    this.city = city;
    this.countryCode = countryCode;
  }
};
var Coordinate = class {
  constructor(lat, lon) {
    this.lat = lat;
    this.lon = lon;
  }
};
var DETAIL_SPLIT_REGEX = /^(.+?)\s*<b>\s*(\d+)\s+([^<]+)\s*<\/b>$/;
async function getLocations(searchText, limit = 10) {
  const resp = await fetch(
    "https://api3.geo.admin.ch/rest/services/api/SearchServer?" + new URLSearchParams({
      searchText,
      type: "locations"
    }).toString()
  );
  if (!resp.ok) {
    throw new Error("Gateway Error");
  }
  const locs = await resp.json();
  let result = locs.results.map((l) => {
    if (!l.attrs.label) {
      throw new Error("Missing label");
    }
    let match = l.attrs.label.match(DETAIL_SPLIT_REGEX);
    return new Location(
      new Address(
        match[1],
        match[2],
        match[3],
        "CH"
      ),
      new Coordinate(
        l.attrs.lat,
        l.attrs.lon
      )
    );
  });
  result = result.slice(0, limit);
  return result;
}
var geocodingRoute = (fastify2) => {
  fastify2.addSchema({
    $id: "location",
    type: "object",
    properties: {
      address: {
        type: "object",
        properties: {
          line1: { type: "string" },
          postcode: { type: "string" },
          city: { type: "string" },
          countryCode: { type: "string" }
        }
      },
      coordinates: {
        type: "object",
        properties: {
          lat: { type: "string" },
          lon: { type: "string" }
        }
      }
    }
  });
  fastify2.route({
    method: "POST",
    preHandler: fastify2.authenticate,
    url: "/v1/geocoding",
    handler: async (request, reply) => {
      const { searchText, limit } = request.body;
      return reply.send(await getLocations(searchText, limit));
    },
    schema: {
      body: {
        type: "object",
        required: ["searchText"],
        properties: {
          searchText: { type: "string" },
          limit: { type: "number", maximum: 10 }
        }
      },
      response: {
        200: {
          type: "array",
          items: { $ref: "location" }
        }
      }
    }
  });
};

// ../database-services/src/buildings.ts
var DB = {};
var flatToNested = (flatData, id) => {
  const {
    line1,
    postCode,
    city,
    countryCode,
    ...otherProps
  } = flatData;
  const result = { ...otherProps };
  if (id) result.id = id;
  if (line1 !== void 0 || postCode !== void 0 || city !== void 0 || countryCode !== void 0) {
    result.address = {
      ...line1 !== void 0 && { line1 },
      ...postCode !== void 0 && { postCode },
      ...city !== void 0 && { city },
      ...countryCode !== void 0 && { countryCode }
    };
  }
  return result;
};
var updateBuildingProperties = (existingBuilding, updates) => {
  const result = { ...existingBuilding || {} };
  if (updates.address) {
    result.address = { ...result.address || {}, ...updates.address };
  }
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "address" && value !== void 0) {
      result[key] = value;
    }
  });
  return result;
};
var loadBuilding = (id) => {
  return DB[id] ? { ...DB[id] } : null;
};
var createBuilding = (id, building) => {
  const newBuilding = { ...building, id };
  DB[id] = newBuilding;
  return { ...newBuilding };
};
var updateBuilding = (id, building) => {
  DB[id] = { ...building };
  return { ...building };
};
var deleteBuilding = (id) => {
  if (!(id in DB)) {
    return false;
  }
  delete DB[id];
  return true;
};

// src/routes/buildings.ts
var buildingsRoute = (fastify2) => {
  fastify2.addSchema({
    $id: "building",
    type: "object",
    properties: {
      id: { type: "string" },
      address: { $ref: "address" },
      attachmentType: { type: "string" },
      constructionYear: { type: "number" },
      floorCount: { type: "number" },
      heatedArea: { type: "number" },
      heatingType: { type: "string" },
      heatingInstallationYear: { type: "number" },
      photovoltaicNominalPower: { type: "number" },
      basementCeilingRenovationYear: { type: "number" },
      facadeRenovationYear: { type: "number" },
      roofRenovationYear: { type: "number" },
      windowsRenovationYear: { type: "number" }
    }
  });
  fastify2.addSchema({
    $id: "address",
    type: "object",
    properties: {
      line1: { type: "string" },
      postCode: { type: "string" },
      city: { type: "string" },
      countryCode: { type: "string" }
    }
  });
  fastify2.addSchema({
    $id: "flatBuilding",
    type: "object",
    properties: {
      line1: { type: "string" },
      postCode: { type: "string" },
      city: { type: "string" },
      countryCode: { type: "string", default: "CH" },
      attachmentType: { type: "string" },
      constructionYear: { type: "number" },
      floorCount: { type: "number" },
      heatedArea: { type: "number" },
      heatingType: { type: "string" },
      heatingInstallationYear: { type: "number" },
      photovoltaicNominalPower: { type: "number" },
      basementCeilingRenovationYear: { type: "number" },
      facadeRenovationYear: { type: "number" },
      roofRenovationYear: { type: "number" },
      windowsRenovationYear: { type: "number" }
    }
  });
  fastify2.route({
    method: "GET",
    url: "/v1/buildings/:id",
    handler: async (request, reply) => {
      const { id } = request.params;
      const building = loadBuilding(id);
      if (!building) {
        return reply.code(404).send({ error: "Building not found" });
      }
      return reply.send(building);
    },
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        200: { $ref: "building" },
        404: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  });
  fastify2.route({
    method: "PUT",
    url: "/v1/buildings/:id",
    handler: async (request, reply) => {
      const { id } = request.params;
      const flatData = request.body;
      if (flatData.countryCode === void 0) {
        flatData.countryCode = "CH";
      }
      const nestedData = flatToNested(flatData, id);
      const building = updateBuildingProperties(null, nestedData);
      const createdBuilding = createBuilding(id, building);
      return reply.code(201).send(createdBuilding);
    },
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: { $ref: "flatBuilding" },
      response: {
        201: { $ref: "building" },
        400: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  });
  fastify2.route({
    method: "PATCH",
    url: "/v1/buildings/:id",
    handler: async (request, reply) => {
      const { id } = request.params;
      const existingBuilding = loadBuilding(id);
      if (!existingBuilding) {
        return reply.code(404).send({ error: "Building not found" });
      }
      const updates = flatToNested(request.body);
      const updatedBuilding = updateBuildingProperties(existingBuilding, updates);
      const result = updateBuilding(id, updatedBuilding);
      return reply.send(result);
    },
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: { $ref: "flatBuilding" },
      response: {
        200: { $ref: "building" },
        404: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  });
  fastify2.route({
    method: "DELETE",
    url: "/v1/buildings/:id",
    handler: async (request, reply) => {
      const { id } = request.params;
      const success = deleteBuilding(id);
      if (!success) {
        return reply.code(404).send({ error: "Building not found" });
      }
      return reply.code(204).send();
    },
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        204: {
          type: "null",
          description: "Building successfully deleted"
        },
        404: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  });
};

// src/api.ts
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
var AUTH_HEADER = "X-API-Key";
async function createBackendApi() {
  const app = fastify({ logger: true });
  app.decorate("authenticate", async (request, reply) => {
    if (!(AUTH_HEADER.toLowerCase() in request.headers)) {
      return reply.code(401).send({ error: "Missing X-API-Key header" });
    }
    if (request.headers[AUTH_HEADER.toLowerCase()] !== "open-sesame") {
      return reply.code(403).send({ error: "Incorrect Auth token" });
    }
  });
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Norm Coding challenge"
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server"
        }
      ],
      tags: [],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "X-API-Key",
            in: "header"
          }
        }
      },
      security: [{ apiKey: [] }],
      externalDocs: {}
    }
  });
  app.register(helloRoute);
  app.register(geocodingRoute);
  app.register(buildingsRoute);
  app.get("/status", async () => {
    return { status: "ok" };
  });
  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false
    },
    uiHooks: {
      onRequest: function(request, reply, next) {
        next();
      },
      preHandler: function(request, reply, next) {
        next();
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });
  return app;
}

// src/index.ts
var start = async () => {
  const api = await createBackendApi();
  const port = parseInt(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "localhost";
  try {
    api.ready(() => {
      console.log(api.printRoutes());
    });
    await api.listen({ port, host });
    console.log(`
Server is running: http://${host}:${port}
`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();
//# sourceMappingURL=index.js.map