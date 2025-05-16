// Extract the title from the prompt output
export const extractTitleFromPrompt = (promptOutput: string[] | string): string => {
  if (!promptOutput) {
    return "Untitled Recipe";
  }
  const lines = Array.isArray(promptOutput)
    ? promptOutput.map((line) => line.trim())
    : promptOutput.split("\n").map((line) => line.trim());

  for (const line of lines) {
    if (line.startsWith("##") || line.startsWith("**Recipe:")) {
      return line.replace(/##|(\*\*Recipe:)|\*\*/g, "").trim();
    }
  }
  return lines.find((line) => line.length > 0) || "Untitled Recipe";
};

// Extract the description from the prompt output
export const extractDescriptionFromPrompt = (promptOutput: string[] | string): string => {
  if (!promptOutput) {
    return "No description available.";
  }
  const lines = Array.isArray(promptOutput)
    ? promptOutput.map((line) => line.trim())
    : promptOutput.split("\n").map((line) => line.trim());

  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith("##") || line.startsWith("**Recipe:")) {
      foundTitle = true;
      continue;
    }
    if (
      foundTitle &&
      line.length > 0 &&
      !line.startsWith("**Ingredients:**") &&
      !line.startsWith("**Instructions:**")
    ) {
      return line.replace(/\*\*/g, "").trim();
    }
  }
  return "No description available.";
};