import { formatDuration } from "@/lib/time";

describe("time", () => {
  describe("formatDuration", () => {
    it.each([
      { duration: 0, expected: "00:00" },
      { duration: 59_000, expected: "00:59" },
      { duration: 61_000, expected: "01:01" },
      { duration: 3599_000, expected: "59:59" },
      { duration: 3600_000, expected: "1:00:00" },
      { duration: 3661_000, expected: "1:01:01" },
      { duration: 90000_000, expected: "25:00:00" },
      { duration: 360000_000, expected: "100:00:00" },
    ])(
      "should format $duration seconds as $expected",
      ({ duration, expected }) => {
        expect(formatDuration(duration)).equal(expected);
      },
    );
  });
});
