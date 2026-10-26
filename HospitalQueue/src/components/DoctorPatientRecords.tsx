import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  addPatientMedicalRecord,
  editPatientMedicalRecord,
  subscribeToPatientDirectory,
  subscribeToPatientMedicalRecords,
  updatePatientAllergies,
  type PatientDirectoryEntry,
  type PatientMedicalRecord,
} from '../services/patientMedicalRecordService';

interface DoctorPatientRecordsProps {
  doctorId: string;
  doctorName: string;
  staffRole?: 'doctor' | 'room';
}

export default function DoctorPatientRecords({
  doctorId,
  doctorName,
  staffRole = 'doctor',
}: DoctorPatientRecordsProps) {
  const [patients, setPatients] = useState<PatientDirectoryEntry[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [records, setRecords] = useState<PatientMedicalRecord[]>([]);
  const [search, setSearch] = useState('');
  const [allergies, setAllergies] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedPatientIdRef = useRef('');

  useEffect(() => {
    return subscribeToPatientDirectory(
      (patientList) => {
        setPatients(patientList);
        setLoadingPatients(false);
        setError(null);
        const currentSelectionExists = patientList.some(
          (patient) => patient.id === selectedPatientIdRef.current,
        );
        if (!currentSelectionExists) {
          selectedPatientIdRef.current = '';
          setSelectedPatientId('');
          setAllergies('');
          setLoadingRecords(false);
          setRecords([]);
        }
      },
      (subscriptionError) => {
        setError(
          `Could not load patient profiles: ${subscriptionError.message} ` +
          `Check that the latest rules from firebaseRuling.txt are published and ` +
          `that this ${staffRole} has a Firestore document at /${staffRole === 'doctor' ? 'doctors' : 'rooms'}/${doctorId} ` +
          `with role "${staffRole}". Do not allow patient-list access to every signed-in user.`,
        );
        setLoadingPatients(false);
      },
    );
  }, [doctorId, staffRole]);

  const filteredPatients = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return patients;
    return patients.filter((patient) =>
      [patient.fullName, patient.accountNo, patient.email]
        .some((value) => value.toLowerCase().includes(searchText)),
    );
  }, [patients, search]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);

  useEffect(() => {
    if (!selectedPatientId) return;

    return subscribeToPatientMedicalRecords(
      selectedPatientId,
      (patientRecords) => {
        setRecords(patientRecords);
        setLoadingRecords(false);
        setError(null);
      },
      (subscriptionError) => {
        setError(`Could not load this patient's medical records: ${subscriptionError.message}`);
        setLoadingRecords(false);
      },
    );
  }, [selectedPatientId]);

  const selectPatient = (patient: PatientDirectoryEntry) => {
    selectedPatientIdRef.current = patient.id;
    setSelectedPatientId(patient.id);
    setAllergies(patient.allergies);
    setLoadingRecords(true);
    setEditingRecordId(null);
    setTitle('');
    setDetails('');
  };

  const startEditing = (record: PatientMedicalRecord) => {
    setEditingRecordId(record.id);
    setTitle(record.title);
    setDetails(record.details);
  };

  const saveAllergies = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatient) return;
    setSaving(true);
    setError(null);
    try {
      await updatePatientAllergies(selectedPatient.id, allergies);
    } catch (saveError) {
      setError(`Could not update patient allergies: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
    } finally {
      setSaving(false);
    }
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatient || !title.trim() || !details.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingRecordId) {
        await editPatientMedicalRecord(
          selectedPatient.id,
          editingRecordId,
          title,
          details,
          doctorName,
          doctorId,
        );
      } else {
        await addPatientMedicalRecord(
          selectedPatient.id,
          title,
          details,
          doctorName,
          doctorId,
        );
      }
      setEditingRecordId(null);
      setTitle('');
      setDetails('');
    } catch (saveError) {
      setError(`Could not save the medical record: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <header>
        <h2 className="text-lg font-bold text-slate-800">Patient Profiles & Medical Records</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a patient to review their profile, update allergies, and add or edit medical notes.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <header>
          <h3 className="text-base font-bold text-slate-800">Find patient profile</h3>
          <p className="mt-1 text-sm text-slate-500">Search by patient name, account number, or email, then select a profile.</p>
        </header>
        <label htmlFor="patient-directory-search" className="block">
          <span className="sr-only">Search patients</span>
          <input
            id="patient-directory-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient name, account number, or email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-[#1b7a57]"
          />
        </label>
        {loadingPatients ? (
          <p className="text-sm text-slate-500">Loading patient profiles...</p>
        ) : filteredPatients.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {patients.length === 0 ? 'No patient profiles are available.' : 'No patients match your search.'}
          </p>
        ) : (
          <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {filteredPatients.map((patient) => (
              <li key={patient.id}>
              <button
                type="button"
                onClick={() => selectPatient(patient)}
                aria-pressed={patient.id === selectedPatientId}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  patient.id === selectedPatientId
                    ? 'border-[#1b7a57] bg-emerald-50 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-slate-800">{patient.fullName}</span>
                <span className="mt-1 block text-xs font-mono text-slate-500">{patient.accountNo}</span>
                {patient.email && <span className="mt-1 block break-all text-xs text-slate-500">{patient.email}</span>}
              </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="min-w-0 space-y-5">
          {!selectedPatient ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
              Select a patient profile to view their details.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-bold text-slate-800">{selectedPatient.fullName}</h3>
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold text-slate-500">Account</dt><dd>{selectedPatient.accountNo}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Email</dt><dd className="break-all">{selectedPatient.email || 'Not provided'}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Sex / age</dt><dd>{[selectedPatient.sex, selectedPatient.age].filter(Boolean).join(' / ') || 'Not provided'}</dd></div>
                  <div><dt className="font-semibold text-slate-500">Contact</dt><dd>{selectedPatient.contact || 'Not provided'}</dd></div>
                </dl>
              </div>

              <form onSubmit={saveAllergies} className="space-y-2 rounded-2xl border border-slate-200 p-4">
                <label htmlFor="patient-allergies" className="block text-sm font-bold text-slate-700">
                  Allergies shown in patient profile
                </label>
                <textarea
                  id="patient-allergies"
                  rows={2}
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder="Enter known allergies or 'None recorded'"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Save allergies
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">Medical record history</h3>
                {loadingRecords ? (
                  <p className="text-sm text-slate-500">Loading medical records...</p>
                ) : records.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No medical records have been added.</p>
                ) : records.map((record) => (
                  <article key={record.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-800">{record.title}</h4>
                      <button
                        type="button"
                        onClick={() => startEditing(record)}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.details}</p>
                    <p className="mt-2 text-xs text-slate-500">Entered by {record.doctorName || 'Doctor'}</p>
                  </article>
                ))}
              </div>

              <form onSubmit={saveRecord} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800">
                  {editingRecordId ? 'Edit medical record' : 'Add medical record'}
                </h3>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Record title (e.g. Diagnosis, Visit note)"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Enter the patient's medical record information"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingRecordId ? 'Save changes' : 'Add record'}
                  </button>
                  {editingRecordId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecordId(null);
                        setTitle('');
                        setDetails('');
                      }}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
      </div>
    </section>
  );
}
