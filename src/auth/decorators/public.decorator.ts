import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 *
 * Mark routes as public (skip JWT authentication)
 * Usage: @Public() above controller method
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
