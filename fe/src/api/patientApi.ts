import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

export interface Patient {
  id: number;
  name: string;
  lastName: string;
  dni: string;
  phone?: string;
  birthDate?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreatePatientDto = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientDto = Partial<CreatePatientDto>;

export const patientApi = {
  getAll: () => api.get<Patient[]>('/patients').then(res => res.data),
  getById: (id: number) => api.get<Patient>(`/patients/${id}`).then(res => res.data),
  create: (data: CreatePatientDto) => api.post<Patient>('/patients', data).then(res => res.data),
  update: (id: number, data: UpdatePatientDto) => api.put<Patient>(`/patients/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/patients/${id}`),
};