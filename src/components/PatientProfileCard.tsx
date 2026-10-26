import type { PatientDirectoryEntry } from '../services/patientMedicalRecordService';

interface PatientProfileCardProps {
  patient: PatientDirectoryEntry;
}

export default function PatientProfileCard({ patient }: PatientProfileCardProps) {
  const profileFields = [
    ['Sex', patient.sex],
    ['Age', patient.age],
    ['Birthday', patient.birthday],
    ['Email', patient.email],
    ['Contact', patient.contact],
    ['Address', patient.address],
    ['Allergies', patient.allergies],
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Patient profile</p>
        <h3 className="mt-1 text-lg font-bold text-slate-800">{patient.fullName}</h3>
        <p className="text-sm font-mono text-slate-500">ID: {patient.accountNo}</p>
        {patient.temporary && (
          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Temporary emergency patient record
          </span>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        {profileFields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
            <dd className="mt-0.5 break-words text-slate-700">{value?.trim() || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
