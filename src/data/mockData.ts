/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SchoolClass,
  Student,
  Subject,
  ClassSubject,
  Teacher,
  AttendanceSheet,
  AttendanceRecord,
  Evaluation,
  Mark,
  Sequence,
  Term,
  SchoolTenant,
  SchoolPublicSiteConfig,
  SchoolSection,
  SchoolAdmissionConfig,
  SchoolArticle,
  ExamResultPublication,
  PreRegistrationSubmission,
  LibraryResource,
  SchoolUserAccount,
  OnboardingStep,
  SchoolSubscription
} from '../types';

// ============================================================================
// ACADEMIC SYSTEM CONSTANTS (OFFICIAL MINESEC CALENDAR & STRUCTURES)
// ============================================================================

export const TERMS: Term[] = [
  { id: 1, name: "1er Trimestre" },
  { id: 2, name: "2e Trimestre" },
  { id: 3, name: "3e Trimestre" }
];

export const SEQUENCES: Sequence[] = [
  { id: 1, name: "Séquence 1", termId: 1 },
  { id: 2, name: "Séquence 2", termId: 1 },
  { id: 3, name: "Séquence 3", termId: 2 },
  { id: 4, name: "Séquence 4", termId: 2 },
  { id: 5, name: "Séquence 5", termId: 3 },
  { id: 6, name: "Séquence 6", termId: 3 }
];

// Standard Subjects Catalog (available when configuring classes)
export const SUBJECTS: Subject[] = [
  { id: 'subj-math', name: 'Mathématiques', code: 'MATH' },
  { id: 'subj-phys', name: 'Physique-Chimie', code: 'PHYS' },
  { id: 'subj-svt', name: 'Sciences de la Vie et de la Terre', code: 'SVT' },
  { id: 'subj-fran', name: 'Français (Lettres)', code: 'FRAN' },
  { id: 'subj-angl', name: 'Anglais (English)', code: 'ANGL' },
  { id: 'subj-hist', name: 'Histoire-Géographie', code: 'HIST' },
  { id: 'subj-info', name: 'Informatique', code: 'INFO' },
  { id: 'subj-philo', name: 'Philosophie', code: 'PHILO' },
  { id: 'subj-eps', name: 'Éducation Physique et Sportive', code: 'EPS' },
  { id: 'subj-ecm', name: 'Éducation à la Citoyenneté et à la Morale', code: 'ECM' },
  { id: 'subj-all', name: 'Allemand', code: 'ALL' },
  { id: 'subj-esp', name: 'Espagnol', code: 'ESP' },
  { id: 'subj-chim', name: 'Chimie', code: 'CHIM' }
];

// ============================================================================
// PRODUCTION DATASETS (ASI GABON PRIMARY TENANT)
// ============================================================================

export const INITIAL_SCHOOLS: SchoolTenant[] = [
  {
    id: 'asi-gabon',
    name: 'Complexe Scolaire International ASI-GABON',
    slogan: 'Discipline, Rigueur & Excellence Pédagogique',
    logoEmoji: '🏫',
    primaryColor: 'emerald',
    themePrimary: '#059669',
    themeSecondary: '#0f172a',
    themeAccent: '#10b981',
    address: 'BP 4580, Libreville, Gabon',
    phone: '+241 01 70 00 00 / 077 12 34 56',
    email: 'ASI-GABON@gmail.com',
    activeSchoolYear: '2025-2026',
    systemVersion: 'v2.5.0',
    licenseStatus: 'Active',
    enableHomeworkTracking: true,
    enableAttendanceTracking: true
  }
];

export const CLASSES: SchoolClass[] = [
  {
    id: 'cls-asi-tlec',
    name: 'Terminale C (Scientifique)',
    level: 'Second Cycle (2nde - Tle)',
    studentCount: 35,
    schoolId: 'asi-gabon',
    stream: 'Scientifique',
    mainTeacherId: 'acc-asi-gabon-prof-math',
    mainTeacherName: 'M. NGUEMA Marc (Professeur de Mathématiques)'
  },
  {
    id: 'cls-asi-tled',
    name: 'Terminale D (Sciences Naturelles)',
    level: 'Second Cycle (2nde - Tle)',
    studentCount: 40,
    schoolId: 'asi-gabon',
    stream: 'Scientifique',
    mainTeacherId: 'acc-asi-gabon-prof-pc',
    mainTeacherName: 'Mme BEKALE Sylvie (Professeur de Sciences Physiques)'
  },
  {
    id: 'cls-asi-1a4',
    name: 'Première A4 (Littéraire)',
    level: 'Second Cycle (2nde - Tle)',
    studentCount: 40,
    schoolId: 'asi-gabon',
    stream: 'Littéraire',
    mainTeacherId: 'acc-asi-gabon-prof-fr',
    mainTeacherName: 'M. OBAME Paul (Professeur de Lettres Françaises)'
  },
  {
    id: 'cls-asi-3a',
    name: 'Troisième 3ème A',
    level: 'Premier Cycle (6e - 3e)',
    studentCount: 45,
    schoolId: 'asi-gabon',
    stream: 'Général',
    mainTeacherId: 'acc-asi-gabon-prof-fr',
    mainTeacherName: 'M. OBAME Paul (Professeur de Lettres Françaises)'
  }
];

