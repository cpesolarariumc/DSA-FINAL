import { useMemo } from 'react';
import { diagnosticTestCatalog } from '../services/diagnosticProgressService';

interface DiagnosticTestSelectorProps {
  diagnosis: string;
  selectedTests: string[];
  onSelectionChange: (selected: string[]) => void;
}

const categoryKeywords: Record<string, string[]> = {
  'Hematology (Blood & Coagulation Tests)': [
    'blood', 'anemia', 'anaemia', 'bleeding', 'clot', 'platelet', 'hemoglobin', 'haemoglobin', 'transfusion',
  ],
  'Clinical Chemistry (Blood Chemical & Organ Panels)': [
    'diabetes', 'glucose', 'sugar', 'cholesterol', 'lipid', 'liver', 'kidney', 'renal', 'cardiac', 'heart',
    'thyroid', 'electrolyte', 'creatinine', 'chest pain',
  ],
  'Urinalysis & Body Fluid Analysis': [
    'urine', 'urinary', 'uti', 'stool', 'fecal', 'pregnan', 'hcg', 'blood in stool',
  ],
  'Infectious Disease & Immunology Serology': [
    'infection', 'infectious', 'fever', 'dengue', 'typhoid', 'hepatitis', 'hiv', 'syphilis', 'covid',
    'inflammation', 'tb', 'tuberculosis',
  ],
  'Diagnostic Imaging & Radiology': [
    'fracture', 'bone', 'joint', 'lung', 'chest', 'abdominal', 'abdomen', 'imaging', 'pain', 'brain',
    'heart rhythm', 'ecg',
  ],
  'Arterial & Specialized Tests': [
    'oxygen', 'breathing', 'respiratory', 'acid-base', 'sputum', 'tuberculosis', 'tb',
  ],
};

function categoryRelevance(category: string, diagnosis: string) {
  const normalizedDiagnosis = diagnosis.toLowerCase();
  return (categoryKeywords[category] || []).reduce(
    (score, keyword) => score + (normalizedDiagnosis.includes(keyword) ? 1 : 0),
    0,
  );
}

function testKey(category: string, name: string) {
  return `${category}::${name}`;
}

export default function DiagnosticTestSelector({
  diagnosis,
  selectedTests,
  onSelectionChange,
}: DiagnosticTestSelectorProps) {
  const sortedCategories = useMemo(
    () => [...diagnosticTestCatalog].sort((left, right) =>
      categoryRelevance(right.category, diagnosis) - categoryRelevance(left.category, diagnosis)
    ),
    [diagnosis],
  );

  const toggleTest = (key: string) => {
    onSelectionChange(
      selectedTests.includes(key)
        ? selectedTests.filter((selected) => selected !== key)
        : [...selectedTests, key],
    );
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="font-bold text-slate-800">Assign diagnostic tests</h4>
        <p className="mt-1 text-xs text-slate-500">
          Categories are prioritized by diagnosis keywords. Review and select appropriate tests; the suggested order is not a clinical decision.
        </p>
      </div>
      {sortedCategories.map((group, index) => {
        const relevant = categoryRelevance(group.category, diagnosis) > 0;
        return (
          <details
            key={group.category}
            open={relevant || index === 0}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <summary className="cursor-pointer font-semibold text-slate-700">
              {group.category}
              {relevant && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Diagnosis match</span>}
            </summary>
            <div className="mt-3 space-y-2">
              {group.tests.map(([name, description]) => {
                const key = testKey(group.category, name);
                return (
                  <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(key)}
                      onChange={() => toggleTest(key)}
                      className="mt-1 accent-[#1b7a57]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">{name}</span>
                      <span className="block text-xs text-slate-500">{description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        );
      })}
      <p className="text-xs font-semibold text-slate-600" aria-live="polite">
        {selectedTests.length} test{selectedTests.length === 1 ? '' : 's'} selected
      </p>
    </section>
  );
}
