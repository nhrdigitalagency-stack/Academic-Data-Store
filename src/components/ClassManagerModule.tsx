/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Lock, 
  Download,
  School,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Upload,
  RefreshCw
} from 'lucide-react';
import { SchoolClass, Student, SchoolTenant, SchoolUserAccount } from '../types';
import { generateClassStudentsListPDF } from '../utils/pdfGenerator';
import { formatCycleLevel } from '../utils/cycleUtils';

interface ClassManagerModuleProps {
  classes: SchoolClass[];
  setClasses: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  activeSchool?: SchoolTenant;
  activeSchoolId?: string;
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
  onNavigateToGrades?: (classId: string) => void;
  userAccounts?: SchoolUserAccount[];
  setUserAccounts?: React.Dispatch<React.SetStateAction<SchoolUserAccount[]>>;
  onNavigateToTab?: (tab: string) => void;
  onBack?: () => void;
}

const COMMON_CLASS_PRESETS = [
  '6ème 1', '6ème 2', '6ème 3',
  '5ème 1', '5ème 2',
  '4ème 1', '4ème 2',
  '3ème 1', '3ème 2',
  '2nde C', '2nde L', '2nde S',
  '1ère D', '1ère C', '1ère A1',
  'Terminale C', 'Terminale D', 'Terminale A1'
];

