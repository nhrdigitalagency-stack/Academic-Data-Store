/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export type AbsenceReason = 'MALADIE' | 'AUTORISE' | 'NON_AUTORISE' | 'AUTRE' | '';

export type EvaluationType = 'CONTROLE' | 'DEVOIR' | 'EXAMEN';

export type ValidationStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED';

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Terminale C", "6ème M1", "3ème Allemand"
  level: string; // "Premier Cycle (6e - 3e)" or "Second Cycle (2nde - Tle)"
  studentCount: number;
  schoolId?: string; // for multi-tenancy
  stream?: string; // e.g. "Scientifique", "Littéraire", "Général"
  mainTeacherId?: string; // ID of the assigned head teacher / professeur principal
  mainTeacherName?: string; // Name of the assigned teacher for quick display
}

export interface Student {
  id: string;
  matricule?: string;
  classId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  dob?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentPassword?: string; // Mot de passe d'accès pour le portail parent
  avatarUrl?: string;
  schoolId?: string; // for multi-tenancy
  status?: string; // e.g. "Active", "Actif", "Inactive"
}

export type HomeworkStatus = 'FAIT' | 'NON_FAIT' | 'PARTIEL' | 'DONE' | 'NOT_DONE' | 'LATE' | 'EXCUSED' | 'PENDING';

export interface Homework {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  assignedDate?: string; // YYYY-MM-DD
  createdAt?: string;
  schoolId?: string;
  teacherId?: string;
  submissions: HomeworkSubmission[];
}

export interface HomeworkSubmission {
  id?: string;
  homeworkId?: string;
  studentId: string;
  status: HomeworkStatus; // 'FAIT' | 'NON_FAIT' | 'PARTIEL' | 'DONE' | 'NOT_DONE' | 'LATE' | 'EXCUSED'
  comment?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string; // e.g. "Mathématiques", "Physique", "Sciences de la Vie et de la Terre", "Français", "Anglais"
  code: string; // e.g. "MATH", "PHYS", "SVT", "FRAN", "ANGL"
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  coefficient: number; // e.g. 5 for Math in Terminale C, 2 for history
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[]; // subjectIds
}

export interface AttendanceSheet {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "08:00 - 10:00", "10:00 - 12:00"
  sequenceId: number; // 1 to 6
  schoolId?: string; // for multi-tenancy
}

export interface AttendanceRecord {
  id: string;
  sheetId: string;
  studentId: string;
  status: AttendanceStatus;
  reason: AbsenceReason;
  comment?: string;
  date?: string;
  isExcused?: boolean;
}

export interface Evaluation {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  sequenceId: number; // 1 to 6
  termId: number; // 1 to 3
  type: EvaluationType;
  coefficient: number;
  date: string; // YYYY-MM-DD
  status: ValidationStatus;
  title: string; // e.g., "Contrôle de géométrie"
  schoolId?: string; // for multi-tenancy
}

export interface Mark {
  id: string;
  evaluationId: string;
  studentId: string;
  value: number; // 0 to 20
  comment?: string;
}

export interface Sequence {
  id: number; // 1 to 6
  name: string; // e.g., "Séquence 1"
  termId: number; // 1 to 3
}

export interface Term {
  id: number; // 1 to 3
  name: string; // e.g., "1er Trimestre"
}

export interface SchoolTenant {
  id: string;
  name: string;
  slogan: string;
  logoEmoji: string;
  logoUrl?: string; // customizable brand logo image URL / data URL
  primaryColor: 'blue' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet';
  address: string;
  phone: string;
  email: string;
  activeSchoolYear: string; // active school year e.g., "2025-2026"
  themePrimary?: string; // custom hex primary color
  themeSecondary?: string; // custom hex secondary color
  themeAccent?: string; // custom hex accent color
  systemVersion?: string; // e.g., "v2.5.0"
  licenseStatus?: 'Active' | 'Expired' | 'Pending' | 'Suspended';
  enableHomeworkTracking?: boolean; // Option activable pour le suivi des devoirs
  enableAttendanceTracking?: boolean; // Option activable pour le suivi des présences
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string or format
  action: string;
  schoolId: string;
  schoolName: string;
  details: string;
  user: string;
}

// ----------------------------------------------------
// MODULE: SITE PUBLIC DE L'ÉTABLISSEMENT & CMS
// ----------------------------------------------------

export interface SchoolSection {
  id: string;
  title: string;
  code: string; // e.g. "SÉRIE C", "SÉRIE D", "SÉRIE A4", "SECTION BILINGUE"
  level: 'Premier Cycle (6e - 3e)' | 'Second Cycle (2nde - Tle)' | 'Technique' | 'Général' | string;
  description: string;
  requirements: string;
  careerOpportunities: string;
  keySubjects: string[];
  icon: string;
}

export interface AdmissionFeeItem {
  label: string;
  amount: number;
  currency: string;
  period: string; // "À l'inscription", "Trimestre 1", etc.
  mandatory: boolean;
}

export interface SchoolAdmissionConfig {
  academicYear: string;
  startDate: string;
  deadlineDate: string;
  requirements: string[];
  requiredDocuments: string[];
  fees: AdmissionFeeItem[];
  onlinePreRegistrationEnabled: boolean;
  contactPerson: string;
  contactPhone: string;
}

export interface SchoolArticle {
  id: string;
  schoolId: string;
  title: string;
  category: 'Actualité' | 'Événement' | 'Vie Scolaire' | 'Excellence' | 'Sport' | 'Culture';
  date: string;
  author: string;
  summary: string;
  content: string;
  imageUrl?: string;
  featured?: boolean;
}

