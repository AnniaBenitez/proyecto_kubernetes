import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/PatientService';
import { PatientIdParam } from '../schemas/patientSchema';

export class PatientController {
  private service = new PatientService();

  async getAll(_req: Request, res: Response): Promise<void> {
    const patients = await this.service.getAll();
    res.json(patients);
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as PatientIdParam;
      const patient = await this.service.getById(id);
      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await this.service.create(req.body);
      res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as PatientIdParam;
      const patient = await this.service.update(id, req.body);
      res.json(patient);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as PatientIdParam;
      const result = await this.service.delete(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}