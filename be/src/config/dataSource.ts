import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Patient } from '../entities/Patient';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'patients_db',
  synchronize: true,
  logging: false,
  entities: [Patient],
  migrations: [],
  subscribers: [],
});