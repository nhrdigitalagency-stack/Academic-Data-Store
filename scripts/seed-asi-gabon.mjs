import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const config = {
  apiKey: "AIzaSyD9DT541sAEDGhM3a_zNvxDFbQDEdoN4fA",
  authDomain: "academic-data-store.firebaseapp.com",
  projectId: "academic-data-store",
  storageBucket: "academic-data-store.firebasestorage.app",
  messagingSenderId: "434659010881",
  appId: "1:434659010881:web:b547f4cdc60b59523319c0"
};

const databaseId = "ai-studio-academicdatastor-70e5e4dd-682c-4b6e-84e4-ebc88e3fdf52";
const app = initializeApp(config);
const db = initializeFirestore(app, {}, databaseId);

async function seed() {
  console.log("Seeding ASI Gabon into Firestore...");

  // 1. School
  const school = {
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
  };
  await setDoc(doc(db, 'schools', 'asi-gabon'), school);
  console.log("Seeded school: asi-gabon");

  // 2. User Account
  const userAccount = {
    id: 'acc-asi-gabon-admin',
    schoolId: 'asi-gabon',
    fullName: 'Direction Pédagogique ASI Gabon',
    username: 'ASI-GABON@gmail.com',
    email: 'ASI-GABON@gmail.com',
    phone: '+241 077 12 34 56',
    role: 'PROVISEUR',
    status: 'ACTIF',
    initialPassword: 'admin2026',
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'userAccounts', 'acc-asi-gabon-admin'), userAccount);
  console.log("Seeded userAccount: acc-asi-gabon-admin");

  // 3. Classes
  const classes = [
    {
      id: 'cls-asi-tlec',
      name: 'Terminale C (Scientifique)',
      code: 'TLE-C',
      level: 'Second Cycle',
      section: 'Scientifique',
      mainRoom: 'Salle B12 - Laboratoire',
      capacity: 35,
      schoolId: 'asi-gabon',
      headTeacherId: 'prof-math-01',
      subjectIds: ['subj-math', 'subj-phys', 'subj-svt', 'subj-fran', 'subj-angl', 'subj-philo']
    },
    {
      id: 'cls-asi-tled',
      name: 'Terminale D (Sciences Naturelles)',
      code: 'TLE-D',
      level: 'Second Cycle',
      section: 'Scientifique',
      mainRoom: 'Salle B14',
      capacity: 40,
      schoolId: 'asi-gabon',
      headTeacherId: 'prof-svt-01',
      subjectIds: ['subj-math', 'subj-phys', 'subj-svt', 'subj-fran', 'subj-angl', 'subj-philo']
    },
    {
      id: 'cls-asi-1a4',
      name: 'Première A4 (Littéraire)',
      code: '1ERE-A4',
      level: 'Second Cycle',
      section: 'Littéraire',
      mainRoom: 'Salle A08',
      capacity: 40,
      schoolId: 'asi-gabon',
      headTeacherId: 'prof-fran-01',
      subjectIds: ['subj-fran', 'subj-angl', 'subj-hist', 'subj-philo', 'subj-math', 'subj-eps']
    },
    {
      id: 'cls-asi-3a',
      name: 'Troisième 3ème A',
      code: '3EME-A',
      level: 'Premier Cycle',
      section: 'Générale',
      mainRoom: 'Salle C04',
      capacity: 45,
      schoolId: 'asi-gabon',
      headTeacherId: 'prof-hist-01',
      subjectIds: ['subj-math', 'subj-phys', 'subj-svt', 'subj-fran', 'subj-angl', 'subj-hist', 'subj-info']
    }
  ];
  for (const c of classes) {
    await setDoc(doc(db, 'classes', c.id), c);
  }
  console.log("Seeded classes:", classes.length);

  // 4. Students
  const students = [
    {
      id: 'stud-asi-001',
      matricule: 'ASI-2026-001',
      firstName: 'Emmanuel',
      lastName: 'NDONG OBAME',
      gender: 'M',
      classId: 'cls-asi-tlec',
      dateOfBirth: '2008-04-12',
      placeOfBirth: 'Libreville',
      parentPhone: '077 12 34 56',
      parentEmail: 'parent.ndong@gmail.com',
      parentPassword: '1234',
      address: 'Quartier Louis, Libreville',
      schoolId: 'asi-gabon',
      status: 'INSCRIT',
      registrationDate: '2025-09-02'
    },
    {
      id: 'stud-asi-002',
      matricule: 'ASI-2026-002',
      firstName: 'Grace',
      lastName: 'MBADINGA',
      gender: 'F',
      classId: 'cls-asi-tlec',
      dateOfBirth: '2008-08-25',
      placeOfBirth: 'Port-Gentil',
      parentPhone: '065 44 22 11',
      parentEmail: 'famille.mbadinga@gmail.com',
      parentPassword: '1234',
      address: 'Akanda, Libreville',
      schoolId: 'asi-gabon',
      status: 'INSCRIT',
      registrationDate: '2025-09-02'
    },
    {
      id: 'stud-asi-003',
      matricule: 'ASI-2026-003',
      firstName: 'Cédric',
      lastName: 'OBAME MBA',
      gender: 'M',
      classId: 'cls-asi-tled',
      dateOfBirth: '2008-11-14',
      placeOfBirth: 'Oyem',
      parentPhone: '074 88 99 00',
      parentEmail: 'obamemba.parent@gmail.com',
      parentPassword: '1234',
      address: 'Oloumi, Libreville',
      schoolId: 'asi-gabon',
      status: 'INSCRIT',
      registrationDate: '2025-09-03'
    },
    {
      id: 'stud-asi-004',
      matricule: 'ASI-2026-004',
      firstName: 'Vanessa',
      lastName: 'NZANG EYI',
      gender: 'F',
      classId: 'cls-asi-3a',
      dateOfBirth: '2011-03-18',
      placeOfBirth: 'Franceville',
      parentPhone: '077 99 88 77',
      parentEmail: 'nzang.tuteur@gmail.com',
      parentPassword: '1234',
      address: 'Glass, Libreville',
      schoolId: 'asi-gabon',
      status: 'INSCRIT',
      registrationDate: '2025-09-04'
    }
  ];
  for (const s of students) {
    await setDoc(doc(db, 'students', s.id), s);
  }
  console.log("Seeded students:", students.length);

  // 5. Evaluations
  const evaluations = [
    {
      id: 'eval-asi-001',
      title: 'Contrôle Continu N°1 - Analyse & Suites',
      classId: 'cls-asi-tlec',
      subjectId: 'subj-math',
      teacherId: 'prof-math-01',
      sequenceId: 1,
      termId: 1,
      type: 'DEVOIR_SURVEILLE',
      coefficient: 6,
      date: '2025-10-15',
      status: 'VALIDATED',
      schoolId: 'asi-gabon'
    },
    {
      id: 'eval-asi-002',
      title: 'Évaluation Harmonisée - Électromagnétisme',
      classId: 'cls-asi-tlec',
      subjectId: 'subj-phys',
      teacherId: 'prof-phys-01',
      sequenceId: 1,
      termId: 1,
      type: 'CONTROLE_CONTINU',
      coefficient: 5,
      date: '2025-10-22',
      status: 'VALIDATED',
      schoolId: 'asi-gabon'
    },
    {
      id: 'eval-asi-003',
      title: 'Dissertation Littéraire - Classicisme',
      classId: 'cls-asi-1a4',
      subjectId: 'subj-fran',
      teacherId: 'prof-fran-01',
      sequenceId: 1,
      termId: 1,
      type: 'DEVOIR_SURVEILLE',
      coefficient: 5,
      date: '2025-10-18',
      status: 'VALIDATED',
      schoolId: 'asi-gabon'
    }
  ];
  for (const ev of evaluations) {
    await setDoc(doc(db, 'evaluations', ev.id), ev);
  }
  console.log("Seeded evaluations:", evaluations.length);

  // 6. Marks
  const marks = [
    { id: 'mark-asi-001', evaluationId: 'eval-asi-001', studentId: 'stud-asi-001', value: 16.5, comment: 'Excellent travail, rigueur mathématique remarquable.' },
    { id: 'mark-asi-002', evaluationId: 'eval-asi-001', studentId: 'stud-asi-002', value: 14.0, comment: 'Bonne copie, calculs soignés.' },
    { id: 'mark-asi-003', evaluationId: 'eval-asi-002', studentId: 'stud-asi-001', value: 15.0, comment: 'Très bonne maîtrise des lois physiques.' },
    { id: 'mark-asi-004', evaluationId: 'eval-asi-002', studentId: 'stud-asi-002', value: 13.5, comment: 'Satisfaisant. Approfondir les applications numériques.' }
  ];
  for (const m of marks) {
    await setDoc(doc(db, 'marks', m.id), m);
  }
  console.log("Seeded marks:", marks.length);

  // 7. Attendance Sheet
  const today = new Date().toISOString().split('T')[0];
  const sheet = {
    id: 'sheet-asi-001',
    classId: 'cls-asi-tlec',
    subjectId: 'subj-math',
    teacherId: 'prof-math-01',
    date: today,
    timeSlot: '08:00 - 10:00',
    sequenceId: 1,
    schoolId: 'asi-gabon'
  };
  await setDoc(doc(db, 'sheets', sheet.id), sheet);

  const records = [
    { id: 'rec-asi-001', sheetId: 'sheet-asi-001', studentId: 'stud-asi-001', status: 'PRESENT', reason: 'AUCUN', date: today },
    { id: 'rec-asi-002', sheetId: 'sheet-asi-001', studentId: 'stud-asi-002', status: 'PRESENT', reason: 'AUCUN', date: today }
  ];
  for (const r of records) {
    await setDoc(doc(db, 'records', r.id), r);
  }
  console.log("Seeded attendance sheet and records.");

  // 8. Public Site Config
  const siteConfig = {
    schoolId: 'asi-gabon',
    principalName: 'Direction Générale ASI Gabon',
    principalTitle: 'Proviseur & Directeur des Études',
    principalMessage: 'Bienvenue au Complexe Scolaire International ASI Gabon. Notre engagement est de former les leaders de demain dans un environnement d\'excellence et d\'éthique.',
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
  };
  await setDoc(doc(db, 'siteConfigs', 'asi-gabon'), siteConfig);
  console.log("Seeded siteConfigs: asi-gabon");

  // 9. Subscription
  const subscription = {
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
  };
  await setDoc(doc(db, 'subscriptions', 'asi-gabon'), subscription);
  console.log("Seeded subscription: asi-gabon");

  console.log("ALL DATA FOR ASI-GABON SEEDED SUCCESSFULLY!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
