export interface PatientProfile {
  uid: string;
  accountNo: string;
  fullName: string;
  sex: string;
  address: string;
  contact: string;
  email: string;
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  insuranceProvider: string;
  assignedDoctor: {
    primaryDoctorName: string;
    specialty: string;
    location?: string;
  };
  isTemporary?: boolean;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  status: string;
  prescribingDoctor?: string;
  issuedDate?: string;
}

export interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  fileUrl?: string;
}

export interface QueueItem {
  id: string;
  status: string;
}

export const INITIAL_QUEUE_DATA = {
  positionId: 'PTNT-2026-0001',
  inlineNumber: 7,
  department: 'Cardio',
  room: 'Rm 4B',
  status: 'Pending',
  speed: 'Fast',
  inConsultationId: 'PTNT-2026-0000',
  liveQueue: [
    { id: 'PTNT-2026-0000', status: 'In Consultation' },
    { id: 'PTNT-2026-0001', status: 'Your Position (#7)' },
  ] as QueueItem[],
};

export function formatWaitTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}hrs ${mins.toString().padStart(2, '0')} min ${secs.toString().padStart(2, '0')} sec`;
}