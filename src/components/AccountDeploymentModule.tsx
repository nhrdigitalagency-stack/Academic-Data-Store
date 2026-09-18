/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Download,
  UploadCloud,
  QrCode,
  Printer,
  CheckCircle,
  FileSpreadsheet,
  Key,
  Mail,
  Phone,
  Search,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  CheckSquare,
  Edit2,
  Trash2,
  Power,
  ArrowLeft
} from 'lucide-react';
import { SchoolTenant, SchoolUserAccount, SchoolClass, Subject, Student, OnboardingStep, Teacher } from '../types';

interface AccountDeploymentModuleProps {
  activeSchool?: SchoolTenant;
  accounts: SchoolUserAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<SchoolUserAccount[]>>;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  addAuditLog: (action: string, schoolId: string, details: string) => void;
  onboardingSteps?: OnboardingStep[];
  setOnboardingSteps?: React.Dispatch<React.SetStateAction<OnboardingStep[]>>;
  teachers?: Teacher[];
  onNavigateToTab?: (tab: string) => void;
  onBack?: () => void;
}

export default function AccountDeploymentModule({
  activeSchool,
  accounts,
  setAccounts,
  classes,
  subjects,
  students,
  setStudents,
  addAuditLog,
  onboardingSteps: externalSteps,
  setOnboardingSteps: setExternalSteps,
  teachers,
  onNavigateToTab,
  onBack
}: AccountDeploymentModuleProps) {
  // Navigation Tabs: 'checklist' | 'admin_staff' | 'teachers' | 'students' | 'cards' | 'import'
  const [activeTab, setActiveTab] = useState<'checklist' | 'admin_staff' | 'teachers' | 'students' | 'cards' | 'import'>('checklist');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for New Account
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+237 6');
  const [newRole, setNewRole] = useState<SchoolUserAccount['role']>('ENSEIGNANT');
  const [newPassword, setNewPassword] = useState(`Pass${Math.floor(1000 + Math.random() * 9000)}!`);
  const [newAssignedClasses, setNewAssignedClasses] = useState<string[]>([classes[0]?.id || 'class-tc']);
  const [newAssignedSubjects, setNewAssignedSubjects] = useState<string[]>([subjects[0]?.id || 'subj-math']);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [formErrors, setFormErrors] = useState<{ fullName?: string; username?: string; password?: string }>({});

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{ count: number; message: string; errors?: string[] } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Edit Account State
  const [editingAccount, setEditingAccount] = useState<SchoolUserAccount | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<SchoolUserAccount['role']>('ENSEIGNANT');
  const [editStatus, setEditStatus] = useState<'ACTIF' | 'SUSPENDU'>('ACTIF');
  const [editInitialPassword, setEditInitialPassword] = useState('');
  const [editAssignedClasses, setEditAssignedClasses] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Onboarding Step definition with live calculation
  const [onboardingSteps, setOnboardingSteps] = useState([
    {
      id: 'step-1',
      title: 'Configuration de l’Établissement & Année Scolaire',
      description: 'Définition des paramètres officiels MINESEC, logo, contacts et trimestres.',
      category: 'Paramètres',
      completed: true,
      completedAt: '2025-08-20',
      actionTab: 'settings'
    },
    {
      id: 'step-2',
      title: 'Création des Classes et Attribution des Matières',
      description: 'Structuration des filières (Francophone / Anglophone) et des coefficients officiels.',
      category: 'Pédagogie',
      completed: classes.length > 0,
      completedAt: '2025-08-22',
      actionTab: 'classes'
    },
    {
      id: 'step-3',
      title: 'Déploiement des Comptes Enseignants',
      description: 'Création des accès pour le corps professoral avec assignation de leurs matières respectives.',
      category: 'Comptes',
      completed: accounts.filter(a => a.role === 'ENSEIGNANT').length >= 3,
      completedAt: accounts.filter(a => a.role === 'ENSEIGNANT').length >= 3 ? '2025-08-25' : undefined,
      actionTab: 'teachers'
    },
    {
      id: 'step-4',
      title: 'Importation des Effectifs Élèves & Parents',
      description: 'Enregistrement de la liste des élèves par classe via l\'assistant d\'importation CSV.',
      category: 'Élèves',
      completed: students.length >= 5,
      completedAt: students.length >= 5 ? '2025-08-27' : undefined,
      actionTab: 'students'
    },
    {
      id: 'step-5',
      title: 'Génération & Impression des Fiches de Connexion QR Code',
      description: 'Distribution des identifiants sécurisés aux parents d\'élèves lors de la rentrée scolaire.',
      category: 'Déploiement',
      completed: false,
      actionTab: 'cards'
    },
    {
      id: 'step-6',
      title: 'Ouverture du Portail Public & Pré-inscriptions',
      description: 'Lancement du site vitrine de l\'école avec formulaire de candidature en ligne.',
      category: 'Public',
      completed: false,
      actionTab: 'public_portal'
    }
  ]);

  const completedStepsCount = onboardingSteps.filter(s => s.completed).length;
  const onboardingPercentage = Math.round((completedStepsCount / onboardingSteps.length) * 100);

  // Toggle step completion manually
  const handleToggleStep = (stepId: string) => {
    setOnboardingSteps(prev =>
      prev.map(step => {
        if (step.id === stepId) {
          const nextVal = !step.completed;
          addAuditLog('Onboarding Checklist', activeSchool.id, `${nextVal ? 'Validation' : 'Annulation'} de l'étape : ${step.title}.`);
          return {
            ...step,
            completed: nextVal,
            completedAt: nextVal ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return step;
      })
    );
  };

  // Filter accounts according to role & search query
  const filteredAccounts = accounts.filter(acc => {
    if (activeTab === 'admin_staff') {
      if (!['PROVISEUR', 'CENSEUR', 'SURVEILLANT_GENERAL', 'INTENDANT', 'SECRETAIRE'].includes(acc.role)) return false;
    } else if (activeTab === 'teachers') {
      if (acc.role !== 'ENSEIGNANT') return false;
    } else if (activeTab === 'students') {
      if (acc.role !== 'ELEVE') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        acc.fullName.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.phone && acc.phone.includes(q))
      );
    }
    return true;
  });

  // Handle new account creation with validation
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { fullName?: string; username?: string; password?: string } = {};

    if (!newFullName.trim()) {
      errors.fullName = 'Le nom complet est obligatoire.';
    }
    if (!newUsername.trim()) {
      errors.username = 'L\'identifiant de connexion est obligatoire.';
    } else if (accounts.some(a => a.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      errors.username = 'Cet identifiant est déjà attribué à un autre utilisateur.';
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      errors.password = 'Le mot de passe doit comporter au moins 4 caractères.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Veuillez corriger les informations du compte.', 'error');
      return;
    }

    setFormErrors({});
    setIsCreatingAccount(true);

    setTimeout(() => {
      const newAcc: SchoolUserAccount = {
        id: `acc-${Date.now()}`,
        schoolId: activeSchool.id,
        fullName: newFullName.trim(),
        username: newUsername.toLowerCase().replace(/\s+/g, '.').trim(),
        email: newEmail.trim() || `${newUsername.toLowerCase().trim()}@academic.cm`,
        phone: newPhone.trim(),
        role: newRole,
        assignedClasses: newRole === 'ENSEIGNANT' ? newAssignedClasses : undefined,
        assignedSubjects: newRole === 'ENSEIGNANT' ? newAssignedSubjects : undefined,
        status: 'ACTIF',
        initialPassword: newPassword,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setAccounts(prev => [newAcc, ...prev]);
      setIsCreatingAccount(false);
      setIsAddAccountModalOpen(false);
      addAuditLog('Création Compte Utilisateur', activeSchool.id, `Création du compte ${newRole} pour ${newFullName} (${newAcc.username}).`);
      showToast(`Compte créé avec succès pour ${newFullName}.`, 'success');

      // Reset form
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('+237 6');
      setNewPassword(`Pass${Math.floor(1000 + Math.random() * 9000)}!`);
    }, 600);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc: SchoolUserAccount) => {
    setEditingAccount(acc);
    setEditFullName(acc.fullName);
    setEditEmail(acc.email);
    setEditPhone(acc.phone || '+237 6');
    setEditRole(acc.role);
    setEditStatus(acc.status);
    setEditInitialPassword(acc.initialPassword || '');
    setEditAssignedClasses(acc.assignedClasses || [classes[0]?.id || 'class-tc']);
  };

  // Save Edit Account
  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editFullName.trim()) {
      showToast('Le nom complet est obligatoire.', 'error');
      return;
    }

    setIsSavingEdit(true);
    setTimeout(() => {
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === editingAccount.id) {
            return {
              ...acc,
              fullName: editFullName.trim(),
              email: editEmail.trim() || acc.email,
              phone: editPhone.trim(),
              role: editRole,
              status: editStatus,
              initialPassword: editInitialPassword.trim() || acc.initialPassword,
              assignedClasses: editRole === 'ENSEIGNANT' ? editAssignedClasses : undefined
            };
          }
          return acc;
        })
      );

      addAuditLog(
        'Modification Compte Utilisateur',
        activeSchool.id,
        `Mise à jour des informations du compte ${editingAccount.username} (${editFullName.trim()}) - Statut: ${editStatus}, Rôle: ${editRole}.`
      );

      setIsSavingEdit(false);
      setEditingAccount(null);
      showToast(`Compte de ${editFullName.trim()} mis à jour avec succès !`, 'success');
    }, 500);
  };

  // Toggle Account Status
  const handleToggleAccountStatus = (acc: SchoolUserAccount) => {
    const nextStatus = acc.status === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    setAccounts(prev =>
      prev.map(a => (a.id === acc.id ? { ...a, status: nextStatus } : a))
    );
    addAuditLog(
      'Changement Statut Compte',
      activeSchool.id,
      `Compte ${acc.username} passé au statut ${nextStatus}.`
    );
    showToast(`Compte ${acc.username} est désormais ${nextStatus}.`, nextStatus === 'ACTIF' ? 'success' : 'info');
  };

  // Delete Account
  const handleDeleteAccount = (acc: SchoolUserAccount) => {
    if (confirm(`Confirmez-vous la suppression du compte de ${acc.fullName} (@${acc.username}) ? Cette action est irréversible.`)) {
      setAccounts(prev => prev.filter(a => a.id !== acc.id));
      addAuditLog(
        'Suppression Compte Utilisateur',
        activeSchool.id,
        `Suppression définitive du compte ${acc.username} (${acc.fullName}) - Rôle: ${acc.role}.`
      );
      showToast(`Le compte de ${acc.fullName} a été supprimé.`, 'info');
    }
  };

  // Synchronize all students, parents and staff with System User Accounts
  const [isSyncingSystem, setIsSyncingSystem] = useState(false);

  const handleSynchronizeAllSystemAccounts = () => {
    setIsSyncingSystem(true);
    try {
      const schoolId = activeSchool?.id || 'asi-gabon';
      const existingAccounts = accounts || [];
      const newAccounts: SchoolUserAccount[] = [];

      // Ensure students & parents accounts are in place
      students.forEach((student, idx) => {
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

      if (newAccounts.length > 0) {
        setAccounts(prev => [...prev, ...newAccounts]);
        addAuditLog(
          'Synchronisation Système Utilisateurs',
          schoolId,
          `Génération et synchronisation de ${newAccounts.length} comptes élèves et parents avec le système.`
        );
        showToast(`Synchronisation réussie : ${newAccounts.length} nouveaux comptes créés et synchronisés !`, 'success');
      } else {
        showToast('Tous les élèves, parents et personnels sont déjà synchronisés dans le système.', 'info');
      }
    } catch (err: any) {
      showToast(`Erreur de synchronisation : ${err?.message || err}`, 'error');
    } finally {
      setTimeout(() => setIsSyncingSystem(false), 500);
    }
  };

  // Export Accounts to CSV
  const handleExportAccountsCsv = () => {
    const rows = [
      ['ID', 'Nom_Complet', 'Identifiant', 'Email', 'Telephone', 'Role', 'Statut', 'Mot_De_Passe_Initial', 'Classes_Assignees'].join(',')
    ];

    filteredAccounts.forEach(acc => {
      const clsNames = (acc.assignedClasses || []).map(cid => classes.find(c => c.id === cid)?.name || cid).join('; ');
      rows.push([
        acc.id,
        `"${acc.fullName}"`,
        acc.username,
        acc.email,
        `"${acc.phone || ''}"`,
        acc.role,
        acc.status,
        acc.initialPassword || '',
        `"${clsNames}"`
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comptes_utilisateurs_${activeSchool.id.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addAuditLog('Exportation CSV', activeSchool.id, `Exportation de ${filteredAccounts.length} comptes utilisateurs.`);
    showToast(`Exportation CSV de ${filteredAccounts.length} comptes réussie !`, 'success');
  };

  // Process CSV Import with rigorous validation & feedback
  const handleExecuteCsvImport = () => {
    if (!csvText.trim()) {
      showToast('Veuillez saisir ou coller des données CSV.', 'error');
      return;
    }

    setIsImporting(true);
    setImportReport(null);

    setTimeout(() => {
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        setIsImporting(false);
        setImportReport({
          count: 0,
          message: 'Le fichier CSV ne contient aucune ligne de données après l\'en-tête.',
          errors: ['Fichier vide ou mal formaté']
        });
        showToast('Erreur : données CSV insuffisantes.', 'error');
        return;
      }

      const importedStudents: Student[] = [];
      const newAccounts: SchoolUserAccount[] = [];
      const parseErrors: string[] = [];

      // Parse rows
      for (let i = 1; i < lines.length; i++) {
        const lineContent = lines[i].trim();
        if (!lineContent) continue;

        const parts = lineContent.split(',').map(p => p.trim());
        if (parts.length < 4) {
          parseErrors.push(`Ligne ${i + 1} : Colonnes manquantes (attendu au moins Nom, Prénom, Sexe, Classe).`);
          continue;
        }

        const lastName = parts[0] || `Élève_${i}`;
        const firstName = parts[1] || '';
        const gender = (parts[2]?.toUpperCase() === 'F' ? 'F' : 'M') as 'M' | 'F';
        const className = parts[3] || classes[0]?.name || 'Terminale C';
        const parentName = parts[4] || `Parent de ${firstName} ${lastName}`;
        const parentPhone = parts[5] || '+237 600 00 00 00';
        const parentEmail = parts[6] || `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}@parent.cm`;

        // Match class or fallback
        const targetClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase()) || classes[0];

        const studId = `stud-imp-${Date.now()}-${i}`;
        const newStud: Student = {
          id: studId,
          classId: targetClass?.id || 'class-tc',
          firstName,
          lastName,
          gender,
          parentName,
          parentPhone,
          parentEmail,
          schoolId: activeSchool.id,
          status: 'Actif'
        };
        importedStudents.push(newStud);

        // Auto-generate student and parent account
        newAccounts.push({
          id: `acc-stud-${Date.now()}-${i}`,
          schoolId: activeSchool.id,
          fullName: `${firstName} ${lastName}`,
          username: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          email: `${firstName.toLowerCase()}@eleve.minesec.cm`,
          phone: parentPhone,
          role: 'ELEVE',
          studentId: studId,
          status: 'ACTIF',
          initialPassword: `Eleve${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString().split('T')[0]
        });
      }

      setIsImporting(false);

      if (importedStudents.length > 0) {
        setStudents(prev => [...prev, ...importedStudents]);
        setAccounts(prev => [...prev, ...newAccounts]);
        setImportReport({
          count: importedStudents.length,
          message: `${importedStudents.length} élèves et leurs comptes d'accès générés avec succès.`,
          errors: parseErrors.length > 0 ? parseErrors : undefined
        });
        addAuditLog('Importation Massif CSV', activeSchool.id, `Import de ${importedStudents.length} élèves et création des fiches d'accès.`);
        showToast(`${importedStudents.length} élèves importés avec succès !`, 'success');
      } else {
        setImportReport({
          count: 0,
          message: 'Aucun enregistrement valide n\'a pu être extrait.',
          errors: parseErrors
        });
        showToast('Aucun élève importé. Vérifiez le format.', 'error');
      }
    }, 800);
  };

  return (
    <div className="space-y-6" id="account-deployment-module">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2 flex-wrap">
              Déploiement, Gestion des Comptes & Onboarding
              <span className="text-xs bg-purple-50 text-purple-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-200 whitespace-nowrap">
                {accounts.length} comptes actifs
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Administration, Enseignants, Élèves, Générateur de fiches QR Code & Importation massive CSV
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleSynchronizeAllSystemAccounts}
            disabled={isSyncingSystem}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            title="Synchroniser automatiquement tous les élèves et parents inscrits avec les comptes d'accès"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncingSystem ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncingSystem ? 'Synchronisation...' : 'Synchroniser Système'}</span>
          </button>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Créer un Compte</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'checklist', label: 'Checklist Déploiement', icon: CheckCircle, badge: `${onboardingPercentage}%` },
          { id: 'admin_staff', label: 'Personnel Administratif', icon: ShieldCheck, count: accounts.filter(a => ['PROVISEUR', 'CENSEUR', 'SURVEILLANT_GENERAL', 'INTENDANT', 'SECRETAIRE'].includes(a.role)).length },
          { id: 'teachers', label: 'Enseignants & Affectations', icon: GraduationCap, count: accounts.filter(a => a.role === 'ENSEIGNANT').length },
          { id: 'students', label: 'Élèves & Parents Tuteurs', icon: Users, count: students.length },
          { id: 'cards', label: 'Fiches de Connexion & QR Codes', icon: QrCode },
          { id: 'import', label: 'Assistant d\'Import Massif (CSV/Excel)', icon: FileSpreadsheet },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHECKLIST DE DÉPLOIEMENT DE L'ÉTABLISSEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-linear-to-br from-slate-900 to-purple-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  GUIDE D'ONBOARDING & DÉMARRAGE ÉCOLE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-2">
                  Progression du Déploiement : {activeSchool.name}
                </h2>
                <p className="text-xs text-purple-200 font-mono mt-1">
                  Suivez ces 6 étapes clés pour configurer et lancer votre établissement en toute sérénité.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                  {onboardingPercentage}%
                </span>
                <span className="block text-[10px] text-slate-300 font-mono uppercase">
                  {completedStepsCount} sur {onboardingSteps.length} étapes validées
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-linear-to-r from-emerald-400 to-purple-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${onboardingPercentage}%` }}
              />
            </div>
          </div>

          {/* Checklist Steps Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboardingSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex items-start justify-between gap-4 ${
                  step.completed ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <button
                    onClick={() => handleToggleStep(step.id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 cursor-pointer transition-all ${
                      step.completed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs">{idx + 1}</span>}
                  </button>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">
                      Étape {idx + 1} • {step.category}
                    </span>
                    <h3 className={`text-sm font-bold font-display ${step.completed ? 'text-emerald-950' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                    {step.completed && step.completedAt && (
                      <span className="inline-block text-[10px] text-emerald-700 font-mono italic">
                        Validé le {step.completedAt}
                      </span>
                    )}
                  </div>
                </div>

                {step.actionTab && onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab(step.actionTab!)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Accéder au module associé"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2, 3, 4: COMPTES (ADMIN, ENSEIGNANTS, ÉLÈVES) */}
      {/* ========================================================================= */}
      {(activeTab === 'admin_staff' || activeTab === 'teachers' || activeTab === 'students') && (
        <div className="space-y-6">
          {/* Search bar & filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, identifiant, email, téléphone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleExportAccountsCsv}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 transition-colors border border-slate-200"
                title="Exporter la liste en CSV"
              >
                <Download className="h-4 w-4" />
                <span>Exporter CSV</span>
              </button>
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-purple-700 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Nouveau Compte</span>
              </button>
            </div>
          </div>

          {/* Accounts Grid or Empty State */}
          {filteredAccounts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Aucun compte trouvé</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Aucun compte n\'est encore enregistré dans cette catégorie.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Effacer la recherche
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddAccountModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Créer le premier compte</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map(acc => (
                <div key={acc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap ${
                          acc.role === 'PROVISEUR' ? 'bg-rose-100 text-rose-800' :
                          acc.role === 'CENSEUR' ? 'bg-amber-100 text-amber-800' :
                          acc.role === 'ENSEIGNANT' ? 'bg-blue-100 text-blue-800' :
                          acc.role === 'ELEVE' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {acc.role}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm font-display mt-1">{acc.fullName}</h4>
                        <span className="text-[11px] font-mono text-purple-600 font-bold">@{acc.username}</span>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        acc.status === 'ACTIF'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {acc.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{acc.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{acc.phone || 'Non renseigné'}</span>
                      </div>
                      {acc.initialPassword && (
                        <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 p-1.5 rounded-lg font-mono text-[11px]">
                          <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Code initial : <span className="font-bold text-slate-800">{acc.initialPassword}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Assigned classes / subjects for teachers */}
                    {acc.role === 'ENSEIGNANT' && acc.assignedClasses && (
                      <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                        <span className="font-bold text-slate-700 block">Classes attribuées :</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acc.assignedClasses.map((clsId, idx) => (
                            <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {classes.find(c => c.id === clsId)?.name || clsId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <button
                      onClick={() => handleOpenEditModal(acc)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Modifier les informations"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggleAccountStatus(acc)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          acc.status === 'ACTIF'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                        title={acc.status === 'ACTIF' ? 'Suspendre le compte' : 'Réactiver le compte'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(acc)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FICHES DE CONNEXION INDIVIDUELLES & BADGES QR CODE */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-display">Générateur de Fiches de Connexion & QR Codes</h3>
              <p className="text-xs text-slate-500 font-mono">
                Prêt à imprimer et distribuer aux parents et élèves lors de la rentrée scolaire.
              </p>
            </div>
            <button
              onClick={() => {
                showToast('Lancement du module d\'impression système...', 'info');
                window.print();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer Toutes les Fiches ({students.length})</span>
            </button>
          </div>

          {students.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <QrCode className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Aucun élève enregistré pour générer les fiches d'accès</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Utilisez l'assistant d'importation CSV ci-dessous pour injecter la liste de vos élèves.
              </p>
              <button
                onClick={() => setActiveTab('import')}
                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 cursor-pointer"
              >
                Importer des élèves
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(stud => {
                const cls = classes.find(c => c.id === stud.classId);
                return (
                  <div
                    key={stud.id}
                    className="bg-white border-2 border-slate-800 rounded-3xl p-5 shadow-md space-y-4 relative overflow-hidden"
                  >
                    {/* Header MINESEC */}
                    <div className="text-center border-b border-slate-200 pb-3 space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                        RÉPUBLIQUE DU CAMEROUN • MINESEC
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs font-display">{activeSchool.name}</h4>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded font-bold inline-block">
                        FICHE D'ACCÈS PARENT & ÉLÈVE • 2025-2026
                      </span>
                    </div>

                    {/* Student details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Élève :</span>
                        <span className="font-bold text-slate-900">{stud.lastName} {stud.firstName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Classe :</span>
                        <span className="font-bold font-mono text-blue-600">{cls?.name || 'Classe non assignée'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Parent Tuteur :</span>
                        <span className="font-medium text-slate-800">{stud.parentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tél Alerte :</span>
                        <span className="font-mono text-slate-800">{stud.parentPhone}</span>
                      </div>
                    </div>

                    {/* Credentials Box */}
                    <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px]">Identifiant Portail :</span>
                        <span className="font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {stud.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.{stud.id.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px]">Mot de Passe Temp :</span>
                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          LBY-{stud.id.slice(-4)}!
                        </span>
                      </div>
                    </div>

                    {/* QR Code placeholder & Link */}
                    <div className="pt-1 flex items-center justify-between">
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center p-1 shadow-xs shrink-0">
                        <QrCode className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono pl-2">
                        <span>Scanner pour consulter notes, présences & bulletins</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ASSISTANT D'IMPORT MASSIF (CSV / EXCEL) */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Importation Massif des Effectifs</span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
              Assistant d’Importation CSV / Excel des Élèves
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Collez vos données tabulaires pour insérer directement les élèves et créer leurs fiches d'accès.
            </p>
          </div>

          {importReport && (
            <div className={`p-4 rounded-2xl border flex flex-col space-y-2 text-xs font-bold ${
              importReport.count > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-3">
                {importReport.count > 0 ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span>{importReport.message}</span>
              </div>

              {importReport.errors && importReport.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] font-mono text-rose-700 font-normal space-y-1">
                  <span className="font-bold block">Avertissements rencontrés :</span>
                  {importReport.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Données au format CSV (Séparateur virgule)
              </label>
              <textarea
                rows={7}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="Exemple : Nom, Prénom, Sexe, Classe, Nom_Parent, Tel_Parent, Email_Parent&#10;Collez vos lignes d'élèves ici ou importez un fichier CSV..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-800 transition-all"
              />
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1 font-mono text-[11px]">
              <span className="font-bold">Structure des colonnes attendues :</span>
              <p>Nom, Prénom, Sexe (M/F), Classe, Nom_Parent, Tel_Parent, Email_Parent</p>
            </div>

            <button
              onClick={handleExecuteCsvImport}
              disabled={isImporting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Traitement et création des comptes en cours...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Valider & Importer Immédiatement dans la Base de Données</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Créer Compte */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">Créer un Nouveau Compte Utilisateur</h3>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nom complet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: M. Eto'o David"
                  value={newFullName}
                  onChange={e => {
                    setNewFullName(e.target.value);
                    if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium text-slate-800 transition-all ${
                    formErrors.fullName ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                />
                {formErrors.fullName && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{formErrors.fullName}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Identifiant (login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: david.etoo"
                    value={newUsername}
                    onChange={e => {
                      setNewUsername(e.target.value);
                      if (formErrors.username) setFormErrors(prev => ({ ...prev, username: undefined }));
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-slate-800 transition-all ${
                      formErrors.username ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                    }`}
                  />
                  {formErrors.username && (
                    <span className="text-[11px] text-rose-600 font-medium mt-1 block">{formErrors.username}</span>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rôle</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                  >
                    <option value="ENSEIGNANT">Enseignant</option>
                    <option value="CENSEUR">Censeur</option>
                    <option value="SURVEILLANT_GENERAL">Surveillant Général</option>
                    <option value="INTENDANT">Intendant</option>
                    <option value="SECRETAIRE">Secrétaire</option>
                    <option value="PROVISEUR">Proviseur / Principal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@academic.cm"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mot de Passe Initial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono text-purple-700 font-bold transition-all ${
                    formErrors.password ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                />
                {formErrors.password && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{formErrors.password}</span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-xs cursor-pointer hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-75"
                >
                  {isCreatingAccount ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Créer le Compte</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MODIFIER UN COMPTE UTILISATEUR */}
      {/* ========================================================================= */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    Modifier le Compte Utilisateur
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">@{editingAccount.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAccount(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nom Complet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rôle</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                  >
                    <option value="ENSEIGNANT">Enseignant</option>
                    <option value="CENSEUR">Censeur</option>
                    <option value="SURVEILLANT_GENERAL">Surveillant Général</option>
                    <option value="INTENDANT">Intendant</option>
                    <option value="SECRETAIRE">Secrétaire</option>
                    <option value="PROVISEUR">Proviseur / Principal</option>
                    <option value="ELEVE">Élève</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statut du Compte</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer text-slate-800"
                  >
                    <option value="ACTIF">ACTIF (Autorisé)</option>
                    <option value="SUSPENDU">SUSPENDU (Bloqué)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mot de Passe Initial / Réinitialisation
                </label>
                <input
                  type="text"
                  value={editInitialPassword}
                  onChange={e => setEditInitialPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-purple-700 font-bold"
                  placeholder="Laisser vide pour ne pas modifier"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-xs cursor-pointer hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-75"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
