import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import router from "./routes"; // или "./routes.ts"

const app = express();

app.use(
  cors({
    origin: "*", // Разрешить все домены
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false, // Если не нужны куки
  })
);
app.use(bodyParser.json());

app.use("/", router);

app.listen(3123, () => console.log("✅ Server running on port 3000"));
