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
