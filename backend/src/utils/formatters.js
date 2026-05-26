export const minutesToHuman = (minutes) => {
  if (!minutes) return "0m";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return hrs ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
