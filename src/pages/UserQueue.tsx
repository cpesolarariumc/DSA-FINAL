interface QueueDisplayPatient {
  id?: string;
  fullName: string;
  accountNo: string;
  isEmergency: boolean;
  traumaType?: string;
  traumaLevel?: number;
  traumaSpecification?: string;
  room?: string;
  doctorName?: string;
}

interface UserQueueProps {
  patients: QueueDisplayPatient[];
  isPatientView?: boolean;
  currentPatientAccountNo?: string;
  isLoading?: boolean;
  error?: string | null;
}

export default function UserQueue({
  patients,
  isPatientView = false,
  currentPatientAccountNo,
  isLoading = false,
  error,
}: UserQueueProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:rounded-3xl sm:p-6 sm:shadow-sm">
      <h3 className="mb-2 text-base font-bold text-slate-800 sm:text-lg">
        {isPatientView ? 'Your Queue Status' : 'Live Queue'}
      </h3>
      <hr className="mb-3" />
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Could not load the live queue: {error}
        </p>
      ) : isLoading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading live queue…</p>
      ) : patients.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No active patients in queue for today.
        </p>
      ) : (
        <ol className="space-y-2">
          {patients.map((patient, index) => (
            <li
              key={patient.id || patient.accountNo}
              className={`flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 text-sm font-semibold sm:rounded-xl sm:p-3 ${
                patient.isEmergency
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-slate-100 bg-slate-50 text-slate-800'
              }`}
            >
              <div className="min-w-0">
                <p className="break-words">
                  {isPatientView
                    ? patient.accountNo.trim().toUpperCase() === currentPatientAccountNo?.trim().toUpperCase()
                      ? `${patient.fullName} (${patient.accountNo})`
                      : patient.accountNo
                    : `${patient.fullName} (${patient.accountNo})`}
                </p>
                {patient.room && (
                  <p className="mt-1 text-xs font-bold text-emerald-700">{patient.room}</p>
                )}
                {patient.traumaType && (
                  <p className="mt-1 text-xs font-semibold text-red-700">
                    {patient.traumaType}
                    {patient.traumaLevel ? ` · Trauma Level ${patient.traumaLevel}` : ''}
                  </p>
                )}
                {patient.traumaSpecification && (
                  <p className="mt-1 text-xs text-slate-600">
                    Details: {patient.traumaSpecification}
                  </p>
                )}
                {patient.doctorName && (
                  <p className="mt-0.5 text-xs font-semibold text-teal-700">
                    {patient.doctorName}
                  </p>
                )}
                {patient.isEmergency && (
                  <span className="mt-1 inline-block rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    Emergency
                  </span>
                )}
              </div>
              <span
                className={`shrink-0 font-bold ${
                  patient.isEmergency ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                #{index + 1}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
