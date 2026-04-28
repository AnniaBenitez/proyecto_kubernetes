import type { Patient } from '../api/patientApi';

interface PatientTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onNew: () => void;
}

export function PatientTable({ patients, onEdit, onNew }: PatientTableProps) {
  return (
    <div>
      <div className="header">
        <h1>Pacientes</h1>
        <button onClick={onNew}>Nuevo Paciente</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th>Telefono</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(patient => (
            <tr key={patient.id} onClick={() => onEdit(patient)}>
              <td>{patient.id}</td>
              <td>{patient.name}</td>
              <td>{patient.lastName}</td>
              <td>{patient.dni}</td>
              <td>{patient.phone || '-'}</td>
              <td>{patient.active ? 'Si' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}