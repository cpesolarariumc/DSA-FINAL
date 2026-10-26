import { useEffect, useState } from 'react';
import {
  subscribeToPatientPrescriptions,
  type PatientPrescription,
} from '../services/patientService';

interface PatientPrescriptionsProps {
  accountNo: string;
}

export default function PatientPrescriptions({ accountNo }: PatientPrescriptionsProps) {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [loadedAccountNo, setLoadedAccountNo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = loadedAccountNo !== accountNo;

  useEffect(() => {
    return subscribeToPatientPrescriptions(
      accountNo,
      (patientPrescriptions) => {
        setPrescriptions(patientPrescriptions);
        setLoadedAccountNo(accountNo);
        setError(null);
      },
      (subscriptionError) => {
        setError(subscriptionError.message);
        setLoadedAccountNo(accountNo);
      },
    );
  }, [accountNo]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-slate-800">Your Prescriptions</h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading prescriptions...</p>
      ) : error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          Could not load prescriptions: {error}
        </p>
      ) : prescriptions.length === 0 ? (
        <p className="text-sm text-slate-500">You do not have any prescriptions yet.</p>
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((prescription) => (
            <li key={prescription.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-800">
                {prescription.prescriptionText}
              </p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                <span>Prescribed by {prescription.doctorName || 'your doctor'}</span>
                {prescription.createdAt && (
                  <time dateTime={prescription.createdAt.toDate().toISOString()}>
                    {prescription.createdAt.toDate().toLocaleString()}
                  </time>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
