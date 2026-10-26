import { useEffect, useMemo, useState } from 'react';
import {
  saveEmergencyProtocol,
  subscribeToEmergencyProtocols,
  type EmergencyProtocol,
} from '../services/emergencyProcedureService';
import type { EmergencyRouting } from '../services/patientService';

interface EmergencyProtocolManagerProps {
  routes: EmergencyRouting[];
  adminUid: string;
}

export default function EmergencyProtocolManager({
  routes,
  adminUid,
}: EmergencyProtocolManagerProps) {
  const [protocols, setProtocols] = useState<EmergencyProtocol[]>([]);
  const [selectedRoutingId, setSelectedRoutingId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => subscribeToEmergencyProtocols(
    (items) => {
      setProtocols(items);
      setIsLoading(false);
      setError(null);
    },
    (subscriptionError) => {
      setError(subscriptionError.message);
      setIsLoading(false);
    },
  ), []);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRoutingId),
    [routes, selectedRoutingId],
  );

  const selectedProtocol = protocols.find((item) => item.routingId === selectedRoutingId);
  const stepsText = selectedRoutingId in drafts
    ? drafts[selectedRoutingId]
    : selectedProtocol?.steps.join('\n') || '';

  const save = async () => {
    if (!selectedRoute) return;
    setIsSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      await saveEmergencyProtocol(
        selectedRoute.id,
        selectedRoute.symptom,
        stepsText.split(/\r?\n/),
        adminUid,
      );
      setSavedMessage('Approved checklist saved and available to assigned emergency rooms.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <header>
        <h2 className="text-xl font-bold text-slate-800">Emergency Procedure Checklists</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter clinician-approved procedure steps for each emergency type. Steps are displayed to the assigned room with a completion tracker.
        </p>
      </header>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Use your hospital’s approved protocols only. This app does not generate or recommend clinical procedures.
      </p>

      {routes.length === 0 && !isLoading && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No emergency types are available. Check the emergency routing configuration first.
        </p>
      )}

      <div>
        <label htmlFor="emergency-protocol-type" className="mb-1 block text-sm font-semibold text-slate-700">
          Emergency type
        </label>
        <select
          id="emergency-protocol-type"
          value={selectedRoutingId}
          onChange={(event) => {
            setSelectedRoutingId(event.target.value);
            setSavedMessage(null);
          }}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
        >
          <option value="">Select an emergency type</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>{route.symptom} — {route.room}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="emergency-protocol-steps" className="mb-1 block text-sm font-semibold text-slate-700">
          Approved checklist steps
        </label>
        <textarea
          id="emergency-protocol-steps"
          value={stepsText}
          onChange={(event) => setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [selectedRoutingId]: event.target.value,
          }))}
          rows={8}
          placeholder={'Enter one approved step per line'}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Each non-empty line becomes one progress-tracked checklist item.</p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {savedMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{savedMessage}</p>}
      {isLoading && <p className="text-sm text-slate-500">Loading saved checklists...</p>}

      <button
        type="button"
        disabled={!selectedRoute || isSaving}
        onClick={() => void save()}
        className="w-full rounded-xl bg-[#1b7a57] px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving checklist...' : 'Save approved checklist'}
      </button>
    </section>
  );
}
