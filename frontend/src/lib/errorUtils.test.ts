import { getErrorMessage } from "@/lib/errorUtils";

describe("getErrorMessage", () => {
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
