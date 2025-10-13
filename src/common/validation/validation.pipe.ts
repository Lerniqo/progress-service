import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Custom validation pipe configuration for progress service
 * Provides detailed error messages and transforms input data
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true, // Automatically transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // Enable automatic type conversion
    },
    whitelist: true, // Strip properties that do not have decorators
    forbidNonWhitelisted: false, // Allow non-whitelisted properties (less strict)
    forbidUnknownValues: false, // Allow unknown values (less strict)
    disableErrorMessages: false, // Show detailed error messages
    validationError: {
      target: false, // Don't expose the target object in validation errors
      value: false, // Don't expose the value in validation errors
    },
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      // Custom error formatting for better API responses
      const formatError = (error: ValidationError): any => {
        const result: {
          property: string;
          constraints: Record<string, string>;
          children?: unknown[];
          value?: any;
        } = {
          property: error.property,
          constraints: error.constraints || {},
        };

        // Include the value for debugging
        if (error.value !== undefined) {
          result.value = error.value as unknown;
        }

        if (error.children && error.children.length > 0) {
          result.children = error.children.map(formatError);
        }

        return result;
      };

      const formattedErrors = validationErrors.map(formatError);

      // Log the detailed validation errors for debugging
      console.log(
        'Validation Errors:',
        JSON.stringify(formattedErrors, null, 2),
      );

      return new BadRequestException({
        message: 'Validation failed',
        statusCode: 400,
        errors: formattedErrors,
      });
    },
  });
}

/**
 * Validation pipe for optional fields only
 * Used for PATCH operations where only some fields may be present
 */
export function createOptionalValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: true, // Skip validation for missing properties
    validationError: {
      target: false,
      value: false,
    },
  });
}
