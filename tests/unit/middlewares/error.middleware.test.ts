import httpStatus from "http-status";
import httpMocks from "node-mocks-http";
import {
  errorConverter,
  errorHandler
} from "../../../src/middlewares/error.middleware.ts";
import ApiError from "../../../src/utils/ApiError.ts";
import { describe, test, expect, vi, beforeEach } from "vitest";
import logger from "../../../src/config/logger.ts";
import config from "../../../src/config/config.ts";
import type { NodeEnv } from "../../../src/types/env.type.ts";

describe("Error middlewares", () => {
  describe("Error converter", () => {
    test("should return the same ApiError object it was called with", () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const next = vi.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    test("should convert Error to ApiError with status 500", () => {
      const error = new Error();
      const next = vi.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next
      );

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
          isOperational: false
        })
      );
    });
  });

  describe("Error handler", () => {
    beforeEach(() => {
      vi.spyOn(logger, "error").mockImplementation(vi.fn());
    });

    test("should send proper error response and put the error message in res.locals", () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const res = httpMocks.createResponse();
      const sendSpy = vi.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, vi.fn());

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: error.statusCode,
          message: error.message
        })
      );
      expect(res.locals.errorMessage).toBe(error.message);
    });

    test("should put the error stack in the response if in development mode", () => {
      config.env = "development";
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const res = httpMocks.createResponse();
      const sendSpy = vi.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, vi.fn());

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: error.statusCode,
          message: error.message,
          stack: error.stack
        })
      );
      config.env = process.env.NODE_ENV as NodeEnv;
    });

    test("should send internal server error status and message if in production mode and error is not operational", () => {
      config.env = "production";
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error", false);
      const res = httpMocks.createResponse();
      const sendSpy = vi.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, vi.fn());

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR]
        })
      );
      expect(res.locals.errorMessage).toBe(error.message);
      config.env = process.env.NODE_ENV as NodeEnv;
    });

    test("should preserve original error status and message if in production mode and error is operational", () => {
      config.env = "production";
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const res = httpMocks.createResponse();
      const sendSpy = vi.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, vi.fn());

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: error.statusCode,
          message: error.message
        })
      );
      config.env = process.env.NODE_ENV as NodeEnv;
    });
  });
});
