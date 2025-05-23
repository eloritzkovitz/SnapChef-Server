// Get field values from recipe data
export function getField(recipeData: any, field: string, fallback: any) {
  const value = recipeData[field];
  if (typeof fallback === "string") {
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      !["Generated Recipe", "A recipe generated based on your ingredients."].includes(value.trim())
    ) {
      return value;
    }
    return fallback;
  }
  if (typeof fallback === "number") {
    return typeof value === "number" && value > 0 ? value : fallback;
  }
  return value !== undefined ? value : fallback;
}