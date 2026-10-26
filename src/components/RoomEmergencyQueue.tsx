import { AlertTriangle, Clock } from 'lucide-react';
import { getEmergencyDestination, type QueuePatient } from '../services/patientService';

interface RoomEmergencyQueueProps {
  roomName: string;
  queue: QueuePatient[];
}

function normalizeRoomName(roomName: string) {
  return roomName.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

export default function RoomEmergencyQueue({ roomName, queue }: RoomEmergencyQueueProps) {
  const assignedPatients = queue.filter((patient) =>
    patient.isEmergency &&
    patient.room &&
    normalizeRoomName(getEmergencyDestination(patient.room)) === normalizeRoomName(roomName),
  );

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Emergency Queue</h2>
            <p className="mt-1 text-sm text-slate-500">Emergency patients routed to {roomName}.</p>
          </div>
        </div>
      </header>

      {assignedPatients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No emergency patients are currently assigned to this room.
        </div>
      ) : (
        <div className="space-y-3">
          {assignedPatients.map((patient, index) => (
            <article
              key={patient.accountNo}
              className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800">{patient.fullName}</h3>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-red-700">
                      Emergency
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">{patient.accountNo}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[#1b7a57]">
                  Room queue #{index + 1}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs font-bold uppercase text-red-600">Emergency type</p>
                  <p className="mt-1 font-semibold text-slate-800">{patient.traumaType || 'Emergency'}</p>
                  {patient.traumaLevel && (
                    <p className="mt-1 text-xs font-semibold text-red-700">Trauma Level {patient.traumaLevel}</p>
                  )}
                  {patient.traumaSpecification && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{patient.traumaSpecification}</p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Assigned destination</p>
                  <p className="mt-1 font-semibold text-slate-800">{getEmergencyDestination(patient.room || roomName)}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Priority order from live emergency queue
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
