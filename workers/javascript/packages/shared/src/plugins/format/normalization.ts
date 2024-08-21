/**
 * Returns a normalized name that is valid JS
 * Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#variables
 *
 * @param name - The input name
 * @returns The JS safe name
 */
export const getNormalizedName = (name: string): string => {
  const replacementChar = '_';
  // Prepend if the first character is illegal
  name = name.match(/^[A-Za-z_$]/g) ? name : `${replacementChar}${name}`;
  // Replace every whitespace group
  name = name.replace(/\s+/g, replacementChar);
  // Replace all non alphanumeric characters - disallow all other unicode for sanity
  return name.replace(/[^A-Za-z0-9_$]/g, replacementChar);
};
