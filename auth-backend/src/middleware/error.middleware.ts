import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const response: ApiResponse = {
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "production"
      ? {}
      : { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
