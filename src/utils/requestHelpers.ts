import { Request } from "express";

export function getUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}