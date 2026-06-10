import 'reflect-metadata';
import 'dotenv/config';
import cors from "cors";
import express from 'express';
import client from 'prom-client';
import { AppDataSource } from './config/dataSource';
import { PatientController } from './controllers/PatientController';
import { validateBody, validateParams } from './middlewares/validation';
import { createPatientSchema, updatePatientSchema, patientIdSchema } from './schemas/patientSchema';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracion de requests HTTP en segundos',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    end({ method: req.method, route: req.path });
  });
  next();
});

const patientController = new PatientController();

app.get('/api/patients', (req, res) => patientController.getAll(req, res));
app.get('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.getById(req, res, next));
app.post('/api/patients', validateBody(createPatientSchema), (req, res, next) => patientController.create(req, res, next));
app.put('/api/patients/:id', validateParams(patientIdSchema), validateBody(updatePatientSchema), (req, res, next) => patientController.update(req, res, next));
app.delete('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.delete(req, res, next));
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/version', (_req, res) => {
  res.status(200).json({
    version: process.env.APP_VERSION || '1.0.0',
    service: 'patient-management-api',
  });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
