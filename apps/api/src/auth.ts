import bcrypt from "bcryptjs";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@assetforge/db";
import { config, isProduction } from "./config.js";
import { HttpError } from "./http.js";
import type { AuthenticatedRequest, AuthUser } from "./types.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function setAuthCookie(response: Response, user: AuthUser) {
  const token = jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
  response.cookie(config.cookieName, token, cookieOptions);
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(config.cookieName, { ...cookieOptions, maxAge: undefined });
}

export const requireAuth: RequestHandler = async (request: Request, _response: Response, next: NextFunction) => {
  const token = request.cookies?.[config.cookieName];

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    (request as AuthenticatedRequest).user = user;
    next();
  } catch {
    next(new HttpError(401, "Authentication required"));
  }
};
