import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Use our own custom decorator because the default @Ip()
// decorator does not consider CloudFlare
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let ip = request.connection.remoteAddress
      ? request.connection.remoteAddress
      : request.remoteAddress;

    if (
      process.env.BEHIND_CLOUDFLARE_PROXY === 'true' &&
      typeof request.headers['cf-connecting-ip'] !== 'undefined'
    ) {
      ip = request.headers['cf-connecting-ip'];
    }
    return ip;
  },
);
