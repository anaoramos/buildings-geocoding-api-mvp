import { hello } from '@challenge/library-utils';
import { FastifyInstance } from 'fastify';

export const helloRoute = (fastify: FastifyInstance) => {
  fastify.route({
    method: 'POST',
    url: '/hello',
    handler: async (request, reply) => {
      return reply.send(hello());
    },
  });
};
