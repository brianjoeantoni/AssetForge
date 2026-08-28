import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";
import { isUuid } from "./utils.js";

type AuthTokenPayload = {
  sub: string;
};

export type AuthenticatedRequest = Request & {
  userId: string;
};

export function getAuthUserId(req: Request) {
  const token = req.cookies?.[config.authCookieName];

  if (typeof token !== "string") {
    return null;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

    if (!isUuid(payload.sub)) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  (req as AuthenticatedRequest).userId = userId;
  next();
}
