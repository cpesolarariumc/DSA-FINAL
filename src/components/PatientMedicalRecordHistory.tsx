import { useEffect, useState } from 'react';
import {
  subscribeToPatientMedicalRecords,
  type PatientMedicalRecord,
} from '../services/patientMedicalRecordService';

interface PatientMedicalRecordHistoryProps {
  patientId: string;
}

export default function PatientMedicalRecordHistory({ patientId }: PatientMedicalRecordHistoryProps) {
  const [records, setRecords] = useState<PatientMedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => subscribeToPatientMedicalRecords(
    patientId,
    (patientRecords) => {
      setRecords(patientRecords);
      setError(null);
      setIsLoading(false);
    },
    (subscriptionError) => {
      setError(subscriptionError.message);
      setIsLoading(false);
    },
  ), [patientId]);

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load medical records: {error}</p>
      ) : isLoading ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Loading medical record history...</p>
      ) : records.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No medical records have been added.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{record.title}</p>
                {record.createdAt && (
                  <time className="text-xs text-slate-500">
                    {record.createdAt.toDate().toLocaleString()}
                  </time>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{record.details}</p>
              <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
                Entered by {record.doctorName || 'Doctor'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
