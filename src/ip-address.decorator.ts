import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

// Use our own custom decorator because the default @Ip()
// decorator does not consider CloudFlare
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: FastifyRequest = ctx.switchToHttp().getRequest();
    let ip = request.socket.remoteAddress;

    if (
      process.env.BEHIND_CLOUDFLARE_PROXY === 'true' &&
      typeof request.headers['cf-connecting-ip'] !== 'undefined'
    ) {
      const cfConnectingIp = request.headers['cf-connecting-ip'];
      if (Array.isArray(cfConnectingIp)) {
        ip = cfConnectingIp[0];
      } else {
        ip = cfConnectingIp;
      }
    }
    return ip;
  },
);
