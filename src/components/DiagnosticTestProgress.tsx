import { useEffect, useState } from 'react';
import {
  subscribeToDiagnosticProgress,
  updateDiagnosticTestStatus,
  type DiagnosticProgressItem,
  type DiagnosticTestStatus,
} from '../services/diagnosticProgressService';

interface DiagnosticTestProgressProps {
  patientId: string;
  canUpdate?: boolean;
}

const statusLabels: Record<DiagnosticTestStatus, string> = {
  ordered: 'Ordered',
  in_progress: 'In progress',
  completed: 'Completed',
};

function isDiagnosticTestStatus(value: string): value is DiagnosticTestStatus {
  return value === 'ordered' || value === 'in_progress' || value === 'completed';
}

export default function DiagnosticTestProgress({
  patientId,
  canUpdate = false,
}: DiagnosticTestProgressProps) {
  const [tests, setTests] = useState<DiagnosticProgressItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingTestId, setUpdatingTestId] = useState<string | null>(null);

  useEffect(() => subscribeToDiagnosticProgress(
    patientId,
    (items) => {
      setTests(items);
      setError(null);
    },
    (subscriptionError) => setError(subscriptionError.message),
  ), [patientId]);

  const updateStatus = async (testId: string, status: DiagnosticTestStatus) => {
    setUpdatingTestId(testId);
    setError(null);
    try {
      await updateDiagnosticTestStatus(patientId, testId, status);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : String(updateError));
    } finally {
      setUpdatingTestId(null);
    }
  };

  if (error && tests.length === 0) {
    return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Could not load diagnostic progress: {error}</p>;
  }

  if (tests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
        No diagnostic tests have been assigned yet.
      </div>
    );
  }

  const groupedPlans = tests.reduce<Record<string, DiagnosticProgressItem[]>>((groups, test) => {
    const planId = test.planId || test.id;
    (groups[planId] ??= []).push(test);
    return groups;
  }, {});

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800">Diagnostic test progress</h3>

      {error && <p role="alert" className="text-sm text-red-700">Could not update test status: {error}</p>}

      <div className="space-y-5">
        {Object.entries(groupedPlans).map(([planId, planTests]) => {
          const completedCount = planTests.filter((test) => test.status === 'completed').length;
          const progressPercent = Math.round((completedCount / planTests.length) * 100);
          const diagnosis = planTests[0].diagnosis;
          const groupedByCategory = planTests.reduce<Record<string, DiagnosticProgressItem[]>>((groups, test) => {
            (groups[test.category] ??= []).push(test);
            return groups;
          }, {});

          return (
            <div key={planId} className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{diagnosis || 'Diagnostic plan'}</h4>
                    {planTests[0].assignedBy && <p className="text-xs text-slate-500">Assigned by {planTests[0].assignedBy}</p>}
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    {completedCount} of {planTests.length} completed
                  </span>
                </div>
                <div
                  className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`Diagnostic tests completed for ${diagnosis || 'diagnostic plan'}`}
                  aria-valuemin={0}
                  aria-valuemax={planTests.length}
                  aria-valuenow={completedCount}
                >
                  <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {Object.entries(groupedByCategory).map(([category, categoryTests]) => (
                <div key={category}>
                  <h5 className="mb-2 text-sm font-bold text-slate-700">{category}</h5>
                  <ul className="space-y-2">
                    {categoryTests.map((test) => (
                      <li key={test.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{test.name}</p>
                          {test.description && <p className="mt-0.5 text-xs text-slate-500">{test.description}</p>}
                        </div>
                        {canUpdate ? (
                          <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>Status</span>
                            <select
                              value={test.status}
                              disabled={updatingTestId === test.id}
                              onChange={(event) => {
                                const status = event.target.value;
                                if (isDiagnosticTestStatus(status)) {
                                  void updateStatus(test.id, status);
                                }
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 disabled:opacity-60"
                            >
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            test.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : test.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}>
                            {statusLabels[test.status]}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
