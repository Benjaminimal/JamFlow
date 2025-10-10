/**
 * Copy text to clipboard
 *
 * @param text Text to copy
 * @returns True if successful, false otherwise
 */
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
