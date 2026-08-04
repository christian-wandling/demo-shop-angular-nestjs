import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type RoleOptions = {
  roles: string[];
};

/**
 * Restricts the decorated endpoint to callers holding at least one of the named roles.
 * @param options.roles - Role names, a realm role prefixed with "realm:" and a client role with "<client>:" or no prefix
 */
export const Roles = (options: RoleOptions) => SetMetadata(ROLES_KEY, options);
