import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StructuredLogger extends Logger {
  private serviceName = 'progress-service';

  log(message: string, context?: string, ...optionalParams: any[]) {
    const logEntry = this.createLogEntry(
      'info',
      message,
      context,
      optionalParams,
    );
    super.log(logEntry, context);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    ...optionalParams: any[]
  ) {
    const logEntry = this.createLogEntry(
      'error',
      message,
      context,
      optionalParams,
      trace,
    );
    super.error(logEntry, trace, context);
  }

  warn(message: string, context?: string, ...optionalParams: any[]) {
    const logEntry = this.createLogEntry(
      'warn',
      message,
      context,
      optionalParams,
    );
    super.warn(logEntry, context);
  }

  debug(message: string, context?: string, ...optionalParams: any[]) {
    const logEntry = this.createLogEntry(
      'debug',
      message,
      context,
      optionalParams,
    );
    super.debug(logEntry, context);
  }

  verbose(message: string, context?: string, ...optionalParams: any[]) {
    const logEntry = this.createLogEntry(
      'verbose',
      message,
      context,
      optionalParams,
    );
    super.verbose(logEntry, context);
  }

  private createLogEntry(
    level: string,
    message: string,
    context?: string,
    optionalParams?: any[],
    trace?: string,
  ): any {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service_name: this.serviceName,
      log_level: level,
      message,
      context,
      ...(optionalParams &&
        optionalParams.length > 0 && { data: optionalParams }),
      ...(trace && { trace }),
    };

    return JSON.stringify(logEntry);
  }
}
