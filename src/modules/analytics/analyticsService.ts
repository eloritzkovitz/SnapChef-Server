import { readLogs, extractNameFromMessage } from "./logUtils";

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
  
  // Get active users (optionally by period)
  getActiveUsers: async (period: string = "daily") => {
    const logs = readLogs();
    const now = new Date();
    let cutoff: Date;
    if (period === "weekly") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "monthly") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // daily
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      if (
        log.message &&
        log.message.startsWith("User data fetched for user:") &&
        log.timestamp &&
        new Date(log.timestamp) > cutoff
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

  // Get error logs (paginated)
  getErrors: async (limit = 100) => {
    const logs = readLogs();
    return logs
      .filter(log => log.level === "error")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  // Get warning logs (paginated)
  getWarnings: async (limit = 100) => {
    const logs = readLogs();
    return logs
      .filter(log => log.level === "warn")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  // Get info logs (paginated)
  getInfo: async (limit = 100) => {
    const logs = readLogs();
    return logs
      .filter(log => log.level === "info")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  // Get all logs (paginated)
  getLogs: async (limit = 100) => {
    const logs = readLogs();
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
    
  // General dashboard summary (for admin)
  getDashboardSummary: async () => {
    // Aggregate key metrics for the dashboard
    const [popularIngredients, popularGroceries, errorStats, activeUsers] = await Promise.all([
      analyticsService.getPopularIngredients(),
      analyticsService.getPopularGroceries(),      
      analyticsService.getErrorStats(),
      analyticsService.getActiveUsers("daily"),
    ]);
    return {
      popularIngredients: popularIngredients.slice(0, 5),
      popularGroceries: popularGroceries.slice(0, 5),      
      errorStats,
      activeUsers: activeUsers.length,
    };
  },
};

export default analyticsService;