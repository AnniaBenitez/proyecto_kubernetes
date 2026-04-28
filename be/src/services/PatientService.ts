import { AppDataSource } from "../config/dataSource";
import { Patient } from "../entities/Patient";
import { CreatePatientDto, UpdatePatientDto } from "../schemas/patientSchema";

export class PatientService {
  private repository = AppDataSource.getRepository(Patient);

  async getAll(): Promise<Patient[]> {
    return this.repository.find();
  }

  async getById(id: number): Promise<Patient> {
    const patient = await this.repository.findOneBy({ id });
    if (!patient) throw new Error("Patient not found");
    return patient;
  }

  async create(data: CreatePatientDto): Promise<Patient> {
    const patient = this.repository.create(data);
    return this.repository.save(patient);
  }

  async update(id: number, data: UpdatePatientDto): Promise<Patient> {
    const patient = await this.getById(id);
    Object.assign(patient, data);
    return this.repository.save(patient);
  }

  async delete(id: number): Promise<{ message: string }> {
    const patient = await this.getById(id);
    await this.repository.remove(patient);
    return { message: "Patient deleted" };
  }
}
