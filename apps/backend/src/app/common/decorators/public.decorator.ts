import { applyDecorators, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'skip-auth';
export const IS_UNPROTECTED_KEY = 'unprotected';

export const Public = () => applyDecorators(SetMetadata(IS_PUBLIC_KEY, true), SetMetadata(IS_UNPROTECTED_KEY, true));
