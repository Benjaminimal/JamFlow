import {
  ApplicationError,
  AuthenticationError,
  ClientError,
  ConfigurationError,
  ConflictError,
  ExternalServiceError,
  NetworkError,
  NotFoundError,
  PermissionError,
  ValidationError,
} from "@/errors";
import { getErrorMessage } from "@/lib/errorUtils";

describe("getErrorMessage", () => {
  describe("when error ApplicationError", () => {
    it.each([
      // { error: new Error(""), expectedMessage: /something went wrong/i },
      {
        error: new ApplicationError(""),
        expectedMessage: /something went wrong/i,
      },
      {
        error: new ValidationError("", {}),
        expectedMessage: /correct the error/i,
      },
      {
        error: new ConfigurationError(""),
        expectedMessage: /something isn't set up correctly/i,
      },
      { error: new NetworkError(""), expectedMessage: /check your internet/i },
      { error: new AuthenticationError(""), expectedMessage: /log in/i },
      {
        error: new PermissionError(""),
        expectedMessage: /don't have permission/i,
      },
      { error: new NotFoundError(""), expectedMessage: /couldn't find/i },
      { error: new ConflictError(""), expectedMessage: /already exists/i },
      {
        error: new ClientError(""),
        expectedMessage: /something went wrong on our end/i,
      },
      {
        error: new ExternalServiceError(""),
        expectedMessage: /something went wrong on our end/i,
      },
    ])(
      "matches $expectedMessage for $error.constructor.name",
      ({ error, expectedMessage }) => {
        const message = getErrorMessage(error);
        expect(message).toMatch(expectedMessage);
      },
    );
  });

  describe("when error has valid message", () => {
    it.each([
      { error: "Error message", expected: "Error message" },
      { error: "  Error message  ", expected: "Error message" },
      { error: "\tError message\n", expected: "Error message" },
      { error: { statusText: "Status text" }, expected: "Status text" },
      { error: { statusText: " \t Status text \n " }, expected: "Status text" },
      { error: { message: "Message text" }, expected: "Message text" },
      { error: { message: " \n Message text \t " }, expected: "Message text" },
      {
        error: { statusText: "Status", message: "Message" },
        expected: "Status",
      },
      { error: { statusText: "", message: "Message" }, expected: "Message" },
      {
        error: { statusText: "\t \n", message: "Message" },
        expected: "Message",
      },
      {
        error: { statusText: undefined, message: "Message" },
        expected: "Message",
      },
      { error: { statusText: null, message: "Message" }, expected: "Message" },
    ])("returns '$expected' for $error", ({ error, expected }) => {
      expect(getErrorMessage(error)).toBe(expected);
    });
  });

  describe("when error has no valid message", () => {
    it.each([
      { error: "" },
      { error: "\n \t" },
      { error: undefined },
      { error: null },
      { error: 123 },
      { error: {} },
      { error: [] },
      { error: { statusText: undefined } },
      { error: { statusText: null } },
      { error: { statusText: 123 } },
      { error: { statusText: "" } },
      { error: { statusText: "\t \n" } },
      { error: { message: undefined } },
      { error: { message: null } },
      { error: { message: 123 } },
      { error: { message: "" } },
      { error: { message: "\t \n" } },
      { error: { notMessage: "foo" } },
      { error: { statusText: true, message: false } },
    ])("returns 'Unknown error' for $error", ({ error }) => {
      expect(getErrorMessage(error)).toBe("Unknown error");
    });
  });
});
