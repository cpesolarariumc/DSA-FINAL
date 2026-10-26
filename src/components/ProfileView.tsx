import { User, Stethoscope } from 'lucide-react';
import type { PatientProfile } from '../patientData';

interface ProfileViewProps {
  profile: PatientProfile | null;
}

export default function ProfileView({ profile }: ProfileViewProps) {
  if (!profile) return <div className="p-6 text-center text-slate-600">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#d2dcd7] rounded-3xl p-6 sm:p-8 border border-slate-300/80 shadow-md">
        <div className="mb-4 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-xl text-xs font-semibold">
          Note: Patient information is read-only. Please contact clinic administration for any updates.
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8 mb-8 pb-8 border-b border-slate-400/40">
          <div className="w-36 h-36 rounded-full bg-black flex items-center justify-center shrink-0 shadow-lg border-4 border-white">
            <User className="w-20 h-20 text-white" />
          </div>

          <div className="space-y-2 text-slate-800 font-bold text-lg md:text-xl tracking-wide w-full">
            <p><span className="text-slate-600 font-semibold">NAME: </span><input type="text" disabled value={profile.fullName || ''} className="bg-transparent border-b border-slate-400 w-full md:w-auto" /></p>
            <p><span className="text-slate-600 font-semibold">SEX: </span><input type="text" disabled value={profile.sex || ''} className="bg-transparent border-b border-slate-400 w-full md:w-auto" /></p>
            <p><span className="text-slate-600 font-semibold">ADDRESS: </span><input type="text" disabled value={profile.address || ''} className="bg-transparent border-b border-slate-400 w-full md:w-auto" /></p>
            <p><span className="text-slate-600 font-semibold">CONTACT #: </span><input type="text" disabled value={profile.contact || ''} className="bg-transparent border-b border-slate-400 w-full md:w-auto" /></p>
            <p><span className="text-slate-600 font-semibold">EMAIL: </span><input type="text" disabled value={profile.email || ''} className="bg-transparent border-b border-slate-400 w-full md:w-auto" /></p>
          </div>
        </div>

        <div className="bg-[#e2eae6] rounded-2xl p-6 border border-slate-300/80 space-y-4">
          <h3 className="text-lg font-bold text-[#0f3832] flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-emerald-700" />
            <span>Attending Physician & Medical Specialist</span>
          </h3>
          <div className="bg-white/90 rounded-xl p-4 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-semibold uppercase">Primary Attending Doctor</p>
            <p className="text-slate-900 font-bold text-lg">{profile.assignedDoctor?.primaryDoctorName || 'Dr. Sarah Jenkins'}</p>
            <p className="text-emerald-700 text-sm font-semibold">{profile.assignedDoctor?.specialty || 'Cardiologist'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}