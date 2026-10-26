import { useEffect, useMemo, useState } from 'react';
import {
  subscribeToPatientDirectory,
  type PatientDirectoryEntry,
} from '../services/patientMedicalRecordService';
import PatientProfileCard from './PatientProfileCard';
import DiagnosticTestProgress from './DiagnosticTestProgress';

interface ProgressUpdateProps {
  staffRole?: 'admin' | 'room';
}

export default function ProgressUpdate({ staffRole = 'admin' }: ProgressUpdateProps) {
  const [patients, setPatients] = useState<PatientDirectoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [patient, setPatient] = useState<PatientDirectoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToPatientDirectory(
    (patientList) => {
      setPatients(patientList);
      setIsLoading(false);
      setError(null);
      setPatient((currentPatient) =>
        currentPatient
          ? patientList.find((entry) => entry.id === currentPatient.id) || null
          : null,
      );
    },
    (subscriptionError) => {
      setError(
        `Could not load patient profiles: ${subscriptionError.message} ` +
        `Check that the latest rules in firebaseRuling.txt are published and your ${staffRole} profile is stored at /${staffRole === 'admin' ? 'admins' : 'rooms'}/{your-auth-uid}.`,
      );
      setIsLoading(false);
    },
  ), [staffRole]);

  const filteredPatients = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return patients;
    return patients.filter((entry) =>
      [entry.fullName, entry.accountNo, entry.email]
        .some((value) => value.toLowerCase().includes(searchText)),
    );
  }, [patients, search]);

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <header>
          <h3 className="text-lg font-bold text-slate-700">Find patient diagnostic progress</h3>
          <p className="mt-1 text-sm text-slate-500">Search by patient name, account number, or email, then select a profile.</p>
        </header>
        <label className="block">
          <span className="sr-only">Search patients</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-[#1b7a57]"
            placeholder="Search patient name, account number, or email"
          />
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading patient profiles...</p>
        ) : filteredPatients.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {patients.length === 0 ? 'No patient profiles are available.' : 'No patients match your search.'}
          </p>
        ) : (
          <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {filteredPatients.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-pressed={patient?.id === entry.id}
                  onClick={() => {
                    setPatient(entry);
                    setError(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    patient?.id === entry.id
                      ? 'border-[#1b7a57] bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-slate-800">{entry.fullName}</span>
                  <span className="mt-1 block text-xs font-mono text-slate-500">{entry.accountNo}</span>
                  {entry.email && <span className="mt-1 block break-all text-xs text-slate-500">{entry.email}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {patient && (
        <>
          <PatientProfileCard patient={patient} />
          <DiagnosticTestProgress patientId={patient.id} canUpdate />
        </>
      )}
    </div>
  );
}
