import "reflect-metadata";
import "dotenv/config";
import cors from "cors";
import express from "express";
import { prometheus } from "./middlewares/prometheus";
import { AppDataSource } from "./config/dataSource";
import { PatientController } from "./controllers/PatientController";
import { validateBody, validateParams } from "./middlewares/validation";
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
} from "./schemas/patientSchema";
import { metricsMiddleware } from "./config/metrics";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(metricsMiddleware);

app.get("/metrics", async (_, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

const patientController = new PatientController();

app.get("/api/patients", (req, res) => patientController.getAll(req, res));
app.get(
  "/api/patients/:id",
  validateParams(patientIdSchema),
  (req, res, next) => patientController.getById(req, res, next),
);
app.post("/api/patients", validateBody(createPatientSchema), (req, res, next) =>
  patientController.create(req, res, next),
);
app.put(
  "/api/patients/:id",
  validateParams(patientIdSchema),
  validateBody(updatePatientSchema),
  (req, res, next) => patientController.update(req, res, next),
);
app.delete(
  "/api/patients/:id",
  validateParams(patientIdSchema),
  (req, res, next) => patientController.delete(req, res, next),
);

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "UP",
  });
});

app.get("/version", (_, res) => {
  res.status(200).json({
    version: process.env.APP_VERSION || "1.0.0",
  });
});

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });
