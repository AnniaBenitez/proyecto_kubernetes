import 'reflect-metadata';
import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { AppDataSource } from './config/dataSource';
import { PatientController } from './controllers/PatientController';
import { validateBody, validateParams } from './middlewares/validation';
import { createPatientSchema, updatePatientSchema, patientIdSchema } from './schemas/patientSchema';

const app = express();
const port = process.env.PORT || 3000;
const appVersion = process.env.APP_VERSION || '1.0.0';
const startTime = Date.now();
let httpRequestsTotal = 0;

app.use(express.json());
app.use(cors());

// Contador simple de requests para exponerlo en /metrics sin dependencias extra.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/metrics') {
    httpRequestsTotal += 1;
  }
  next();
});

const patientController = new PatientController();

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'patient-backend',
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/version', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'patient-backend',
    version: appVersion,
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/metrics', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send([
    '# HELP app_up Estado de la aplicacion. 1 significa activo.',
    '# TYPE app_up gauge',
    'app_up 1',
    '# HELP app_uptime_seconds Tiempo activo de la aplicacion en segundos.',
    '# TYPE app_uptime_seconds counter',
    `app_uptime_seconds ${uptimeSeconds}`,
    '# HELP http_requests_total Total de requests HTTP recibidos por la API.',
    '# TYPE http_requests_total counter',
    `http_requests_total ${httpRequestsTotal}`,
    '# HELP process_resident_memory_bytes Memoria RSS usada por el proceso Node.js.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${memory.rss}`,
    '# HELP process_heap_used_bytes Memoria heap usada por Node.js.',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${memory.heapUsed}`,
    '# HELP process_cpu_user_seconds_total CPU de usuario usada por el proceso.',
    '# TYPE process_cpu_user_seconds_total counter',
    `process_cpu_user_seconds_total ${cpu.user / 1_000_000}`,
    '# HELP process_cpu_system_seconds_total CPU de sistema usada por el proceso.',
    '# TYPE process_cpu_system_seconds_total counter',
    `process_cpu_system_seconds_total ${cpu.system / 1_000_000}`,
    '',
  ].join('\n'));
});

app.get('/api/patients', (req, res) => patientController.getAll(req, res));
app.get('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.getById(req, res, next));
app.post('/api/patients', validateBody(createPatientSchema), (req, res, next) => patientController.create(req, res, next));
app.put('/api/patients/:id', validateParams(patientIdSchema), validateBody(updatePatientSchema), (req, res, next) => patientController.update(req, res, next));
app.delete('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.delete(req, res, next));

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.message === 'Patient not found' ? 404 : 500;
  res.status(status).json({ error: error.message });
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
