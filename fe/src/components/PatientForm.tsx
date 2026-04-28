import { useState, type FormEvent } from "react";
import type { CreatePatientDto, Patient } from "../api/patientApi";
import {
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "../hooks/usePatients";

interface PatientFormProps {
  patient?: Patient;
  onCancel: () => void;
}

export function PatientForm({ patient, onCancel }: PatientFormProps) {
  const [form, setForm] = useState<CreatePatientDto>({
    name: patient?.name || "",
    lastName: patient?.lastName || "",
    dni: patient?.dni || "",
    phone: patient?.phone || "",
    birthDate: patient?.birthDate || "",
    active: patient?.active ?? true,
  });

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (patient) {
      updatePatient.mutate({ id: patient.id, data: form });
    } else {
      createPatient.mutate(form);
    }
    onCancel();
  };

  const handleDelete = () => {
    if (patient && confirm("¿Eliminar paciente?")) {
      deletePatient.mutate(patient.id);
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <input
        type="text"
        placeholder="Nombre"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Apellido"
        value={form.lastName}
        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="DNI"
        value={form.dni}
        onChange={(e) => setForm({ ...form, dni: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Telefono"
        value={form.phone || ""}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <input
        type="date"
        value={form.birthDate?.split("T")[0] || ""}
        onChange={(e) =>
          setForm({
            ...form,
            birthDate: new Date(e.target.value).toISOString(),
          })
        }
      />
      <label>
        <input
          type="checkbox"
          checked={form.active ?? true}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Activo
      </label>
      <div className="form-actions">
        <button type="submit">{patient ? "Actualizar" : "Crear"}</button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
        {patient && (
          <button type="button" onClick={handleDelete} className="delete-btn">
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