export interface ExamResultPublication {
  id: string;
  schoolId: string;
  examType: 'BEPC' | 'PROBATOIRE' | 'BAC' | 'CAP' | 'CONCOURS';
  year: number;
  session: string;
  series: string; // "Série C", "Série D", "Toutes Séries", etc.
  totalCandidates: number;
  admittedCount: number;
  successRate: number; // percentage e.g. 96.5
  nationalRank?: number;
  honorRoll: { studentName: string; mention: 'Très Bien' | 'Bien' | 'Assez Bien' | 'Major'; series: string }[];
  publishDate: string;
  pdfUrl?: string;
}

export interface PreRegistrationSubmission {
  id: string;
  schoolId: string;
  candidateFirstName: string;
  candidateLastName: string;
  birthDate: string;
  dob?: string;
  gender: 'M' | 'F';
  requestedClass: string;
  previousSchool: string;
  previousAverage?: number;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  submittedAt: string;
  notes?: string;
}

export interface SchoolPublicSiteConfig {
  schoolId: string;
  principalName: string;
  principalTitle: string; // e.g. "Proviseur du Lycée Bilingue"
  principalMessage: string;
  principalPhotoUrl?: string;
  historyText: string;
  missionText: string;
  visionText: string;
  stats: {
    bacSuccessRate: number;
    studentCount: number;
    teacherCount: number;
    infrastructureCount: number;
  };
  gallery: { id: string; title: string; imageUrl: string; category: string }[];
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };
}

// ----------------------------------------------------
// MODULE: BIBLIOTHÈQUE NUMÉRIQUE (ÉPREUVES & COURS)
// ----------------------------------------------------

export type LibraryResourceType = 'ÉPREUVE' | 'COURS' | 'CORRIGÉ' | 'FICHE_RÉVISION' | 'VIDÉO' | 'POLYCOPIÉ';

export interface LibraryResource {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  type: LibraryResourceType;
  subjectId: string;
  subjectName: string;
  classLevel: string; // "Terminale C", "Terminale D", "3ème", "Toutes classes"
  examType?: 'BEPC' | 'PROBATOIRE' | 'BAC' | 'SÉQUENCE' | 'CONCOURS' | 'AUTRE';
  year: number;
  sequenceNumber?: number;
  termNumber?: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  fileFormat: 'PDF' | 'DOCX' | 'MP4' | 'PNG' | 'ZIP';
  fileSize: string;
  downloadCount: number;
  viewCount: number;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  contentPreview?: string; // Summary of content or mock full text
}

// ----------------------------------------------------
// MODULE: DÉPLOIEMENT, GESTION DES COMPTES & ONBOARDING
// ----------------------------------------------------

export type UserAccountRole = 
  | 'PROVISEUR' 
  | 'CENSEUR' 
  | 'SURVEILLANT_GENERAL' 
  | 'INTENDANT' 
  | 'SECRETAIRE' 
  | 'ENSEIGNANT' 
  | 'PARENT' 
  | 'ELEVE';

export interface SchoolUserAccount {
  id: string;
  schoolId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: UserAccountRole;
  assignedClasses?: string[]; // class IDs or names
  assignedSubjects?: string[]; // subject IDs or names
  studentId?: string; // link to student record
  parentOfStudentIds?: string[]; // links to student records
  status: 'ACTIF' | 'EN_ATTENTE' | 'SUSPENDU';
  initialPassword?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'CONFIG' | 'EFFECTIFS' | 'PEDAGOGIE' | 'COMMUNICATION';
  completed: boolean;
  completedAt?: string;
  actionTab?: string;
}

// ----------------------------------------------------
// MODULE: FACTURATION & SOUSCRIPTION SAAS
// ----------------------------------------------------

export type SubscriptionPlanType = 'STANDARD' | 'PRO_EXCELLENCE' | 'RESEAU_ACADEMIQUE';

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string; // e.g. "FAC-2025-LBY-001"
  date: string;
  dueDate: string;
  amount: number;
  currency: 'FCFA';
  status: 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE';
  studentCount: number;
  planName: string;
  paymentMethod?: 'Orange Money' | 'MTN Mobile Money' | 'Virement Bancaire' | 'Chèque Trésor' | 'Espèces';
  paymentReference?: string;
  notes?: string;
}

export interface SchoolSubscription {
  schoolId: string;
  planType?: SubscriptionPlanType;
  plan?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'PRO_EXCELLENCE' | 'RESEAU_ACADEMIQUE';
  pricePerStudentPerYear?: number;
  priceMonthlyFcfa?: number;
  studentCount?: number;
  totalAnnualAmount?: number;
  currency?: 'FCFA';
  status?: 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'TRIAL';
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'TERMLY' | string;
  startDate?: string;
  expiryDate?: string;
  validUntil?: string;
  nextRenewalDate?: string;
  smsCreditsRemaining?: number;
  smsIncluded?: number;
  smsUsed?: number;
  storageUsedMb?: number;
  storageLimitMb?: number;
  maxStudents?: number;
  features?: string[];
  activatedModules?: {
    bulletinsMinesec: boolean;
    attendanceSms: boolean;
    digitalLibrary: boolean;
    schoolPublicSite: boolean;
    studentParentPortal: boolean;
    apiExportRest: boolean;
  };
  invoices?: SubscriptionInvoice[];
}


