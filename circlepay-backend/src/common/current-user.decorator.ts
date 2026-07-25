import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  phone: string;
}

/** Injects the authenticated user (set by JwtAuthGuard) into a controller arg. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? req.user[data] : req.user;
  },
);
