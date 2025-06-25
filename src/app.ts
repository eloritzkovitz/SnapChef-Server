import initApp, { attachSocket } from "./server";
import https from "https"
import fs from "fs"

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const startServer = async () => {
  const app = await initApp();

  if (isProduction) {
    const prop = {
      key: fs.readFileSync("./myserver.key"),
      cert: fs.readFileSync("./CSB.crt"),
    };

    const server = https.createServer(prop, app);
    attachSocket(server);

    server.listen(port, () => {
      console.log(`Server running in production mode at https://localhost:${port}`);
    });
  } else {
    app.listen(port, () => {
      console.log(`Server running in development mode at http://localhost:${port}`);
    });
  }
};

startServer();
