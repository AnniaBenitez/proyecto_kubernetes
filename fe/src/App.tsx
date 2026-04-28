import { useState } from 'react';
import type { Patient } from './api/patientApi';
import { PatientTable } from './components/PatientTable';
import { PatientForm } from './components/PatientForm';
import { usePatients } from './hooks/usePatients';

export function App() {
  const { data: patients = [], isLoading, error } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">Error al cargar pacientes</div>;

  return (
    <div className="container">
      {showForm ? (
        <div className="form-container">
          <h2>{selectedPatient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
          <PatientForm
            patient={selectedPatient || undefined}
            onCancel={() => {
              setShowForm(false);
              setSelectedPatient(null);
            }}
          />
        </div>
      ) : (
        <PatientTable
          patients={patients}
          onEdit={(patient) => {
            setSelectedPatient(patient);
            setShowForm(true);
          }}
          onNew={() => {
            setSelectedPatient(null);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}

export default App;