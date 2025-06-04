import { readLogs } from "./logUtils";

const logService = {
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
}

export default logService;