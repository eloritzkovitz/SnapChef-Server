import initApp from "./server";
import https from "https"
import fs from "fs"

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const startServer = async () => {
  const app = await initApp();

  if (isProduction) {
    const prop = {
      key: fs.readFileSync("./client-key.pem"),
      cert: fs.readFileSync("./client-cert.pem"),
    };

    https.createServer(prop, app).listen(port, () => {
      console.log(`Server running in production mode at https://localhost:${port}`);
    });
  } else {
    app.listen(port, () => {
      console.log(`Server running in development mode at http://localhost:${port}`);
    });
  }
};

startServer();
