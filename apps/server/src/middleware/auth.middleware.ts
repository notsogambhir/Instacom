import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { AuthPayload, UserRole } from '@instacom/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Augment FastifyRequest to include user
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthPayload;
    }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.code(401).send({ message: 'Missing or invalid token' });
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
        request.user = payload;
    } catch (err) {
        return reply.code(401).send({ message: 'Invalid token' });
    }
};

export const requireRole = (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
            return reply.code(401).send({ message: 'Not authenticated' });
        }
        if (!roles.includes(request.user.role)) {
            return reply.code(403).send({ message: 'Insufficient permissions' });
        }
    };
};
