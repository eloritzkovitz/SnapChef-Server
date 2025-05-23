// Helper to parse recipe string into an object
export function parseRecipeString(recipeStr: string) {
  const lines = recipeStr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Remove conversational intros
  const cleanedLines = lines.filter(
    (line) => !/^okay[,.\s-]*|^here('|’)s[,.\s-]*|^this is[,.\s-]*/i.test(line)
  );

  // Extract fields
  let title = "Recipe";
  let titleIndex = 0;
  let prepTime = "";
  let cookingTime = "";
  let description = "";

  // Find the title
  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i];
    // Remove all heading/bold markdown and "Recipe:" for the title field
    let candidate = line
      .replace(/^#+\s*/, "") // Remove all heading markdown (any number of #)
      .replace(/^\*\*|\*\*$/g, "") // Remove bold markdown
      .replace(/^\s*Recipe:?\s*/i, "") // Remove "Recipe:" at the start
      .trim();
    if (
      /^\*\*.+\*\*$/.test(line) ||
      /^#+\s*\w+/.test(line) ||
      /Recipe:/i.test(line)
    ) {
      title = candidate; // Clean, no markdown
      titleIndex = i;
      break;
    }
  }
  if (title === "Recipe" && cleanedLines.length > 0) {
    title = cleanedLines[0]
      .replace(/^#+\s*/, "")
      .replace(/^\*\*|\*\*$/g, "")
      .replace(/^\s*Recipe:?\s*/i, "")
      .trim();
    titleIndex = 0;
  }

  // Extract fields from the lines
  const fieldPatterns = [
    { key: "prepTime", regex: /^\*\*Prep\s*Time:\*\*\s*(.+)$/i },
    { key: "cookingTime", regex: /^\*\*Cook(?:ing)?\s*Time:\*\*\s*(.+)$/i },
    { key: "description", regex: /^\*\*Description:\*\*\s*(.+)$/i },
  ];

  // Remove field lines and extract their values
  const formattedLines: string[] = [];
  cleanedLines.forEach((line, idx) => {
    let matched = false;
    for (const field of fieldPatterns) {
      const match = line.match(field.regex);
      if (match) {
        switch (field.key) {
          case "prepTime":
            prepTime = match[1].trim();
            break;
          case "cookingTime":
            cookingTime = match[1].trim();
            break;
          case "description":
            description = match[1].trim();
            break;
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Insert a blank line before bolded sections (except the title)
      if (
        idx !== titleIndex &&
        /^\*\*.+\*\*$/.test(line) &&
        formattedLines.length > 0 &&
        formattedLines[formattedLines.length - 1] !== ""
      ) {
        formattedLines.push("");
      }
      formattedLines.push(line);
    }
  });

  // Insert the title as a markdown heading at the top, with a blank line after
  const raw = [
    `# ${title}`,
    "",
    ...formattedLines.filter((_, idx) => idx !== titleIndex),
  ]
    .join("\n")
    .trim();

  return {
    title,
    description,
    prepTime,
    cookingTime,
    raw,
  };
}