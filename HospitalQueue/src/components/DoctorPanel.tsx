import { 
  Stethoscope, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

interface DoctorPanelProps {
  doctorName?: string;
  activePatient?: { fullName: string; accountNo: string; isEmergency?: boolean };
  onFinishConsultation?: () => void;
}

export default function DoctorPanel({ doctorName = "Dr. Smith", activePatient, onFinishConsultation }: DoctorPanelProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-[#1b7a57]">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Welcome, {doctorName}</h2>
            <p className="text-xs text-slate-500">Ready for live queue consultations and patient diagnoses.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-[#1b7a57] rounded-xl text-xs font-bold border border-emerald-200">
          <UserCheck className="w-4 h-4" />
          <span>Consultation Room Active</span>
        </div>
      </div>

      {/* Current Active Patient Consultation Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#1b7a57]" />
            <span>Active Consultation Seat</span>
          </h3>
          {activePatient?.isEmergency && (
            <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-extrabold rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>EMERGENCY CASE</span>
            </span>
          )}
        </div>

        {activePatient ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-bold text-slate-800 text-base">{activePatient.fullName}</p>
              <p className="text-xs text-slate-400 font-mono"> ID: {activePatient.accountNo}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={onFinishConsultation}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish & Prescribe</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No Patient Currently in Consultation Room</p>
            <p className="text-xs text-slate-400">Call the next patient from the live Max-Heap queue tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}