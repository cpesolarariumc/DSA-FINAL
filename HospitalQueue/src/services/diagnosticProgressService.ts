import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const diagnosticTestCatalog = [
  {
    category: 'Hematology (Blood & Coagulation Tests)',
    tests: [
      ['CBC with Differential (Complete Blood Count)', 'Measures red blood cells, white blood cells, and platelets.'],
      ['Hemoglobin and Hematocrit (H&Hb)', 'Checks for anemia or blood loss.'],
      ['Platelet Count', 'Assesses blood clotting ability.'],
      ['Blood Typing & Crossmatching', 'Determines blood group and Rh factor for transfusions.'],
      ['ESR (Erythrocyte Sedimentation Rate)', 'Measures general inflammation in the body.'],
      ['PT / INR (Prothrombin Time)', 'Monitors bleeding disorders or anticoagulant therapy.'],
      ['aPTT (Activated Partial Thromboplastin Time)', 'Evaluates blood clotting pathways.'],
    ],
  },
  {
    category: 'Clinical Chemistry (Blood Chemical & Organ Panels)',
    tests: [
      ['FBS / RBS (Fasting / Random Blood Sugar)', 'Screens for diabetes or glucose levels.'],
      ['HbA1c (Glycated Hemoglobin)', 'Measures average blood sugar over the past 3 months.'],
      ['Lipid Profile', 'Includes total cholesterol, HDL, LDL, and triglycerides.'],
      ['Liver Function Tests (LFTs / SGPT / SGOT / Bilirubin)', 'Assesses liver health and bile ducts.'],
      ['Renal Function Tests (BUN / Creatinine / Uric Acid)', 'Evaluates kidney function and filtration.'],
      ['Serum Electrolytes (Sodium, Potassium, Chloride)', 'Checks hydration and mineral balance.'],
      ['Cardiac Biomarkers (Troponin I/T, CK-MB)', 'Evaluates myocardial damage.'],
      ['Thyroid Function Tests (TSH, Free T3, Free T4)', 'Checks thyroid gland activity.'],
    ],
  },
  {
    category: 'Urinalysis & Body Fluid Analysis',
    tests: [
      ['Routine Urinalysis (Urine Test)', 'Checks for protein, sugar, blood, and signs of infection.'],
      ['Urine Culture & Sensitivity (CS)', 'Identifies urinary bacteria and effective antibiotics.'],
      ['Stool Routine & Microscopy (Fecalysis)', 'Checks for parasites, blood, or digestive infection.'],
      ['Occult Blood Test', 'Detects hidden blood in stool samples.'],
      ['Pregnancy Test (Urine / Serum hCG)', 'Detects human chorionic gonadotropin.'],
    ],
  },
  {
    category: 'Infectious Disease & Immunology Serology',
    tests: [
      ['Dengue NS1 / IgG / IgM', 'Screens for dengue fever.'],
      ['Widal Test / Typhoid IgG/IgM', 'Checks for Salmonella / typhoid infection.'],
      ['Hepatitis Panel (HBsAg, Anti-HCV, etc.)', 'Screens for hepatitis B and C.'],
      ['HIV Screening Test', 'Detects HIV antibodies.'],
      ['Syphilis Test (RPR / VDRL)', 'Screens for syphilis.'],
      ['C-Reactive Protein (CRP) / Procalcitonin', 'Detects acute inflammation or infection.'],
      ['COVID-19 Antigen Swab / RT-PCR', 'Detects SARS-CoV-2 infection.'],
    ],
  },
  {
    category: 'Diagnostic Imaging & Radiology',
    tests: [
      ['Chest X-Ray (CXR)', 'Evaluates lungs, heart, and chest wall.'],
      ['Abdominal X-Ray (KUB)', 'Checks kidneys, ureters, bladder, or bowel obstruction.'],
      ['Musculoskeletal X-Ray', 'Scans bones and joints for fractures or arthritis.'],
      ['12-Lead Electrocardiogram (ECG / EKG)', 'Records heart electrical activity.'],
      ['Ultrasound (Abdominal, Pelvic, Thyroid, Obstetric)', 'Images internal soft tissues and organs.'],
      ['CT Scan (Computed Tomography)', 'Provides detailed cross-sectional scans.'],
      ['MRI (Magnetic Resonance Imaging)', 'Images soft tissues, brain, spine, and ligaments.'],
    ],
  },
  {
    category: 'Arterial & Specialized Tests',
    tests: [
      ['ABG (Arterial Blood Gas)', 'Measures oxygen, carbon dioxide, and acid-base balance.'],
      ['Sputum Acid-Fast Bacilli (AFB) Stain', 'Screens for tuberculosis (TB).'],
    ],
  },
] as const;

export type DiagnosticTestStatus = 'ordered' | 'in_progress' | 'completed';

export interface DiagnosticProgressItem {
  id: string;
  planId: string;
  category: string;
  name: string;
  description: string;
  diagnosis: string;
  assignedBy: string;
  status: DiagnosticTestStatus;
  assignedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export function subscribeToDiagnosticProgress(
  patientId: string,
  callback: (tests: DiagnosticProgressItem[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'patients', patientId, 'diagnosticTests'),
    (snapshot) => {
      const tests = snapshot.docs.map((testDoc) => {
        const data = testDoc.data();
        const status = data.status === 'in_progress' || data.status === 'completed'
          ? data.status
          : 'ordered';

        return {
          id: testDoc.id,
          planId: typeof data.planId === 'string' ? data.planId : '',
          category: typeof data.category === 'string' ? data.category : 'Other tests',
          name: typeof data.name === 'string' ? data.name : 'Unnamed test',
          description: typeof data.description === 'string' ? data.description : '',
          diagnosis: typeof data.diagnosis === 'string' ? data.diagnosis : '',
          assignedBy: typeof data.assignedBy === 'string' ? data.assignedBy : '',
          status,
          assignedAt: data.assignedAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      tests.sort((left, right) =>
        (right.assignedAt?.toMillis() ?? 0) - (left.assignedAt?.toMillis() ?? 0)
      );
      callback(tests);
    },
    onError,
  );
}

export async function assignDiagnosticTests(
  patientId: string,
  diagnosis: string,
  assignedBy: string,
  tests: Array<{ category: string; name: string; description: string }>,
) {
  const batch = writeBatch(db);
  const planId = doc(collection(db, 'patients', patientId, 'diagnosticPlans')).id;

  tests.forEach((test) => {
    const testRef = doc(collection(db, 'patients', patientId, 'diagnosticTests'));
    batch.set(testRef, {
      planId,
      category: test.category,
      name: test.name,
      description: test.description,
      diagnosis: diagnosis.trim(),
      assignedBy,
      status: 'ordered' satisfies DiagnosticTestStatus,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const planRef = doc(db, 'patients', patientId, 'diagnosticPlans', planId);
  batch.set(planRef, {
    diagnosis: diagnosis.trim(),
    assignedBy,
    testCount: tests.length,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateDiagnosticTestStatus(
  patientId: string,
  testId: string,
  status: DiagnosticTestStatus,
) {
  await updateDoc(doc(db, 'patients', patientId, 'diagnosticTests', testId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
