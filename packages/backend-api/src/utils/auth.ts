import { FastifyRequest, FastifyReply } from "fastify";

const VALID_API_KEY = process.env.API_KEY || "api-key";

export async function verifyApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const url = request.raw.url || "";

  const apiKey = request.headers["x-api-key"];

  if (url.startsWith("/docs") || url.startsWith("/status")) {
    return;
  }

  if (apiKey !== VALID_API_KEY) {
    return reply.status(403).send({
      statusCode: 403,
      error: "Forbidden",
      message: "Invalid API key",
    });
  }

  return;
}
