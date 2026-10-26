import { useState } from 'react';
import {
  findPatientById,
  findPatientByAccountNo,
  type PatientDirectoryEntry,
} from '../services/patientMedicalRecordService';
import {
  getEmergencyDestination,
  type EmergencyRouting,
  type QueuePatient,
} from '../services/patientService';
import DiagnosticTestProgress from './DiagnosticTestProgress';
import EmergencyProcedureProgress from './EmergencyProcedureProgress';
import PatientProfileCard from './PatientProfileCard';

interface EmergencyPatientProgressProps {
  roomName: string;
  queue: QueuePatient[];
  routes: EmergencyRouting[];
}

function normalizeRoomName(roomName: string) {
  return roomName.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

export default function EmergencyPatientProgress({
  roomName,
  queue,
  routes,
}: EmergencyPatientProgressProps) {
  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(null);
  const [patient, setPatient] = useState<PatientDirectoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emergencyPatients = queue.filter((queuePatient) =>
    queuePatient.isEmergency &&
    queuePatient.room &&
    normalizeRoomName(getEmergencyDestination(queuePatient.room)) === normalizeRoomName(roomName),
  );
  const activeSelectedPatient = emergencyPatients.find(
    (queuePatient) => queuePatient.accountNo === selectedPatient?.accountNo,
  );
  const selectedRoutingId = activeSelectedPatient?.emergencyTypeId || routes.find((route) =>
    route.symptom.trim().toLocaleLowerCase() === activeSelectedPatient?.traumaType?.trim().toLocaleLowerCase(),
  )?.id;

  const selectEmergencyPatient = async (queuePatient: QueuePatient) => {
    setSelectedPatient(queuePatient);
    setPatient(null);
    setIsLoading(true);
    setError(null);

    try {
      const patientProfile = queuePatient.patientId
        ? await findPatientById(queuePatient.patientId)
        : await findPatientByAccountNo(queuePatient.accountNo);
      if (!patientProfile) {
        setError(`No patient profile is linked to emergency queue account ${queuePatient.accountNo}.`);
        return;
      }
      setPatient(patientProfile);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : String(lookupError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <header>
          <h2 className="text-lg font-bold text-slate-800">Emergency Patient Progress</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select an emergency patient assigned to {roomName} to view their profile, approved procedure checklist, and progress.
          </p>
        </header>

        {emergencyPatients.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No emergency patients are currently assigned to this room.
          </p>
        ) : (
          <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {emergencyPatients.map((entry) => (
              <li key={entry.accountNo}>
                <button
                  type="button"
                  aria-pressed={activeSelectedPatient?.accountNo === entry.accountNo}
                  onClick={() => void selectEmergencyPatient(entry)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    activeSelectedPatient?.accountNo === entry.accountNo
                      ? 'border-red-400 bg-red-50 ring-2 ring-red-100'
                      : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  <span className="block font-bold text-slate-800">{entry.fullName}</span>
                  <span className="mt-1 block text-xs font-mono text-slate-500">{entry.accountNo}</span>
                  <span className="mt-2 block text-xs font-semibold text-red-700">
                    {entry.traumaType || 'Emergency'}
                    {entry.traumaLevel ? ` · Trauma Level ${entry.traumaLevel}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isLoading && <p className="text-sm text-slate-500">Loading emergency patient profile...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {patient && activeSelectedPatient && (
        <>
          <PatientProfileCard patient={patient} />
          {selectedRoutingId && (
            <EmergencyProcedureProgress
              patientId={patient.id}
              routingId={selectedRoutingId}
            />
          )}
          <DiagnosticTestProgress patientId={patient.id} canUpdate />
        </>
      )}
    </div>
  );
}
