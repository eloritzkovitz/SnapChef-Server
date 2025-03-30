import initApp from "./server";
import https from "https"
import fs from "fs"

const port = process.env.PORT;

// Start the server
const startServer = async () => {
    const app = await initApp();
    if (process.env.NODE_ENV != "production") {
        app.listen(port, () => {
            console.log(`Listening at http://localhost:${port}`);
        });
    } else {
        const prop = {
            key: fs.readFileSync("./client-key.pem"),
            cert: fs.readFileSync("./client-cert.pem")
        }
        https.createServer(prop, app).listen(port)
    }
};

startServer();