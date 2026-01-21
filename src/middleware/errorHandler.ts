import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
  code?: number;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // статус по умолчанию
  const status = err.status || 500;

  // (невалидный ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
      message: err.message,
    });
  }

  // Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      message: err.message,
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate key error",
      message: err.message,
    });
  }

  // Mongo connection error
  if (err.name === "MongooseServerSelectionError") {
    return res.status(503).json({
      success: false,
      error: "Database unavailable",
    });
  }

  // addКастомные ошибки
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
    });
  }

  // Логирование ошибки
  console.error("Error:", {
    message: err.message,
    status,
    stack: err.stack,
  });

  // отправка json клиенту
  res.status(status).json({
    success: false,
    error: err.message,
  });
}

// Middleware для обработки несуществующих маршрутов
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: "Not found!",
    message: `Route ${req.originalUrl} does not exist`,
  });
}
