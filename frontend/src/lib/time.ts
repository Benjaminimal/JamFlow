// TODO: rename to formatTimecode
/**
 * Formats a duration in seconds into a human-readable string.
 * The format is "HH:MM:SS" if hours are present, otherwise "MM:SS".
 *
 * @param duration - The duration in milliseconds.
 * @returns A string representing the formatted duration.
 *          For example, 3 661 000 ms will return "1:01:01", and
 *          61 000 ms will return "1:01".
 */
export function formatDuration(duration: number): string {
  const totalSeconds = Math.floor(duration / 1000);
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (num: number): string => String(num).padStart(2, "0");

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(String(hours));
  }
  parts.push(pad(minutes));
  parts.push(pad(seconds));

  return parts.join(":");
}

/**
 * Calculates the position of a given time as a percentage between a start and end time.
 *
 * @param time - The current time in milliseconds.
 * @param startTime - The start time in milliseconds.
 * @param endTime - The end time in milliseconds.
 * @returns The position as a percentage (0 to 100).
 *          Returns 0 if time is before startTime, 100 if after endTime.
 */
export function timeToPositionPercent(
  time: number,
  startTime: number,
  endTime: number,
): number {
  if (time < startTime) return 0;
  if (time > endTime) return 100;
  return ((time - startTime) / (endTime - startTime)) * 100;
}

/**
 * Calculates the time corresponding to a given percentage between a start and end time.
 *
 * @param percent - The percentage (0 to 100).
 * @param start - The start time in milliseconds.
 * @param end - The end time in milliseconds.
 * @returns The calculated time in milliseconds.
 */
export function percentToTime(
  percent: number,
  start: number,
  end: number,
): number {
  return start + (percent / 100) * (end - start);
}