export const STUDENTS: Student[] = [
  {
    id: 'stud-asi-001',
    matricule: 'ASI-2026-001',
    classId: 'cls-asi-tlec',
    firstName: 'Emmanuel',
    lastName: 'NDONG OBAME',
    gender: 'M',
    dob: '2008-04-12',
    parentName: 'M. Ndong Obame Jean-Paul',
    parentPhone: '077 12 34 56',
    parentEmail: 'parent.ndong@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-002',
    matricule: 'ASI-2026-002',
    classId: 'cls-asi-tlec',
    firstName: 'Grace',
    lastName: 'MBADINGA',
    gender: 'F',
    dob: '2008-08-25',
    parentName: 'Mme Mbadinga Clarisse',
    parentPhone: '065 44 22 11',
    parentEmail: 'famille.mbadinga@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-003',
    matricule: 'ASI-2026-003',
    classId: 'cls-asi-tled',
    firstName: 'Cédric',
    lastName: 'OBAME MBA',
    gender: 'M',
    dob: '2008-11-14',
    parentName: 'M. Obame Mba Félix',
    parentPhone: '074 88 99 00',
    parentEmail: 'obamemba.parent@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-004',
    matricule: 'ASI-2026-004',
    classId: 'cls-asi-3a',
    firstName: 'Vanessa',
    lastName: 'NZANG EYI',
    gender: 'F',
    dob: '2011-03-18',
    parentName: 'Mme Nzang Eyi Sylvie',
    parentPhone: '077 99 88 77',
    parentEmail: 'nzang.tuteur@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-005',
    matricule: 'ASI-2026-005',
    classId: 'cls-asi-tlec',
    firstName: 'Franck',
    lastName: 'MVE ASSOUMOU',
    gender: 'M',
    dob: '2008-01-19',
    parentName: 'M. Mve Assoumou Jean-Marc',
    parentPhone: '077 45 12 89',
    parentEmail: 'mve.assoumou@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-006',
    matricule: 'ASI-2026-006',
    classId: 'cls-asi-tlec',
    firstName: 'Jessica',
    lastName: 'NTSAME ONDO',
    gender: 'F',
    dob: '2008-07-03',
    parentName: 'Mme Ondo Marie-Louise',
    parentPhone: '066 33 22 11',
    parentEmail: 'ondomarie@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-007',
    matricule: 'ASI-2026-007',
    classId: 'cls-asi-tled',
    firstName: 'Mireille',
    lastName: 'BOUSSOUGOU',
    gender: 'F',
    dob: '2008-05-16',
    parentName: 'M. Boussougou Paul',
    parentPhone: '074 11 22 33',
    parentEmail: 'boussougou.paul@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-008',
    matricule: 'ASI-2026-008',
    classId: 'cls-asi-1a4',
    firstName: 'Sarah',
    lastName: 'OYANE MBA',
    gender: 'F',
    dob: '2009-02-14',
    parentName: 'Mme Mba Hortense',
    parentPhone: '077 65 43 21',
    parentEmail: 'mba.hortense@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  },
  {
    id: 'stud-asi-009',
    matricule: 'ASI-2026-009',
    classId: 'cls-asi-3a',
    firstName: 'Marc',
    lastName: 'AUBAME EDZANG',
    gender: 'M',
    dob: '2011-09-10',
    parentName: 'M. Aubame Edzang Arthur',
    parentPhone: '065 99 88 11',
    parentEmail: 'aubame.arthur@gmail.com',
    parentPassword: '1234',
    schoolId: 'asi-gabon',
    status: 'Actif'
  }
];

export const TEACHERS: Teacher[] = [];

export const CLASS_SUBJECTS: ClassSubject[] = [];

export const INITIAL_ATTENDANCE_SHEETS: AttendanceSheet[] = [];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const INITIAL_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-asi-001',
    classId: 'cls-asi-tlec',
    subjectId: 'subj-math',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'CONTROLE',
    coefficient: 5,
    date: '2025-10-15',
    status: 'DRAFT',
    title: 'Contrôle N°1 : Nombres Complexes & Fonctions',
    schoolId: 'asi-gabon'
  },
  {
    id: 'eval-asi-002',
    classId: 'cls-asi-tlec',
    subjectId: 'subj-phys',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'DEVOIR',
    coefficient: 4,
    date: '2025-10-22',
    status: 'DRAFT',
    title: 'Devoir Harmonisé de Physique-Chimie',
    schoolId: 'asi-gabon'
  },
  {
    id: 'eval-asi-003',
    classId: 'cls-asi-tled',
    subjectId: 'subj-svt',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'CONTROLE',
    coefficient: 5,
    date: '2025-10-18',
    status: 'DRAFT',
    title: 'Contrôle Continu : Génétique Moléculaire',
    schoolId: 'asi-gabon'
  },
  {
    id: 'eval-asi-004',
    classId: 'cls-asi-1a4',
    subjectId: 'subj-fran',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'DEVOIR',
    coefficient: 4,
    date: '2025-10-20',
    status: 'DRAFT',
    title: 'Dissertation : Le Roman Africain Contemporain',
    schoolId: 'asi-gabon'
  },
  {
    id: 'eval-asi-005',
    classId: 'cls-asi-3a',
    subjectId: 'subj-math',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'CONTROLE',
    coefficient: 3,
    date: '2025-10-12',
    status: 'DRAFT',
    title: 'Contrôle Séquence 1 : Calcul Numérique & Thalès',
    schoolId: 'asi-gabon'
  },
  {
    id: 'eval-asi-006',
    classId: 'cls-asi-3a',
    subjectId: 'subj-fran',
    teacherId: 'teach-1',
    sequenceId: 1,
    termId: 1,
    type: 'CONTROLE',
    coefficient: 3,
    date: '2025-10-25',
    status: 'DRAFT',
    title: 'Devoir Surveillé : Grammaire & Dictée',
    schoolId: 'asi-gabon'
  }
];

