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

  // Find the title
  let title = "";
  let titleIndex = -1;
  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i];
    let candidate = line
      .replace(/^#+\s*/, "")
      .replace(/^\*\*|\*\*$/g, "")
      .replace(/^\s*Recipe:?\s*/i, "")
      .trim();
    if (
      /^\*\*.+\*\*$/.test(line) ||
      /^#+\s*\w+/.test(line) ||
      /Recipe:/i.test(line)
    ) {
      title = candidate;
      titleIndex = i;
      break;
    }
  }
  // Fallback: use the first non-field, non-empty line as title
  if (!title) {
    for (let i = 0; i < cleanedLines.length; i++) {
      let line = cleanedLines[i];
      if (!/^\*\*\w+.*:\*\*/.test(line) && line.trim() !== "") {
        title = line
          .replace(/^#+\s*/, "")
          .replace(/^\*\*|\*\*$/g, "")
          .replace(/^\s*Recipe:?\s*/i, "")
          .trim();
        titleIndex = i;
        break;
      }
    }
  }
  // If still no title, fallback to first non-empty line
  if (!title && cleanedLines.length > 0) {
    for (let i = 0; i < cleanedLines.length; i++) {
      if (cleanedLines[i].trim() !== "") {
        title = cleanedLines[i]
          .replace(/^#+\s*/, "")
          .replace(/^\*\*|\*\*$/g, "")
          .replace(/^\s*Recipe:?\s*/i, "")
          .trim();
        titleIndex = i;
        break;
      }
    }
  }

  // Extract fields
  let prepTime = "";
  let cookingTime = "";
  let description = "";

  const fieldPatterns = [
    { key: "prepTime", regex: /^\*\*Prep\s*Time:\*\*\s*(.+)$/i },
    { key: "cookingTime", regex: /^\*\*Cook(?:ing)?\s*Time:\*\*\s*(.+)$/i },
    { key: "description", regex: /^\*\*Description:\*\*\s*(.+)$/i },
  ];

   let descriptionLineIndex = -1;

  const formattedLines: string[] = [];
  cleanedLines.forEach((line, idx) => {
    let isFieldLine = false;
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
            descriptionLineIndex = formattedLines.length; // Track where description is added
            break;
        }
        isFieldLine = true;
        break;
      }
    }
    // Insert a blank line before field lines (except if it's the first after the title or already preceded by a blank)
    if (
      isFieldLine &&
      idx !== titleIndex + 1 &&
      formattedLines.length > 0 &&
      formattedLines[formattedLines.length - 1] !== ""
    ) {
      formattedLines.push("");
    }
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
    // If this line is the description (not from **Description:** but from the first paragraph after title), track it
    if (!description && titleIndex > -1 && idx > titleIndex) {
      if (
        line.trim() !== "" &&
        !/^\*\*\w+.*:\*\*/.test(line) &&
        !/^\*\*Ingredients:\*\*/i.test(line) &&
        !/^\*\*Instructions:\*\*/i.test(line)
      ) {
        descriptionLineIndex = formattedLines.length - 1;
      }
    }
  });

  // If no explicit description, try to extract the first paragraph after the title
  if (!description && titleIndex > -1) {
    for (let i = titleIndex + 1; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      if (
        line.trim() !== "" &&
        !/^\*\*\w+.*:\*\*/.test(line) &&
        !/^\*\*Ingredients:\*\*/i.test(line) &&
        !/^\*\*Instructions:\*\*/i.test(line)
      ) {
        description = line.trim();
        // descriptionLineIndex is already set above
        break;
      }
    }
  }

  // --- Insert a blank line after the description if needed ---
  if (
    descriptionLineIndex > -1 &&
    descriptionLineIndex < formattedLines.length - 1 &&
    formattedLines[descriptionLineIndex + 1] !== ""
  ) {
    formattedLines.splice(descriptionLineIndex + 1, 0, "");
  }

  // Ensure a blank line after the title (before the next line, if it's not already blank)
  if (
    titleIndex > -1 &&
    formattedLines.length > titleIndex + 1 &&
    formattedLines[titleIndex + 1] !== ""
  ) {
    formattedLines.splice(titleIndex + 1, 0, "");
  }

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
    prepTime: parseTimeToMinutes(prepTime),
    cookingTime: parseTimeToMinutes(cookingTime),
    raw,
  };
}

// Helper function to parse time strings into minutes
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  let minutes = 0;
  const hourMatch = timeStr.match(/(\d+)\s*(hour|hr|h)/i);
  const minMatch = timeStr.match(/(\d+)\s*(minute|min|m)/i);
  if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) minutes += parseInt(minMatch[1], 10);
  // If only a number is given (e.g. "30"), treat as minutes
  if (!hourMatch && !minMatch) {
    const num = parseInt(timeStr, 10);
    if (!isNaN(num)) minutes = num;
  }
  return minutes;
}
