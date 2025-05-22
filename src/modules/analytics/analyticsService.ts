import fs from "fs";
import path from "path";

// Helper to read and parse the log file
function readLogs() {
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
function extractNameFromMessage(message: string) {
  const match = message.match(/"name":"([^"]+)"/);
  return match ? match[1] : null;
}

// Helper to extract title from the log message
function extractTitleFromMessage(message: string) {
  const match = message.match(/"title":"([^"]+)"/);
  return match ? match[1] : null;
}

const analyticsService = {

    // Get popular ingredients  
    getPopularIngredients: async () => {
    const logs = readLogs();
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        log.message.startsWith("Ingredient added to fridge")
      ) {
        const name = extractNameFromMessage(log.message);
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get popular groceries
  getPopularGroceries: async () => {
    const logs = readLogs();
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        log.message.startsWith("Grocery item added to fridge")
      ) {
        const name = extractNameFromMessage(log.message);
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get popular recipes
  getPopularRecipes: async () => {
    const logs = readLogs();
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        (log.message.startsWith("Recipe generated with ingredients") ||
         log.message.startsWith("Recipe added to cookbook"))
      ) {
        const title = extractTitleFromMessage(log.message);
        if (title) counts[title] = (counts[title] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get active users
  getActiveUsers: async () => {
    const logs = readLogs();
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        log.message.startsWith("User data fetched for user:")
      ) {
        const match = log.message.match(/user: ([a-zA-Z0-9]+)/);
        if (match) {
          const userId = match[1];
          counts[userId] = (counts[userId] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .map(([userId, actions]) => ({ userId, actions }))
      .sort((a, b) => b.actions - a.actions);
  },

  // Get ingredient trends over time
  getIngredientTrends: async (interval: string = "day") => {
    const logs = readLogs();
    const trends: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        log.message.startsWith("Ingredient added to fridge") &&
        log.timestamp
      ) {
        const date = interval === "day"
          ? log.timestamp.slice(0, 10)
          : log.timestamp.slice(0, 7); // YYYY-MM or YYYY-MM-DD
        trends[date] = (trends[date] || 0) + 1;
      }
    });
    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Get error stats
  getErrorStats: async () => {
    const logs = readLogs();
    let totalErrors = 0;
    let last24h = 0;
    const byType: Record<string, number> = {};
    const now = Date.now();
    logs.forEach(log => {
      if (log.level === "error") {
        totalErrors++;
        if (log.timestamp && (now - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000)) {
          last24h++;
        }
        // Try to extract a type from the message
        const typeMatch = log.message.match(/(\w+) error/i);
        const type = typeMatch ? typeMatch[1].toLowerCase() : "unknown";
        byType[type] = (byType[type] || 0) + 1;
      }
    });
    return { totalErrors, last24h, byType };
  },
};

export default analyticsService;