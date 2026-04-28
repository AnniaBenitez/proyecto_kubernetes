import 'reflect-metadata';
import 'dotenv/config';
import cors from "cors";
import express from 'express';
import { AppDataSource } from './config/dataSource';
import { PatientController } from './controllers/PatientController';
import { validateBody, validateParams } from './middlewares/validation';
import { createPatientSchema, updatePatientSchema, patientIdSchema } from './schemas/patientSchema';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const patientController = new PatientController();

app.get('/api/patients', (req, res) => patientController.getAll(req, res));
app.get('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.getById(req, res, next));
app.post('/api/patients', validateBody(createPatientSchema), (req, res, next) => patientController.create(req, res, next));
app.put('/api/patients/:id', validateParams(patientIdSchema), validateBody(updatePatientSchema), (req, res, next) => patientController.update(req, res, next));
app.delete('/api/patients/:id', validateParams(patientIdSchema), (req, res, next) => patientController.delete(req, res, next));

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