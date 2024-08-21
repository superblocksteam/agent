import slugify from 'slugify';

export function slugifyName(originalName: string): string {
  // this replace is very brittle but it's what we do in the CLI and fixes the average case
  return slugify(originalName, {
    replacement: '_',
    lower: true
  }).replace("'", "\\'");
}