export const INITIAL_MARKS: Mark[] = [
  // eval-asi-001 (Maths Tle C)
  { id: 'm-asi-101', evaluationId: 'eval-asi-001', studentId: 'stud-asi-001', value: 16.5, comment: 'Excellent raisonnement mathématique' },
  { id: 'm-asi-102', evaluationId: 'eval-asi-001', studentId: 'stud-asi-002', value: 14.0, comment: 'Bon travail, soigner les calculs' },
  { id: 'm-asi-103', evaluationId: 'eval-asi-001', studentId: 'stud-asi-005', value: 11.5, comment: 'Assez bien, revoir les formules' },
  { id: 'm-asi-104', evaluationId: 'eval-asi-001', studentId: 'stud-asi-006', value: 17.0, comment: 'Très bonne copie, bravo' },

  // eval-asi-002 (Physique Tle C)
  { id: 'm-asi-201', evaluationId: 'eval-asi-002', studentId: 'stud-asi-001', value: 15.0, comment: 'Bonne maîtrise des notions' },
  { id: 'm-asi-202', evaluationId: 'eval-asi-002', studentId: 'stud-asi-002', value: 13.5, comment: 'Travail sérieux et appliqué' },
  { id: 'm-asi-203', evaluationId: 'eval-asi-002', studentId: 'stud-asi-005', value: 12.0, comment: 'Ensemble convenable' },
  { id: 'm-asi-204', evaluationId: 'eval-asi-002', studentId: 'stud-asi-006', value: 16.0, comment: 'Très bon esprit d\'analyse' },

  // eval-asi-003 (SVT Tle D)
  { id: 'm-asi-301', evaluationId: 'eval-asi-003', studentId: 'stud-asi-003', value: 14.5, comment: 'Bonne démarche scientifique' },
  { id: 'm-asi-302', evaluationId: 'eval-asi-003', studentId: 'stud-asi-007', value: 15.5, comment: 'Très bonne restitution des connaissances' },

  // eval-asi-004 (Français 1ère A4)
  { id: 'm-asi-401', evaluationId: 'eval-asi-004', studentId: 'stud-asi-008', value: 15.0, comment: 'Style fluide et argumentation solide' },

  // eval-asi-005 (Maths 3ème A)
  { id: 'm-asi-501', evaluationId: 'eval-asi-005', studentId: 'stud-asi-004', value: 14.0, comment: 'Bien compris le théorème' },
  { id: 'm-asi-502', evaluationId: 'eval-asi-005', studentId: 'stud-asi-009', value: 12.5, comment: 'Des efforts réguliers' }
];

