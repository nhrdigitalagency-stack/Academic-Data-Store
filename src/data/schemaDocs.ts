/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TableField {
  name: string;
  type: string;
  constraints?: string;
  description: string;
}

export interface TableSchema {
  tableName: string;
  description: string;
  fields: TableField[];
  relations: string[];
  indices?: string[];
  ddl: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: 'Présences' | 'Notes' | 'Administration' | 'Éléves & Classes';
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string; // JSON schema or description
  responseExample: string; // JSON string
}

export const DATABASE_SCHEMAS: TableSchema[] = [
  {
    tableName: 'classes',
    description: 'Enregistre les classes de l\'établissement (ex: Terminale C, 3ème Allemand).',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Identifiant unique de la classe.' },
      { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'Nom de la classe visible par les utilisateurs.' },
      { name: 'level', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Cycle / Niveau d\'enseignement (Premier Cycle (6e - 3e), Second Cycle (2nde - Tle)).' }
    ],
    relations: [
      'One-to-Many avec `students` (Une classe contient plusieurs élèves).',
      'One-to-Many avec `class_subjects` (Une classe possède plusieurs matières programmées).'
    ],
    ddl: `CREATE TABLE classes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    tableName: 'students',
    description: 'Tableau des élèves inscrits au sein de l\'établissement.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Identifiant unique de l\'élève.' },
      { name: 'class_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES classes(id) ON DELETE RESTRICT', description: 'ID de la classe actuelle de l\'élève.' },
      { name: 'first_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Prénom(s) de l\'élève.' },
      { name: 'last_name', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Nom de famille de l\'élève.' },
      { name: 'gender', type: 'CHAR(1)', constraints: 'CHECK (gender IN (\'M\', \'F\'))', description: 'Genre de l\'élève (\'M\' ou \'F\').' },
      { name: 'parent_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Nom complet du parent ou tuteur légal.' },
      { name: 'parent_phone', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Numéro de téléphone du parent (utilisé pour les alertes d\'absence).' },
      { name: 'parent_email', type: 'VARCHAR(150)', constraints: 'NULL', description: 'Adresse email optionnelle du parent.' }
    ],
    relations: [
      'Many-to-One avec `classes` (Chaque élève appartient à une classe unique).',
      'One-to-Many avec `attendance_records` (Un élève a de nombreuses fiches de présence d\'associées).',
      'One-to-Many avec `marks` (Un élève reçoit des notes pour les évaluations).'
    ],
    indices: [
      'CREATE INDEX idx_students_class ON students(class_id);'
    ],
    ddl: `CREATE TABLE students (
  id VARCHAR(50) PRIMARY KEY,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  parent_name VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50) NOT NULL,
  parent_email VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    tableName: 'class_subjects',
    description: 'Table de liaison gérant l\'affectation des matières à chaque classe, incluant le coefficient national et l\'enseignant responsable.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Identifiant de l\'affectation.' },
      { name: 'class_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES classes(id) ON DELETE CASCADE', description: 'ID de la classe.' },
      { name: 'subject_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES subjects(id) ON DELETE RESTRICT', description: 'ID de la matière.' },
      { name: 'teacher_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES teachers(id) ON DELETE SET NULL', description: 'ID de l\'enseignant.' },
      { name: 'coefficient', type: 'INT', constraints: 'NOT NULL DEFAULT 2 CHECK (coefficient > 0)', description: 'Coefficient de la matière dans cette classe spécifique (ex: 6 pour les Maths en Terminale C).' }
    ],
    relations: [
      'Many-to-One avec `classes`.',
      'Many-to-One avec `subjects`.',
      'Many-to-One avec `teachers`.'
    ],
    ddl: `CREATE TABLE class_subjects (
  id VARCHAR(50) PRIMARY KEY,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  teacher_id VARCHAR(50) REFERENCES teachers(id) ON DELETE SET NULL,
  coefficient INT NOT NULL DEFAULT 2 CHECK (coefficient > 0),
  UNIQUE (class_id, subject_id)
);`
  },
  {
    tableName: 'attendance_sheets',
    description: 'Représente l\'en-tête d\'une séance d\'appel pour une classe donnée, à une date et un créneau horaire précis.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Identifiant unique de la feuille de présence.' },
      { name: 'class_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES classes(id) ON DELETE CASCADE', description: 'ID de la classe concernée.' },
      { name: 'subject_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES subjects(id) ON DELETE RESTRICT', description: 'ID de la matière enseignée pendant la séance.' },
      { name: 'teacher_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES teachers(id) ON DELETE SET NULL', description: 'Enseignant ayant fait l\'appel.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL', description: 'Date de la séance.' },
      { name: 'time_slot', type: 'VARCHAR(50)', constraints: 'NOT NULL', description: 'Tranche horaire (ex: \'08:00 - 10:00\', \'10:00 - 12:00\').' },
      { name: 'sequence_id', type: 'INT', constraints: 'NOT NULL CHECK (sequence_id BETWEEN 1 AND 6)', description: 'Numéro de la séquence scolaire en cours (1 à 6).' }
    ],
    relations: [
      'Many-to-One avec `classes`, `subjects`, et `teachers`.',
      'One-to-Many avec `attendance_records` (Contient une ligne par élève de la classe).'
    ],
    ddl: `CREATE TABLE attendance_sheets (
  id VARCHAR(50) PRIMARY KEY,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  teacher_id VARCHAR(50) REFERENCES teachers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  sequence_id INT NOT NULL CHECK (sequence_id BETWEEN 1 AND 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, date, time_slot)
);`
  },
  {
    tableName: 'attendance_records',
    description: 'Enregistre le statut individuel d\'appel pour chaque élève durant une séance.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'Identifiant de la ligne.' },
      { name: 'sheet_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES attendance_sheets(id) ON DELETE CASCADE', description: 'Feuille d\'appel parente.' },
      { name: 'student_id', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE', description: 'Élève concerné.' },
      { name: 'status', type: 'VARCHAR(20)', constraints: 'NOT NULL CHECK (status IN (\'PRESENT\', \'ABSENT\', \'LATE\'))', description: 'Statut de présence (Présent, Absent, Retard).' },
      { name: 'reason', type: 'VARCHAR(50)', constraints: 'CHECK (reason IN (\'MALADIE\', \'AUTORISE\', \'NON_AUTORISE\', \'AUTRE\', \'\'))', description: 'Justificatif ou motif en cas d\'absence/retard.' },
      { name: 'comment', type: 'TEXT', constraints: 'NULL', description: 'Commentaires supplémentaires de l\'enseignant.' }
    ],
    relations: [
      'Many-to-One avec `attendance_sheets`.',
      'Many-to-One avec `students`.'
    ],
    ddl: `CREATE TABLE attendance_records (
  id VARCHAR(50) PRIMARY KEY,
  sheet_id VARCHAR(50) NOT NULL REFERENCES attendance_sheets(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  reason VARCHAR(50) CHECK (reason IN ('MALADIE', 'AUTORISE', 'NON_AUTORISE', 'AUTRE', '')),
  comment TEXT,
  UNIQUE (sheet_id, student_id)
);`
  },
  {
    tableName: 'evaluations',
    description: 'Enregistre les devoirs, contrôles ou examens créés par les enseignants pour une classe.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'ID de l\'évaluation.' },
      { name: 'class_id', type: 'VARCHAR(50)', constraints: 'NOT NULL REFERENCES classes(id) ON DELETE CASCADE', description: 'Classe évaluée.' },
      { name: 'subject_id', type: 'VARCHAR(50)', constraints: 'NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT', description: 'Matière concernée.' },
      { name: 'teacher_id', type: 'VARCHAR(50)', constraints: 'REFERENCES teachers(id) ON DELETE SET NULL', description: 'Enseignant responsable.' },
      { name: 'sequence_id', type: 'INT', constraints: 'NOT NULL CHECK (sequence_id BETWEEN 1 AND 6)', description: 'Numéro de la séquence scolaire (1 à 6).' },
      { name: 'term_id', type: 'INT', constraints: 'NOT NULL CHECK (term_id BETWEEN 1 AND 3)', description: 'Numéro du trimestre associé (1 à 3).' },
      { name: 'type', type: 'VARCHAR(20)', constraints: 'NOT NULL CHECK (type IN (\'CONTROLE\', \'DEVOIR\', \'EXAMEN\'))', description: 'Type d\'évaluation.' },
      { name: 'coefficient', type: 'INT', constraints: 'NOT NULL DEFAULT 1', description: 'Poids multiplicatif de cette note au sein de la séquence.' },
      { name: 'date', type: 'DATE', constraints: 'NOT NULL', description: 'Date de l\'évaluation.' },
      { name: 'status', type: 'VARCHAR(30)', constraints: 'NOT NULL DEFAULT \'DRAFT\' CHECK (status IN (\'DRAFT\', \'PENDING_VALIDATION\', \'VALIDATED\'))', description: 'Workflow : Brouillon, En attente de validation par le censeur, Validé et verrouillé.' },
      { name: 'title', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'Intitulé de l\'évaluation (ex: "Composition de mathématiques").' }
    ],
    relations: [
      'Many-to-One avec `classes`, `subjects`, et `teachers`.',
      'One-to-Many avec `marks`.'
    ],
    ddl: `CREATE TABLE evaluations (
  id VARCHAR(50) PRIMARY KEY,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  teacher_id VARCHAR(50) REFERENCES teachers(id) ON DELETE SET NULL,
  sequence_id INT NOT NULL CHECK (sequence_id BETWEEN 1 AND 6),
  term_id INT NOT NULL CHECK (term_id BETWEEN 1 AND 3),
  type VARCHAR(20) NOT NULL CHECK (type IN ('CONTROLE', 'DEVOIR', 'EXAMEN')),
  coefficient INT NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VALIDATION', 'VALIDATED')),
  title VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    tableName: 'marks',
    description: 'Enregistre les notes obtenues par chaque élève pour une évaluation donnée.',
    fields: [
      { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'ID unique de la note.' },
      { name: 'evaluation_id', type: 'VARCHAR(50)', constraints: 'NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE', description: 'Référence à l\'évaluation.' },
      { name: 'student_id', type: 'VARCHAR(50)', constraints: 'NOT NULL REFERENCES students(id) ON DELETE CASCADE', description: 'Référence à l\'élève.' },
      { name: 'value', type: 'NUMERIC(4,2)', constraints: 'NOT NULL CHECK (value BETWEEN 0 AND 20)', description: 'Note attribuée (notée sur 20, standard du Cameroun).' },
      { name: 'comment', type: 'VARCHAR(255)', constraints: 'NULL', description: 'Remarque de l\'enseignant.' }
    ],
    relations: [
      'Many-to-One avec `evaluations`.',
      'Many-to-One avec `students`.'
    ],
    ddl: `CREATE TABLE marks (
  id VARCHAR(50) PRIMARY KEY,
  evaluation_id VARCHAR(50) NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  value NUMERIC(4,2) NOT NULL CHECK (value BETWEEN 0 AND 20),
  comment VARCHAR(255),
  UNIQUE (evaluation_id, student_id)
);`
  }
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  // PRÉSENCES
  {
    method: 'GET',
    path: '/api/presence/sheets',
    description: 'Récupère la liste des feuilles de présence avec filtres optionnels par classe, enseignant, ou période.',
    category: 'Présences',
    queryParams: [
      { name: 'classId', type: 'String', required: false, description: 'Filtrer par classe' },
      { name: 'date', type: 'String', required: false, description: 'Filtrer sur une date précise (YYYY-MM-DD)' },
      { name: 'sequenceId', type: 'Integer', required: false, description: 'Filtrer par séquence (1 à 6)' }
    ],
    responseExample: `[
  {
    "id": "ash-1",
    "classId": "class-tc",
    "className": "Terminale C",
    "subjectName": "Mathématiques",
    "teacherName": "M. Jean-Marc Kamga",
    "date": "2026-06-29",
    "timeSlot": "08:00 - 10:00",
    "sequenceId": 5,
    "presentCount": 10,
    "absentCount": 2,
    "lateCount": 0
  }
]`
  },
  {
    method: 'POST',
    path: '/api/presence/sheets',
    description: 'Crée une nouvelle feuille d\'appel de présence pour un cours, et initialise l\'état d\'appel.',
    category: 'Présences',
    requestBody: `{
  "classId": "class-tc",
  "subjectId": "subj-math",
  "teacherId": "teach-1",
  "date": "2026-07-03",
  "timeSlot": "08:00 - 10:00",
  "sequenceId": 5
}`,
    responseExample: `{
  "success": true,
  "message": "Feuille de présence créée avec succès",
  "data": {
    "id": "ash-7",
    "classId": "class-tc",
    "subjectId": "subj-math",
    "teacherId": "teach-1",
    "date": "2026-07-03",
    "timeSlot": "08:00 - 10:00",
    "sequenceId": 5
  }
}`
  },
  {
    method: 'GET',
    path: '/api/presence/sheets/:sheetId/records',
    description: 'Récupère le listing d\'appel des élèves pour une feuille de présence spécifique.',
    category: 'Présences',
    responseExample: `[
  {
    "id": "ar-1-1",
    "studentId": "stud-tc-1",
    "studentName": "Samuel Eto'o Fils",
    "gender": "M",
    "status": "PRESENT",
    "reason": "",
    "comment": ""
  },
  {
    "id": "ar-1-3",
    "studentId": "stud-tc-3",
    "studentName": "Marc-Aurèle Abena",
    "gender": "M",
    "status": "ABSENT",
    "reason": "MALADIE",
    "comment": "Certificat médical reçu"
  }
]`
  },
  {
    method: 'PUT',
    path: '/api/presence/records',
    description: 'Enregistre ou modifie l\'état de présence et motif de plusieurs élèves en une seule requête (Batch update).',
    category: 'Présences',
    requestBody: `{
  "sheetId": "ash-1",
  "records": [
    {
      "studentId": "stud-tc-1",
      "status": "PRESENT",
      "reason": "",
      "comment": ""
    },
    {
      "studentId": "stud-tc-3",
      "status": "ABSENT",
      "reason": "MALADIE",
      "comment": "Reste au lit"
    }
  ]
}`,
    responseExample: `{
  "success": true,
  "message": "12 appels enregistrés avec succès",
  "updatedRecordsCount": 12
}`
  },
  {
    method: 'GET',
    path: '/api/presence/statistics/classes',
    description: 'Calcule les taux de présence et d\'absentéisme agrégés par classe.',
    category: 'Présences',
    responseExample: `[
  {
    "classId": "class-tc",
    "className": "Terminale C",
    "totalSessions": 4,
    "attendanceRate": 89.58,
    "totalAbsences": 4,
    "totalLates": 1
  }
]`
  },

  // NOTES
  {
    method: 'GET',
    path: '/api/grades/evaluations',
    description: 'Liste les évaluations (devoirs, examens) selon les filtres de classe ou séquence.',
    category: 'Notes',
    queryParams: [
      { name: 'classId', type: 'String', required: false, description: 'Filtrer par classe' },
      { name: 'sequenceId', type: 'Integer', required: false, description: 'Séquence scolaire' }
    ],
    responseExample: `[
  {
    "id": "eval-tc-s5-math",
    "className": "Terminale C",
    "subjectName": "Mathématiques",
    "title": "Probabilités & Géométrie Espace",
    "type": "CONTROLE",
    "coefficient": 1,
    "sequenceId": 5,
    "status": "PENDING_VALIDATION",
    "date": "2026-05-18",
    "average": 13.92,
    "notesSaisies": 12,
    "notesTotales": 12
  }
]`
  },
  {
    method: 'POST',
    path: '/api/grades/evaluations',
    description: 'Crée une nouvelle fiche d\'évaluation vierge préréglée.',
    category: 'Notes',
    requestBody: `{
  "classId": "class-tc",
  "subjectId": "subj-math",
  "teacherId": "teach-1",
  "sequenceId": 5,
  "termId": 3,
  "type": "CONTROLE",
  "coefficient": 1,
  "date": "2026-07-03",
  "title": "Nouveau devoir"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "id": "eval-101",
    "classId": "class-tc",
    "subjectId": "subj-math",
    "title": "Nouveau devoir",
    "status": "DRAFT"
  }
}`
  },
  {
    method: 'GET',
    path: '/api/grades/evaluations/:evalId/marks',
    description: 'Récupère les notes de l\'évaluation pour tous les élèves de la classe.',
    category: 'Notes',
    responseExample: `[
  {
    "studentId": "stud-tc-1",
    "studentName": "Samuel Eto'o Fils",
    "value": 15.5,
    "comment": "Très bonne copie"
  },
  {
    "studentId": "stud-tc-2",
    "studentName": "Chloé Kamdem",
    "value": 16.0,
    "comment": "Excellente analyse"
  }
]`
  },
  {
    method: 'PUT',
    path: '/api/grades/evaluations/:evalId/marks',
    description: 'Saisie ou modification groupée des notes par l\'enseignant (uniquement si l\'évaluation est au statut DRAFT ou PENDING_VALIDATION).',
    category: 'Notes',
    requestBody: `{
  "marks": [
    { "studentId": "stud-tc-1", "value": 15.5, "comment": "" },
    { "studentId": "stud-tc-2", "value": 16.0, "comment": "" }
  ]
}`,
    responseExample: `{
  "success": true,
  "message": "Notes enregistrées avec succès"
}`
  },
  {
    method: 'PATCH',
    path: '/api/grades/evaluations/:evalId/status',
    description: 'Met à jour le statut de l\'évaluation dans le workflow de validation (DRAFT -> PENDING_VALIDATION -> VALIDATED). Le statut VALIDATED verrouille l\'évaluation.',
    category: 'Notes',
    requestBody: `{
  "status": "VALIDATED",
  "validatedBy": "censor-1"
}`,
    responseExample: `{
  "success": true,
  "newStatus": "VALIDATED",
  "message": "L'évaluation a été validée et verrouillée. Les modifications ne sont plus autorisées."
}`
  },
  {
    method: 'GET',
    path: '/api/bulletins/:classId/:sequenceId',
    description: 'Calcule l\'ensemble des moyennes et classements d\'une classe pour une séquence spécifique, préparant l\'affichage du bulletin.',
    category: 'Administration',
    responseExample: `{
  "classId": "class-tc",
  "className": "Terminale C",
  "sequenceId": 5,
  "classAverage": 13.56,
  "successRate": 91.6,
  "bestAverage": 17.52,
  "lowestAverage": 9.15,
  "bulletins": [
    {
      "studentId": "stud-tc-6",
      "studentName": "Jeanne d'Arc Ngo Mbe",
      "rank": 1,
      "generalAverage": 17.52,
      "totalCoefficients": 21,
      "decision": "Félicitations du Conseil de Classe",
      "subjectAverages": [
        { "subjectName": "Mathématiques", "average": 18.5, "coefficient": 6, "teacherName": "M. Jean-Marc Kamga" },
        { "subjectName": "Français (Lettres)", "average": 12.5, "coefficient": 2, "teacherName": "Mme Marie-Thérèse Abena" }
      ]
    }
  ]
}`
  }
];
