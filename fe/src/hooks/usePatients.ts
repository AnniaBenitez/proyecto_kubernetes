import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patientApi';
import type { CreatePatientDto, UpdatePatientDto } from '../api/patientApi';

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: patientApi.getAll,
  });
};

export const usePatient = (id: number) => {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientDto) => patientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePatientDto }) => patientApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};