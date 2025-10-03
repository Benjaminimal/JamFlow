import axios from "axios";

import { mapAxiosError } from "@/api/errorHandler";
import {
  ApplicationError,
  AuthenticationError,
  ClientError,
  ConflictError,
  ExternalServiceError,
  NetworkError,
  NotFoundError,
  PermissionError,
  ValidationError,
} from "@/errors";

describe("errorHandler", () => {
  describe("mapAxiosError", () => {
    it("returns ApplicationError for non axios error", () => {
      const error = new Error("Something went wrong");

      const mappedError = mapAxiosError(error);
      expect(mappedError).toBeInstanceOf(ApplicationError);
      expect(mappedError.cause).toBe(error);
    });

    it("returns NetworkError if response is missing", () => {
      vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);

      const error = {};
      const mappedError = mapAxiosError(error);

      expect(mappedError).toBeInstanceOf(NetworkError);
      expect(mappedError.cause).toBe(error);
    });
    it("returns NetworkError for timeout errors", () => {
      vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);

      const error = { code: "ETIMEDOUT" };
      const mappedError = mapAxiosError(error);
      expect(mappedError).toBeInstanceOf(NetworkError);
      expect(mappedError.message).toMatch(/timed out/i);
    });

    it("enriches ValidationError with server provided errors", () => {
      vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);

      const error = {
        response: {
          status: 400,
          data: {
            details: [
              { message: "Not related to a field" },
              { message: "Field specific", field: "unknown_field" },
              { message: "File too large", field: "upload_file" },
              { message: "Invalid format", field: "upload_file" },
            ],
          },
        },
      };
      const mappedError = mapAxiosError(error);

      expect(mappedError).toBeInstanceOf(ValidationError);
      expect(mappedError.cause).toBe(error);

      const validationError = mappedError as ValidationError;
      expect(validationError.details).toEqual({
        nonField: ["Not related to a field"],
        unknown_field: ["Field specific"],
        file: ["File too large", "Invalid format"],
      });
    });

    it.each([
      {
        status: 401,
        expectedError: AuthenticationError,
      },
      {
        status: 403,
        expectedError: PermissionError,
      },
      {
        status: 404,
        expectedError: NotFoundError,
      },
      {
        status: 405,
        expectedError: ClientError,
      },
      {
        status: 409,
        expectedError: ConflictError,
      },
      {
        status: 418,
        expectedError: ClientError,
      },
      {
        status: 500,
        expectedError: ExternalServiceError,
      },
    ])(
      "returns $expectedError.name for $status",
      ({ status, expectedError }) => {
        vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);

        const error = { response: { status } };
        const mappedError = mapAxiosError(error);
        expect(mappedError).toBeInstanceOf(expectedError);
        expect(mappedError.cause).toBe(error);
      },
    );
  });
});
