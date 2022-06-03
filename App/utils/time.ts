/**
 * Returns a date object pointing the current time, with a timezone offset.
 * @param timeZone time zone
 * @returns current date object in the given timezone.
 */
function getLocalDate(timeZone: string) {
  const localDateString = new Date().toLocaleString('en-US', { timeZone });
  const localDateObject = new Date(localDateString);
  return localDateObject;
}

export { getLocalDate };
