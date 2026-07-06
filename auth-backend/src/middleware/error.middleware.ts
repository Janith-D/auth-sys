import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: Error & { statusCode?: number; name?: string },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || res.statusCode;

  if (statusCode === 200) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      statusCode = 401;
    } else if (err.name === "ValidationError") {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "production"
      ? {}
      : { stack: err.stack }),
  });
};

export default errorHandler;
