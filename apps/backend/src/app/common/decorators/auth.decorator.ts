import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './roles.decorator';

/**
 * Custom decorator that combines role-based authorization and Swagger documentation
 * @param options.roles - Array of role names that are allowed to access the decorated endpoint
 * @returns Combined decorators for role-based access control and API authentication documentation
 */
export function Auth(options: { roles: string[] }) {
  const { roles } = options;

  return applyDecorators(Roles({ roles }), ApiBearerAuth());
}
