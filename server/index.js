import express from "express";
import cors from "cors";
import { config } from "./config.js";
import routeRouter from "./routes/routeRouter.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "rutecerdas-api" });
});

app.use("/api/route", routeRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Terjadi kesalahan server" });
});

app.listen(config.port, () => {
  console.log(`RuteCerdas API berjalan di http://localhost:${config.port}`);
});