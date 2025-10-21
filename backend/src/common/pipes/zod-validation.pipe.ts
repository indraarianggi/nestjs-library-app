import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodTypeAny } from 'zod';
import { ZodError, type ZodIssue } from 'zod';

/**
 * ZodValidationPipe - Pipe for validating request data with Zod schemas
 * Validates request body, query, or params against a provided Zod schema
 * Throws BadRequestException with detailed error messages on validation failure
 *
 * Accepts ZodTypeAny to support schemas with refinements, transforms, and effects
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodTypeAny) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable structure
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
