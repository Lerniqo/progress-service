import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'hostname,pid',
              singleLine: false,
              levelFirst: true,
            },
          }
        : undefined,
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => {
        return { log_level: label };
      },
    },
    base: {
      service_name: 'progress-service',
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    serializers: {
      req: (req: {
        method: string;
        url: string;
        headers: Record<string, string>;
        remoteAddress: string;
        remotePort: number;
      }) => ({
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res: { statusCode: number }) => ({
        statusCode: res.statusCode,
      }),
    },
  },
};
