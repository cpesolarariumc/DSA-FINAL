import { useEffect, useState } from 'react';
import {
  subscribeToEmergencyProcedureProgress,
  subscribeToEmergencyProtocols,
  updateEmergencyProcedureStep,
  type EmergencyProcedureProgress as EmergencyProcedureProgressData,
  type EmergencyProtocol,
} from '../services/emergencyProcedureService';

interface EmergencyProcedureProgressProps {
  patientId: string;
  routingId: string;
}

export default function EmergencyProcedureProgress({
  patientId,
  routingId,
}: EmergencyProcedureProgressProps) {
  const [protocols, setProtocols] = useState<EmergencyProtocol[]>([]);
  const [progress, setProgress] = useState<EmergencyProcedureProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);

  useEffect(() => subscribeToEmergencyProtocols(
    setProtocols,
    (subscriptionError) => setError(subscriptionError.message),
  ), []);

  useEffect(() => subscribeToEmergencyProcedureProgress(
    patientId,
    routingId,
    setProgress,
    (subscriptionError) => setError(subscriptionError.message),
  ), [patientId, routingId]);

  const protocol = protocols.find((item) => item.routingId === routingId);
  const completedStepIds = progress && protocol && progress.protocolVersion === protocol.version
    ? progress.completedStepIds
    : [];
  const completedCount = completedStepIds.length;
  const totalSteps = protocol?.steps.length || 0;
  const progressPercent = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  const setStepCompleted = async (stepId: string, isCompleted: boolean) => {
    if (!protocol) return;
    setUpdatingStep(stepId);
    setError(null);
    try {
      await updateEmergencyProcedureStep(
        patientId,
        routingId,
        protocol.version,
        stepId,
        isCompleted,
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    } finally {
      setUpdatingStep(null);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <header>
        <h3 className="text-lg font-bold text-slate-800">Emergency Procedure Progress</h3>
        <p className="mt-1 text-sm text-slate-500">
          Checklist from the hospital-approved protocol for this emergency type.
        </p>
      </header>

      {!protocol && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No approved checklist is configured for this emergency type yet. Contact an administrator to add the hospital-approved steps.
        </p>
      )}

      {protocol && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-800">{protocol.emergencyType}</h4>
            <span className="text-sm font-semibold text-slate-600">
              {completedCount} of {totalSteps} steps completed
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label={`Approved emergency checklist progress for ${protocol.emergencyType}`}
            aria-valuemin={0}
            aria-valuemax={totalSteps}
            aria-valuenow={completedCount}
          >
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>

          <ol className="space-y-2">
            {protocol.steps.map((step, index) => {
              const stepId = String(index);
              const isCompleted = completedStepIds.includes(stepId);
              return (
                <li key={`${protocol.version}-${stepId}`}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={updatingStep === stepId}
                      onChange={(event) => void setStepCompleted(stepId, event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-emerald-700"
                    />
                    <span className={`text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {step}
                    </span>
                  </label>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
