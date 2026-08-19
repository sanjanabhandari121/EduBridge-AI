import { Request, Response, NextFunction } from "express";

// Central error handler: never leak stack traces to the client.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Something went wrong.";
  const safeMessage = process.env.NODE_ENV === "production" ? "Something went wrong. Please try again." : message;
  res.status(500).json({ error: safeMessage });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "That resource could not be found." });
}