export const INITIAL_PUBLIC_SITE_CONFIGS: Record<string, SchoolPublicSiteConfig> = {
  'asi-gabon': {
    schoolId: 'asi-gabon',
    principalName: 'Direction Générale ASI Gabon',
    principalTitle: 'Proviseur & Directeur des Études',
    principalMessage: 'Bienvenue au Complexe Scolaire International ASI Gabon. Notre mission : l\'excellence académique, la rigueur civique et l\'épanouissement de chaque apprenant.',
    historyText: 'Fondé pour répondre aux standards internationaux de l\'éducation, ASI Gabon s\'illustre par son encadrement rigoureux et ses résultats exemplaires aux examens officiels.',
    missionText: 'Offrir un enseignement d\'excellence alliant compétences scientifiques, bilinguisme, technologies numériques et valeurs civiques.',
    visionText: 'Demeurer l\'établissement de référence au Gabon pour l\'intégration académique et professionnelle de la jeunesse.',
    stats: {
      bacSuccessRate: 98.4,
      studentCount: 850,
      teacherCount: 52,
      infrastructureCount: 34
    },
    gallery: [
      { id: 'gal-1', title: 'Campus Principal', imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800', category: 'Infrastructure' },
      { id: 'gal-2', title: 'Laboratoire de Sciences', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800', category: 'Pédagogie' }
    ]
  }
};

export const INITIAL_SECTIONS: SchoolSection[] = [];

export const INITIAL_ADMISSION_CONFIGS: Record<string, SchoolAdmissionConfig> = {};

export const INITIAL_ARTICLES: SchoolArticle[] = [];

export const INITIAL_EXAM_RESULTS: ExamResultPublication[] = [];

export const INITIAL_PRE_REGISTRATIONS: PreRegistrationSubmission[] = [];

export const INITIAL_LIBRARY_RESOURCES: LibraryResource[] = [];

export const INITIAL_USER_ACCOUNTS: SchoolUserAccount[] = [
  {
    id: 'acc-asi-gabon-admin',
    schoolId: 'asi-gabon',
    fullName: 'Direction Pédagogique ASI Gabon',
    username: 'ASI-GABON@gmail.com',
    email: 'ASI-GABON@gmail.com',
    phone: '+241 077 12 34 56',
    role: 'PROVISEUR',
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-censeur',
    schoolId: 'asi-gabon',
    fullName: 'M. MBOUMBA André (Censeur Général)',
    username: 'censeur.asi@gmail.com',
    email: 'censeur.asi@gmail.com',
    phone: '+241 074 22 33 44',
    role: 'CENSEUR',
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-sg',
    schoolId: 'asi-gabon',
    fullName: 'Mme NYINGONE Charlotte (Surveillante Générale)',
    username: 'surveillant.asi@gmail.com',
    email: 'surveillant.asi@gmail.com',
    phone: '+241 077 55 66 77',
    role: 'SURVEILLANT_GENERAL',
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-intendant',
    schoolId: 'asi-gabon',
    fullName: 'M. ONDO Guy-Roger (Intendant / Économe)',
    username: 'intendance.asi@gmail.com',
    email: 'intendance.asi@gmail.com',
    phone: '+241 066 88 99 00',
    role: 'INTENDANT',
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-prof-math',
    schoolId: 'asi-gabon',
    fullName: 'M. NGUEMA Marc (Professeur de Mathématiques)',
    username: 'prof.maths.asi@gmail.com',
    email: 'prof.maths.asi@gmail.com',
    phone: '+241 077 11 22 33',
    role: 'ENSEIGNANT',
    assignedClasses: ['cls-asi-tlec', 'cls-asi-tled'],
    assignedSubjects: ['subj-math'],
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-prof-pc',
    schoolId: 'asi-gabon',
    fullName: 'Mme BEKALE Sylvie (Professeur de Sciences Physiques)',
    username: 'prof.physique.asi@gmail.com',
    email: 'prof.physique.asi@gmail.com',
    phone: '+241 074 44 55 66',
    role: 'ENSEIGNANT',
    assignedClasses: ['cls-asi-tlec', 'cls-asi-tled'],
    assignedSubjects: ['subj-phys', 'subj-chim'],
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-asi-gabon-prof-fr',
    schoolId: 'asi-gabon',
    fullName: 'M. OBAME Paul (Professeur de Lettres Françaises)',
    username: 'prof.francais.asi@gmail.com',
    email: 'prof.francais.asi@gmail.com',
    phone: '+241 066 33 22 11',
    role: 'ENSEIGNANT',
    assignedClasses: ['cls-asi-1a4', 'cls-asi-3a'],
    assignedSubjects: ['subj-fran'],
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_ONBOARDING_STEPS: OnboardingStep[] = [];

export const INITIAL_SUBSCRIPTIONS: Record<string, SchoolSubscription> = {
  'asi-gabon': {
    schoolId: 'asi-gabon',
    planType: 'PRO_EXCELLENCE',
    plan: 'PRO_EXCELLENCE',
    status: 'ACTIVE',
    validUntil: '2026-12-31',
    studentCount: 850,
    smsCreditsRemaining: 2500,
    activatedModules: {
      bulletinsMinesec: true,
      attendanceSms: true,
      digitalLibrary: true,
      schoolPublicSite: true,
      studentParentPortal: true,
      apiExportRest: true
    }
  }
};
