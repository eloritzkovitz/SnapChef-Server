import fs from "fs";
import path from "path";

// Helper to read and parse the log file
export function readLogs() {
  const logPath = path.resolve(__dirname, "../../../logs/combined.log");
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Helper to extract name or title from the log message
export function extractNameFromMessage(message: string) {
  const match = message.match(/"name":"([^"]+)"/);
  return match ? match[1] : null;
}

export function extractTitleFromMessage(message: string) {
  const match = message.match(/"title":"([^"]+)"/);
  return match ? match[1] : null;
}