export default function ClassManagerModule({
  classes,
  setClasses,
  students,
  setStudents,
  activeSchool,
  activeSchoolId = '',
  addAuditLog,
  onNavigateToGrades,
  userAccounts,
  setUserAccounts,
  onNavigateToTab,
  onBack
}: ClassManagerModuleProps) {
  const [activeTab, setActiveTab] = useState<'classes' | 'students'>('classes');
  
  // Filtered by current school
  const currentSchoolClasses = classes.filter(c => !activeSchoolId || !c.schoolId || c.schoolId === activeSchoolId);
  const currentSchoolStudents = students.filter(s => {
    if (s.schoolId && activeSchoolId) return s.schoolId === activeSchoolId;
    const c = classes.find(cl => cl.id === s.classId);
    return !activeSchoolId || !c?.schoolId || c.schoolId === activeSchoolId;
  });

  // Class management modal & state
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classLevelInput, setClassLevelInput] = useState('Premier Cycle (6e - 3e)');
  const [classStreamInput, setClassStreamInput] = useState('Général');

  // Student management modal & state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentClassId, setStudentClassId] = useState<string>(currentSchoolClasses[0]?.id || '');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentGender, setStudentGender] = useState<'M' | 'F'>('M');
  const [studentMatricule, setStudentMatricule] = useState('');
  const [studentParentName, setStudentParentName] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');
  const [studentParentPassword, setStudentParentPassword] = useState('1234');

  // Search & Filters
  const [selectedFilterClassId, setSelectedFilterClassId] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // CSV Bulk Import Modal & State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvTargetClassId, setCsvTargetClassId] = useState<string>(currentSchoolClasses[0]?.id || '');
  const [csvText, setCsvText] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Generate unique matricule helper
  const generateMatricule = (prefix = 'ASI') => {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = currentSchoolStudents.length + 1;
    const padded = count.toString().padStart(3, '0');
    return `${prefix}-${year}-${padded}`;
  };

  // User Accounts & System Synchronization State
  const [isSyncing, setIsSyncing] = useState(false);

  // Synchronize all school students and parents with SchoolUserAccounts system
  const handleSyncUserAccounts = () => {
    setIsSyncing(true);
    try {
      const existingAccounts = userAccounts || [];
      const newAccounts: SchoolUserAccount[] = [];
      const schoolId = activeSchoolId || activeSchool?.id || 'asi-gabon';

      currentSchoolStudents.forEach((student, idx) => {
        // 1. Check Student Account (role: ELEVE)
        const hasStudentAccount = existingAccounts.some(
          a => a.studentId === student.id || (student.matricule && a.username === student.matricule)
        );
        if (!hasStudentAccount) {
          const cleanFirst = student.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanLast = student.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
          newAccounts.push({
            id: `acc-stud-${student.id}`,
            schoolId,
            fullName: `${student.lastName.toUpperCase()} ${student.firstName}`,
            username: student.matricule || `eleve.${cleanLast}.${cleanFirst || idx}`,
            email: `${cleanLast}.${cleanFirst || idx}@eleve.${activeSchool?.id || 'asi'}.ga`,
            phone: student.parentPhone || '+241 07 00 00 00',
            role: 'ELEVE',
            studentId: student.id,
            assignedClasses: [student.classId],
            status: 'ACTIF',
            initialPassword: student.parentPassword || '1234',
            createdAt: new Date().toISOString()
          });
        }

        // 2. Check Parent Account (role: PARENT)
        const parentPhoneClean = (student.parentPhone || '').replace(/\s+/g, '');
        const hasParentAccount = existingAccounts.some(
          a => a.role === 'PARENT' && (
            (parentPhoneClean && a.phone.replace(/\s+/g, '') === parentPhoneClean) ||
            a.parentOfStudentIds?.includes(student.id)
          )
        );
        if (!hasParentAccount && student.parentPhone) {
          newAccounts.push({
            id: `acc-parent-${student.id}`,
            schoolId,
            fullName: student.parentName || `Parent de ${student.lastName}`,
            username: student.parentPhone.replace(/[^0-9+]/g, ''),
            email: `parent.${student.matricule?.toLowerCase() || student.id}@parent.ga`,
            phone: student.parentPhone,
            role: 'PARENT',
            parentOfStudentIds: [student.id],
            status: 'ACTIF',
            initialPassword: student.parentPassword || '1234',
            createdAt: new Date().toISOString()
          });
        }
      });

      if (newAccounts.length > 0 && setUserAccounts) {
        setUserAccounts(prev => [...prev, ...newAccounts]);
        addAuditLog?.(
          "Synchronisation Système",
          schoolId,
          `Synchronisation générale : ${newAccounts.length} comptes élèves/parents générés et synchronisés avec le système.`
        );
        showToast(`Synchronisation réussie : ${newAccounts.length} comptes utilisateurs créés et synchronisés !`, "success");
      } else {
        showToast("Le système est déjà 100% synchronisé : tous les élèves et parents disposent de comptes actifs.", "info");
      }
    } catch (e: any) {
      showToast(`Erreur lors de la synchronisation : ${e?.message || e}`, "error");
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Handle Bulk CSV Import
  const handleBulkCsvImport = () => {
    if (!csvText.trim()) {
      showToast("Veuillez saisir ou coller du contenu CSV.", "error");
      return;
    }
    const targetClass = currentSchoolClasses.find(c => c.id === csvTargetClassId);
    if (!targetClass) {
      showToast("Veuillez d'abord créer ou sélectionner une classe de destination.", "error");
      return;
    }

    setIsImportingCsv(true);
    try {
      const lines = csvText.trim().split(/\r?\n/);
      const newStudentsList: Student[] = [];
      const newAccountsList: SchoolUserAccount[] = [];
      const schoolId = activeSchoolId || activeSchool?.id || 'asi-gabon';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (i === 0 && (line.toLowerCase().includes('nom') || line.toLowerCase().includes('prénom') || line.toLowerCase().includes('matricule'))) {
          continue;
        }

        const delimiter = line.includes(';') ? ';' : ',';
        const parts = line.split(delimiter).map(p => p.trim());
        if (parts.length < 2) continue;

        const lastName = parts[0] || '';
        const firstName = parts[1] || '';
        if (!lastName || !firstName) continue;

        const gender = (parts[2]?.toUpperCase() === 'F' ? 'F' : 'M') as 'M' | 'F';
        const parentPhone = parts[3] || '+241 07 00 00 00';
        const parentName = parts[4] || `Parent de ${firstName} ${lastName}`;
        const matricule = parts[5] || `${activeSchool?.name.slice(0, 3).toUpperCase() || 'ASI'}-${new Date().getFullYear().toString().slice(-2)}-${(currentSchoolStudents.length + newStudentsList.length + 1).toString().padStart(3, '0')}`;
        const pwd = Math.floor(1000 + Math.random() * 9000).toString();
        const studentId = `stud-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

        const newStud: Student = {
          id: studentId,
          matricule,
          classId: targetClass.id,
          lastName: lastName.toUpperCase(),
          firstName,
          gender,
          parentName,
          parentPhone,
          parentPassword: pwd,
          schoolId,
          status: 'Actif'
        };

        newStudentsList.push(newStud);

        // Auto-generate student user account
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
        newAccountsList.push({
          id: `acc-stud-${studentId}`,
          schoolId,
          fullName: `${lastName.toUpperCase()} ${firstName}`,
          username: matricule,
          email: `${cleanLast}.${cleanFirst}@eleve.${activeSchool?.id || 'asi'}.ga`,
          phone: parentPhone,
          role: 'ELEVE',
          studentId,
          assignedClasses: [targetClass.id],
          status: 'ACTIF',
          initialPassword: pwd,
          createdAt: new Date().toISOString()
        });

        // Auto-generate parent user account
        newAccountsList.push({
          id: `acc-parent-${studentId}`,
          schoolId,
          fullName: parentName,
          username: parentPhone.replace(/[^0-9+]/g, ''),
          email: `parent.${matricule.toLowerCase()}@parent.ga`,
          phone: parentPhone,
          role: 'PARENT',
          parentOfStudentIds: [studentId],
          status: 'ACTIF',
          initialPassword: pwd,
          createdAt: new Date().toISOString()
        });
      }

      if (newStudentsList.length === 0) {
        showToast("Aucun élève valide trouvé dans les données fournies.", "error");
        setIsImportingCsv(false);
        return;
      }

      setStudents(prev => [...prev, ...newStudentsList]);
      if (setUserAccounts && newAccountsList.length > 0) {
        setUserAccounts(prev => [...prev, ...newAccountsList]);
      }
      setClasses(prev => prev.map(c => {
        if (c.id === targetClass.id) {
          return { ...c, studentCount: (c.studentCount || 0) + newStudentsList.length };
        }
        return c;
      }));

      addAuditLog?.(
        "Importation massive CSV",
        activeSchoolId,
        `Importation de ${newStudentsList.length} élève(s) dans la classe "${targetClass.name}" avec génération automatique des comptes utilisateurs.`
      );

      showToast(`${newStudentsList.length} élève(s) et comptes synchronisés avec succès dans ${targetClass.name} !`, "success");
      setCsvText('');
      setShowCsvModal(false);
    } catch (err: any) {
      showToast(`Erreur d'importation : ${err?.message || err}`, "error");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setCsvText(content);
    };
    reader.readAsText(file);
  };

  // Handle open add student
  const handleOpenAddStudent = (preselectedClassId?: string) => {
    if (currentSchoolClasses.length === 0) {
      showToast("Veuillez d'abord créer au moins une classe (ex: 6ème 1) avant d'ajouter des élèves !", "error");
      setShowAddClassModal(true);
      return;
    }
    setEditingStudentId(null);
    setStudentClassId(preselectedClassId || currentSchoolClasses[0]?.id || '');
    setStudentLastName('');
    setStudentFirstName('');
    setStudentGender('M');
    setStudentMatricule(generateMatricule(activeSchool?.name.slice(0, 3).toUpperCase() || 'ASI'));
    setStudentParentName('');
    setStudentParentPhone('');
    setStudentParentPassword(Math.floor(1000 + Math.random() * 9000).toString());
    setShowAddStudentModal(true);
  };

  // Handle Save / Create Class
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      showToast("Veuillez renseigner le nom de la classe.", "error");
      return;
    }

    const cleanName = classNameInput.trim();

    if (editingClassId) {
      // Edit
      setClasses(prev => prev.map(c => {
        if (c.id === editingClassId) {
          return {
            ...c,
            name: cleanName,
            level: classLevelInput,
            stream: classStreamInput
          };
        }
        return c;
      }));
      addAuditLog?.("Modification de classe", activeSchoolId, `Modification de la classe "${cleanName}".`);
      showToast(`Classe "${cleanName}" modifiée avec succès.`, "success");
    } else {
      // Create new
      const newClassId = `class-${Date.now()}`;
      const newClass: SchoolClass = {
        id: newClassId,
        name: cleanName,
        level: classLevelInput,
        stream: classStreamInput,
        studentCount: 0,
        schoolId: activeSchoolId || activeSchool?.id
      };
      setClasses(prev => [...prev, newClass]);
      addAuditLog?.("Création de classe", activeSchoolId, `Création de la classe "${cleanName}" (${classLevelInput}).`);
      showToast(`Classe "${cleanName}" créée avec succès ! Vous pouvez maintenant y inscrire des élèves.`, "success");
      setStudentClassId(newClassId);
    }

    setShowAddClassModal(false);
    setEditingClassId(null);
    setClassNameInput('');
  };

  // Handle Delete Class
  const handleDeleteClass = (cls: SchoolClass) => {
    const classStudentCount = students.filter(s => s.classId === cls.id).length;
    if (classStudentCount > 0) {
      if (!confirm(`Attention : La classe "${cls.name}" contient ${classStudentCount} élève(s). Supprimer cette classe détachera ces élèves. Confirmer la suppression ?`)) {
        return;
      }
    } else {
      if (!confirm(`Voulez-vous vraiment supprimer la classe "${cls.name}" ?`)) {
        return;
      }
    }

    setClasses(prev => prev.filter(c => c.id !== cls.id));
    addAuditLog?.("Suppression de classe", activeSchoolId, `Suppression de la classe "${cls.name}".`);
    showToast(`Classe "${cls.name}" supprimée.`, "info");
  };

  // Handle Save / Create Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentLastName.trim() || !studentFirstName.trim()) {
      showToast("Veuillez renseigner le nom et le prénom de l'élève.", "error");
      return;
    }
    if (!studentClassId) {
      showToast("Veuillez sélectionner la classe de l'élève.", "error");
      return;
    }
    if (!studentParentPhone.trim()) {
      showToast("Veuillez indiquer le numéro de téléphone du parent (utilisé pour sa connexion).", "error");
      return;
    }

    const assignedClass = classes.find(c => c.id === studentClassId);
    const className = assignedClass?.name || 'Classe';

    if (editingStudentId) {
      // Edit student
      setStudents(prev => prev.map(s => {
        if (s.id === editingStudentId) {
          return {
            ...s,
            classId: studentClassId,
            lastName: studentLastName.trim(),
            firstName: studentFirstName.trim(),
            gender: studentGender,
            matricule: studentMatricule.trim() || s.matricule,
            parentName: studentParentName.trim() || 'Parent',
            parentPhone: studentParentPhone.trim(),
            parentPassword: studentParentPassword.trim() || s.parentPassword || '1234',
            schoolId: activeSchoolId || s.schoolId
          };
        }
        return s;
      }));
      showToast(`Élève ${studentLastName.toUpperCase()} ${studentFirstName} mis à jour.`, "success");
    } else {
      // Create new student
      const newStudentId = `stud-${Date.now()}`;
      const newStudent: Student = {
        id: newStudentId,
        matricule: studentMatricule.trim() || generateMatricule(),
        classId: studentClassId,
        lastName: studentLastName.trim(),
        firstName: studentFirstName.trim(),
        gender: studentGender,
        parentName: studentParentName.trim() || 'Parent d\'élève',
        parentPhone: studentParentPhone.trim(),
        parentPassword: studentParentPassword.trim() || '1234',
        schoolId: activeSchoolId || activeSchool?.id,
        status: 'Actif'
      };

      setStudents(prev => [...prev, newStudent]);
      
      // Auto-generate User Accounts for Student and Parent
      if (setUserAccounts) {
        const schoolId = activeSchoolId || activeSchool?.id || 'asi-gabon';
        const cleanFirst = studentFirstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanLast = studentLastName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newStudentAccount: SchoolUserAccount = {
          id: `acc-stud-${newStudentId}`,
          schoolId,
          fullName: `${studentLastName.toUpperCase()} ${studentFirstName.trim()}`,
          username: newStudent.matricule || `eleve.${cleanLast}.${cleanFirst}`,
          email: `${cleanLast}.${cleanFirst}@eleve.${activeSchool?.id || 'asi'}.ga`,
          phone: studentParentPhone.trim(),
          role: 'ELEVE',
          studentId: newStudentId,
          assignedClasses: [studentClassId],
          status: 'ACTIF',
          initialPassword: studentParentPassword.trim() || '1234',
          createdAt: new Date().toISOString()
        };
        const newParentAccount: SchoolUserAccount = {
          id: `acc-parent-${newStudentId}`,
          schoolId,
          fullName: studentParentName.trim() || `Parent de ${studentLastName}`,
          username: studentParentPhone.replace(/[^0-9+]/g, ''),
          email: `parent.${newStudent.matricule?.toLowerCase() || newStudentId}@parent.ga`,
          phone: studentParentPhone.trim(),
          role: 'PARENT',
          parentOfStudentIds: [newStudentId],
          status: 'ACTIF',
          initialPassword: studentParentPassword.trim() || '1234',
          createdAt: new Date().toISOString()
        };
        setUserAccounts(prev => [...prev, newStudentAccount, newParentAccount]);
      }

      // Update class count
      setClasses(prev => prev.map(c => {
        if (c.id === studentClassId) {
          return { ...c, studentCount: (c.studentCount || 0) + 1 };
        }
        return c;
      }));

      addAuditLog?.(
        "Inscription élève", 
        activeSchoolId, 
        `Inscription de l'élève ${studentLastName.toUpperCase()} ${studentFirstName} dans la classe ${className} avec synchronisation des accès utilisateur.`
      );
      showToast(`L'élève ${studentLastName.toUpperCase()} a été inscrit avec succès dans la classe ${className} !`, "success");
    }

    setShowAddStudentModal(false);
    setEditingStudentId(null);
    setStudentLastName('');
    setStudentFirstName('');
    setStudentParentName('');
    setStudentParentPhone('');
  };

  // Handle Delete Student
  const handleDeleteStudent = (stud: Student) => {
    if (!confirm(`Supprimer définitivement l'élève ${stud.lastName.toUpperCase()} ${stud.firstName} ?`)) {
      return;
    }
    setStudents(prev => prev.filter(s => s.id !== stud.id));
    if (setUserAccounts) {
      setUserAccounts(prev => prev.filter(a => a.studentId !== stud.id && !a.parentOfStudentIds?.includes(stud.id)));
    }
    setClasses(prev => prev.map(c => {
      if (c.id === stud.classId) {
        return { ...c, studentCount: Math.max(0, (c.studentCount || 1) - 1) };
      }
      return c;
    }));
    addAuditLog?.("Suppression élève", activeSchoolId, `Suppression de l'élève ${stud.lastName.toUpperCase()} ${stud.firstName} et révocation des accès associés.`);
    showToast(`Élève retiré du système.`, "info");
  };

  // Filtered students
  const filteredStudents = currentSchoolStudents.filter(s => {
    const matchesClass = selectedFilterClassId === 'all' || s.classId === selectedFilterClassId;
    const q = studentSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      s.lastName.toLowerCase().includes(q) || 
      s.firstName.toLowerCase().includes(q) || 
      (s.matricule && s.matricule.toLowerCase().includes(q)) ||
      (s.parentPhone && s.parentPhone.includes(q));
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6" id="class-manager-module">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
                title="Retour à la page précédente"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                Gestion des Classes & Inscription des Élèves
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {activeSchool?.name || 'Établissement'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Créez vos classes (Premier Cycle : 6e à 3e, Second Cycle : 2nde à Tle), enregistrez vos élèves et configurez l'accès parents par téléphone.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-create-class-header"
            onClick={() => {
              setEditingClassId(null);
              setClassNameInput('');
              setShowAddClassModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-md ring-2 ring-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            <span>+ Créer une Classe</span>
          </button>
          <button
            id="btn-add-student-header"
            onClick={() => handleOpenAddStudent()}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Inscrire un Élève</span>
          </button>
          <button
            id="btn-import-csv-header"
            onClick={() => {
              if (currentSchoolClasses.length === 0) {
                showToast("Veuillez d'abord créer une classe avant d'importer des élèves.", "error");
                setShowAddClassModal(true);
                return;
              }
              setCsvTargetClassId(currentSchoolClasses[0]?.id || '');
              setShowCsvModal(true);
            }}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Import CSV / Excel</span>
          </button>
          <button
            id="btn-sync-system-header"
            onClick={handleSyncUserAccounts}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
            title="Synchroniser automatiquement tous les élèves et parents avec le système de comptes utilisateurs"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser Système'}</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-3">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <School className="h-4 w-4" />
            <span>Classes ({currentSchoolClasses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Élèves Inscrits ({currentSchoolStudents.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-4 px-3 text-xs text-slate-500">
          <span>Classes : <strong className="text-slate-900">{currentSchoolClasses.length}</strong></span>
          <span>Élèves : <strong className="text-slate-900">{currentSchoolStudents.length}</strong></span>
        </div>
      </div>

      {/* VIEW 1: CLASSES LIST & CARDS */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Classes Tab Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200/80 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-2.5 text-xs text-slate-700">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <School className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-sm">
                  {currentSchoolClasses.length} classe(s) active(s)
                </span>
                <span className="text-slate-500 text-[11px]">
                  {currentSchoolStudents.length} élève(s) au total dans l'établissement
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-create-class-toolbar"
                onClick={() => {
                  setEditingClassId(null);
                  setClassNameInput('');
                  setShowAddClassModal(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>+ Créer une Classe</span>
              </button>

              <button
                onClick={() => handleOpenAddStudent()}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Inscrire un Élève</span>
              </button>

              <button
                onClick={handleSyncUserAccounts}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                title="Synchroniser tous les comptes utilisateurs avec les classes et élèves"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                <span>Synchroniser Système</span>
              </button>
            </div>
          </div>

          {currentSchoolClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <School className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">Aucune classe créée pour l'instant</h3>
                <p className="text-xs text-slate-500">
                  Comme expliqué, commencez par créer les classes de votre établissement (ex: 6ème 1, 5ème 1, 4ème...). Vous pourrez ensuite y ajouter directement les élèves.
                </p>
              </div>
              <button
                id="btn-create-first-class"
                onClick={() => {
                  setEditingClassId(null);
                  setClassNameInput('');
                  setShowAddClassModal(true);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" />
                <span>+ Créer une Classe maintenant</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Interactive Add Class Card */}
              <button
                id="card-create-class"
                onClick={() => {
                  setEditingClassId(null);
                  setClassNameInput('');
                  setShowAddClassModal(true);
                }}
                className="min-h-[220px] rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/80 p-6 flex flex-col items-center justify-center text-center space-y-3 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700 block">
                    + Créer une Classe
                  </span>
                  <span className="text-xs text-blue-600/80">
                    Ajouter une division pédagogique (Premier ou Second Cycle...)
                  </span>
                </div>
              </button>

              {currentSchoolClasses.map((cls) => {
                const classStudents = students.filter(s => s.classId === cls.id);
                return (
                  <div 
                    key={cls.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {formatCycleLevel(cls.level)}
                          </span>
                          <h3 className="text-lg font-display font-black text-slate-900 mt-1.5">
                            {cls.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            title="Modifier"
                            onClick={() => {
                              setEditingClassId(cls.id);
                              setClassNameInput(cls.name);
                              setClassLevelInput(formatCycleLevel(cls.level));
                              setClassStreamInput(cls.stream || 'Général');
                              setShowAddClassModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Enrolled Students Badge */}
                      <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">
                            {classStudents.length} élève(s) inscrit(s)
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {cls.stream || 'Section standard'}
                        </span>
                      </div>
                    </div>

                    {/* Class Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenAddStudent(cls.id)}
                          className="flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>+ Ajouter élève</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFilterClassId(cls.id);
                            setActiveTab('students');
                          }}
                          className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Voir la liste</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (activeSchool) {
                              generateClassStudentsListPDF(activeSchool, cls.name, classStudents);
                              showToast(`Liste PDF de la classe ${cls.name} générée avec succès !`, "success");
                            }
                          }}
                          disabled={classStudents.length === 0}
                          className={`flex items-center justify-center space-x-1.5 text-xs font-semibold py-1.5 px-3 rounded-xl border transition-colors ${
                            classStudents.length === 0 
                              ? 'text-slate-300 border-slate-100 cursor-not-allowed' 
                              : 'text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF Élèves</span>
                        </button>

                        <button
                          onClick={() => onNavigateToGrades?.(cls.id)}
                          className="flex items-center justify-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Notes & Rang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: STUDENTS ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher élève, matricule, parent..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedFilterClassId}
                onChange={(e) => setSelectedFilterClassId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Toutes les classes ({currentSchoolStudents.length})</option>
                {currentSchoolClasses.map((c) => {
                  const count = students.filter(s => s.classId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count} élèves)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (activeSchool && filteredStudents.length > 0) {
                    const currentClsName = selectedFilterClassId === 'all' 
                      ? 'Tous_les_eleves' 
                      : (classes.find(c => c.id === selectedFilterClassId)?.name || 'Classe');
                    generateClassStudentsListPDF(activeSchool, currentClsName, filteredStudents);
                    showToast("Liste PDF générée avec succès !", "success");
                  }
                }}
                disabled={filteredStudents.length === 0}
                className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Télécharger la liste (PDF)</span>
              </button>

              <button
                id="btn-create-class-students-tab"
                onClick={() => {
                  setEditingClassId(null);
                  setClassNameInput('');
                  setShowAddClassModal(true);
                }}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>+ Créer une Classe</span>
              </button>

              <button
                onClick={() => handleOpenAddStudent(selectedFilterClassId !== 'all' ? selectedFilterClassId : undefined)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Inscrire un Élève</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Matricule & Élève</th>
                    <th className="px-5 py-3.5">Classe</th>
                    <th className="px-5 py-3.5">Sexe</th>
                    <th className="px-5 py-3.5">Parent / Tuteur</th>
                    <th className="px-5 py-3.5">Tél. Parent (Connexion)</th>
                    <th className="px-5 py-3.5">Mot de Passe Parent</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        Aucun élève trouvé dans cette sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stud) => {
                      const studentClass = classes.find(c => c.id === stud.classId);
                      return (
                        <tr key={stud.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                stud.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {stud.lastName.charAt(0)}{stud.firstName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {stud.lastName.toUpperCase()} {stud.firstName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Matricule : {stud.matricule || stud.id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {studentClass?.name || 'Classe non assignée'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold">
                            {stud.gender === 'F' ? 'Féminin' : 'Masculin'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-800">{stud.parentName || '-'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-1.5 text-emerald-700 font-bold font-mono">
                              <Phone className="h-3 w-3" />
                              <span>{stud.parentPhone || '-'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center space-x-1 text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded-lg w-max">
                              <Lock className="h-3 w-3 text-slate-400" />
                              <span className="font-bold">{stud.parentPassword || '1234'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                title="Modifier"
                                onClick={() => {
                                  setEditingStudentId(stud.id);
                                  setStudentClassId(stud.classId);
                                  setStudentLastName(stud.lastName);
                                  setStudentFirstName(stud.firstName);
                                  setStudentGender(stud.gender);
                                  setStudentMatricule(stud.matricule || '');
                                  setStudentParentName(stud.parentName);
                                  setStudentParentPhone(stud.parentPhone);
                                  setStudentParentPassword(stud.parentPassword || '1234');
                                  setShowAddStudentModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                title="Supprimer"
                                onClick={() => handleDeleteStudent(stud)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <School className="h-5 w-5" />
                </div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  {editingClassId ? 'Modifier la Classe' : 'Créer une Nouvelle Classe'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom de la classe *</label>
                <input
                  type="text"
                  placeholder="Ex: 6ème 1, 5ème A, Terminale C..."
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggestions rapides en 1 clic :
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {COMMON_CLASS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setClassNameInput(preset)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        classNameInput === preset 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Cycle / Niveau</label>
                  <select
                    value={classLevelInput}
                    onChange={(e) => setClassLevelInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none font-medium"
                  >
                    <option value="Premier Cycle (6e - 3e)">Premier Cycle (6e - 3e)</option>
                    <option value="Second Cycle (2nde - Tle)">Second Cycle (2nde - Tle)</option>
                    <option value="Primaire">Primaire</option>
                    <option value="Technique / Professionnel">Technique / Professionnel</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Filière / Série</label>
                  <input
                    type="text"
                    placeholder="Ex: Scientifique, Général"
                    value={classStreamInput}
                    onChange={(e) => setClassStreamInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  {editingClassId ? 'Enregistrer les modifications' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSCRIRE / MODIFIER UN ÉLÈVE */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  {editingStudentId ? 'Modifier l\'Élève' : 'Inscrire un Élève dans la Classe'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Classe de rattachement */}
              <div className="space-y-1.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5" />
                  Classe de rattachement *
                </label>
                <select
                  value={studentClassId}
                  onChange={(e) => setStudentClassId(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  required
                >
                  {currentSchoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatCycleLevel(c.level)})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-blue-700 block">
                  L'élève sera automatiquement intégré à cette classe et disponible pour la saisie des notes.
                </span>
              </div>

              {/* Nom & Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nom de famille *</label>
                  <input
                    type="text"
                    placeholder="Ex: ONDO, MOUSSAVOU"
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Prénom(s) *</label>
                  <input
                    type="text"
                    placeholder="Ex: Paul Kevin"
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Sexe & Matricule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sexe</label>
                  <select
                    value={studentGender}
                    onChange={(e) => setStudentGender(e.target.value as 'M' | 'F')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Matricule scolaire</label>
                  <input
                    type="text"
                    placeholder="Ex: ASI-26-001"
                    value={studentMatricule}
                    onChange={(e) => setStudentMatricule(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Accès Parents par Téléphone & Mot de Passe (audio 1 requirement) */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>Accès Portail Parent (Identifiant Téléphone & Code)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nom du Parent / Tuteur</label>
                  <input
                    type="text"
                    placeholder="Ex: M. ONDO Pierre"
                    value={studentParentName}
                    onChange={(e) => setStudentParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      N° Téléphone Parent (Identifiant) *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 077 12 34 56"
                      value={studentParentPhone}
                      onChange={(e) => setStudentParentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Sert d'identifiant de connexion pour le parent.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mot de passe donné au parent *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1234 ou code secret"
                      value={studentParentPassword}
                      onChange={(e) => setStudentParentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-400">Code secret fourni par l'école.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                >
                  {editingStudentId ? 'Enregistrer les modifications' : 'Inscrire l\'élève'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT MASSIF CSV / EXCEL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900">
                    Importation Massive d'Élèves (CSV / Excel)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Injectez facilement une liste complète d'élèves pour une classe.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCsvModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Target Class Selection */}
              <div className="space-y-1.5 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5" />
                  Classe de destination *
                </label>
                <select
                  value={csvTargetClassId}
                  onChange={(e) => setCsvTargetClassId(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {currentSchoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatCycleLevel(c.level)})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-blue-700 block">
                  Tous les élèves importés ci-dessous seront rattachés à cette classe.
                </span>
              </div>

              {/* Format description & Sample button */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Format des colonnes :</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
`Nom, Prénom, Sexe, Téléphone_Parent, Nom_Parent
ONDO, Emmanuel Kevin, M, +241 07 12 34 56, M. ONDO Jean
MOUSSAVOU, Sarah Leslie, F, +241 06 98 76 54, Mme MOUSSAVOU Alice
MBOUMBA, Christian, M, +241 07 45 67 89, M. MBOUMBA Pierre`
                      );
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer text-[11px]"
                  >
                    Coller un exemple
                  </button>
                </div>
                <code className="block bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-600 font-mono">
                  Nom, Prénom, Sexe (M/F), Tél_Parent, Nom_Parent
                </code>
              </div>

              {/* File upload input */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-slate-300">
                  <Upload className="h-3.5 w-3.5 text-slate-600" />
                  <span>Charger un fichier .csv</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">ou collez directement le texte ci-dessous :</span>
              </div>

              {/* CSV Textarea */}
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="ONDO, Emmanuel, M, +241 07 12 34 56, M. ONDO&#10;MOUSSAVOU, Sarah, F, +241 06 98 76 54, Mme MOUSSAVOU..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Action buttons */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleBulkCsvImport}
                  disabled={isImportingCsv || !csvText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{isImportingCsv ? 'Importation en cours...' : 'Valider l\'importation'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
