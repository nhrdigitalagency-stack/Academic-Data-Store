/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SchoolTenant, 
  SchoolClass, 
  Student, 
  AuditLog,
  SchoolSubscription,
  PreRegistrationSubmission,
  SchoolUserAccount,
  LibraryResource
} from '../types';
import ThemeCustomizer from './ThemeCustomizer';
import SchoolManagerForm from './SchoolManagerForm';
import AuditLogManager from './AuditLogManager';
import SuperAdminDashboard from './SuperAdminDashboard';

import { 
  Building2, 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Globe, 
  Paintbrush, 
  History, 
  Plus, 
  Wrench, 
  LogOut, 
  CreditCard,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface SuperAdminModuleProps {
  schools: SchoolTenant[];
  setSchools: React.Dispatch<React.SetStateAction<SchoolTenant[]>>;
  activeSchoolId: string;
  setActiveSchoolId: (id: string) => void;
  setClasses?: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  classes?: SchoolClass[];
  students?: Student[];
  auditLogs?: AuditLog[];
  addAuditLog?: (action: string, schoolId: string, details: string, user?: string) => void;
  isLoggedIn?: boolean;
  currentUser?: any;
  setIsLoggedIn?: (val: boolean) => void;
  setCurrentUser?: (user: any) => void;
  sheets?: any[];
  evaluations?: any[];
  subscriptions?: Record<string, SchoolSubscription>;
  setSubscriptions?: React.Dispatch<React.SetStateAction<Record<string, SchoolSubscription>>>;
  preRegistrations?: PreRegistrationSubmission[];
  setPreRegistrations?: React.Dispatch<React.SetStateAction<PreRegistrationSubmission[]>>;
  userAccounts?: SchoolUserAccount[];
  setUserAccounts?: React.Dispatch<React.SetStateAction<SchoolUserAccount[]>>;
  libraryResources?: LibraryResource[];
  onNavigateToTab?: (tab: string) => void;
  onBack?: () => void;
}

export default function SuperAdminModule({
  schools,
  setSchools,
  activeSchoolId,
  setActiveSchoolId,
  setClasses,
  setStudents,
  classes = [],
  students = [],
  auditLogs = [],
  addAuditLog,
  isLoggedIn,
  currentUser,
  setIsLoggedIn,
  setCurrentUser,
  sheets = [],
  evaluations = [],
  subscriptions = {},
  setSubscriptions,
  preRegistrations = [],
  setPreRegistrations,
  userAccounts = [],
  setUserAccounts,
  libraryResources = [],
  onNavigateToTab,
  onBack
}: SuperAdminModuleProps) {
  // Sub tab navigation
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'tenants' | 'themes' | 'audit'>('dashboard');

  // Form toggles
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);

  // Status feedback alerts
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle school edit initiation
  const handleEditSchool = (school: SchoolTenant) => {
    setEditingSchoolId(school.id);
    setIsFormOpen(true);
  };

  // Handle school deletion
  const handleDeleteSchool = (id: string, name: string) => {
    if (schools.length <= 1) {
      setErrorMsg('Impossible de supprimer le dernier établissement de la plateforme.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    
    setSchools(prev => prev.filter(s => s.id !== id));
    if (activeSchoolId === id) {
      const remaining = schools.filter(s => s.id !== id);
      setActiveSchoolId(remaining[0].id);
    }

    addAuditLog?.(
      "Suppression d'établissement",
      id,
      `Destruction définitive du compte et de l'isolation du locataire "${name}" de la plateforme.`
    );

    setFeedbackMsg(`L'établissement "${name}" a été supprimé de la plateforme.`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Handle inline updates
  const handleUpdateLicense = (schoolId: string, status: 'Active' | 'Expired' | 'Pending' | 'Suspended') => {
    const sch = schools.find(s => s.id === schoolId);
    setSchools(prev => prev.map(s => {
      if (s.id === schoolId) {
        return { ...s, licenseStatus: status };
      }
      return s;
    }));
    
    addAuditLog?.(
      "Licence modifiée",
      schoolId,
      `Changement du statut de la licence d'utilisation pour l'école "${sch?.name}" -> ${status}.`
    );

    setFeedbackMsg(`Licence de "${sch?.name}" mise à jour en statut : ${status}`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleUpdateVersion = (schoolId: string, version: string) => {
    const sch = schools.find(s => s.id === schoolId);
    setSchools(prev => prev.map(s => {
      if (s.id === schoolId) {
        return { ...s, systemVersion: version };
      }
      return s;
    }));

    addAuditLog?.(
      "Mise à niveau système",
      schoolId,
      `Mise à jour de la version applicative de l'établissement "${sch?.name}" vers ${version}.`
    );

    setFeedbackMsg(`Version de "${sch?.name}" mise à niveau vers : ${version}`);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleLogout = () => {
    if (setIsLoggedIn) setIsLoggedIn(false);
    if (setCurrentUser) setCurrentUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header Info Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-6 -translate-y-6">
          <Building2 className="h-48 w-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {onBack && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700 shrink-0"
                  title="Retour à la page précédente"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Retour</span>
                </button>
              )}
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-blue-400/20">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Console Super Admin • Gestion Multitenant & SaaS</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold leading-tight">
              ADS STORE • Superviseur Central MINESEC
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Supervisez les indicateurs opérationnels en temps réel de chaque établissement scolaire, pilotez les abonnements et quotas SMS, personnalisez les chartes graphiques et contrôlez la conformité.
            </p>
          </div>

          {/* Logout button */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 hover:text-white border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shrink-0"
              title="Se déconnecter de la console SuperAdmin"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl border shadow-xs gap-1.5 overflow-x-auto">
        <button
          onClick={() => {
            setActiveSubTab('dashboard');
            setIsFormOpen(false);
            setEditingSchoolId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'dashboard' && !isFormOpen
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Tableau de bord Supervision</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('tenants');
            setIsFormOpen(false);
            setEditingSchoolId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'tenants' && !isFormOpen
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Gestion des Établissements ({schools.length})</span>
        </button>

        <button
          onClick={() => {
            setEditingSchoolId(null);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60"
        >
          <Plus className="h-4 w-4" />
          <span>Créer un Établissement</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('themes');
            setIsFormOpen(false);
            setEditingSchoolId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'themes'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Paintbrush className="h-4 w-4" />
          <span>Personnalisation des Thèmes</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('audit');
            setIsFormOpen(false);
            setEditingSchoolId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Console d'Audit Centralisée</span>
          <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Dynamic Feedback Messaging */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center space-x-2 animate-fade-in shadow-xs">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm flex items-center space-x-2 animate-fade-in shadow-xs">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Dynamic Workspace Area */}
      <div className="transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Tab 1: Supervision Real-time Dashboard */}
            {activeSubTab === 'dashboard' && (
              <SuperAdminDashboard
                schools={schools}
                activeSchoolId={activeSchoolId}
                setActiveSchoolId={setActiveSchoolId}
                students={students}
                setStudents={setStudents}
                classes={classes}
                onEditSchool={handleEditSchool}
                onDeleteSchool={handleDeleteSchool}
                onUpdateLicense={handleUpdateLicense}
                onUpdateVersion={handleUpdateVersion}
                onAddNewSchool={() => {
                  setEditingSchoolId(null);
                  setIsFormOpen(true);
                }}
                sheets={sheets}
                evaluations={evaluations}
                auditLogs={auditLogs}
                subscriptions={subscriptions}
                setSubscriptions={setSubscriptions}
                preRegistrations={preRegistrations}
                setPreRegistrations={setPreRegistrations}
                userAccounts={userAccounts}
                setUserAccounts={setUserAccounts}
                libraryResources={libraryResources}
                addAuditLog={addAuditLog}
                onNavigateToTab={onNavigateToTab}
              />
            )}

            {/* Tab 2: Dedicated Tenants Management View */}
            {activeSubTab === 'tenants' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span>Répertoire des Établissements Scolaires Multi-Tenant</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gérez les locataires isolés, leurs licences d'exploitation, leurs versions logicielles et pilotez chaque établissement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSchoolId(null);
                      setIsFormOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer un Établissement</span>
                  </button>
                </div>

                {/* Tenants Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {schools.map(school => {
                    const isSelected = school.id === activeSchoolId;
                    const schoolStudents = students.filter(s => s.schoolId === school.id).length;
                    const schoolClasses = classes.filter(c => c.schoolId === school.id).length;
                    const schoolSub = subscriptions[school.id];

                    return (
                      <div 
                        key={school.id}
                        className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                                {school.logoEmoji || '🏫'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-display font-bold text-sm text-slate-900 truncate" title={school.name}>
                                  {school.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 italic truncate" title={school.slogan}>
                                  {school.slogan || 'Discipline - Travail - Succès'}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono">
                                ACTIF
                              </span>
                            )}
                          </div>

                          {/* Quick Info details */}
                          <div className="bg-slate-50/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Localisation :</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[160px]">{school.address}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Effectifs :</span>
                              <span className="font-semibold text-slate-700 font-mono">{schoolStudents} élèves • {schoolClasses} classes</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Forfait SaaS :</span>
                              <span className="font-bold text-emerald-600 font-mono">{schoolSub?.planType || 'PRO'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Version Système :</span>
                              <span className="font-mono text-slate-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                {school.systemVersion || 'v2.5.0'}
                              </span>
                            </div>
                          </div>

                          {/* License Status Dropdown */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Statut Licence :</span>
                            <select
                              value={school.licenseStatus || 'Active'}
                              onChange={(e) => handleUpdateLicense(school.id, e.target.value as any)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                                school.licenseStatus === 'Active' || !school.licenseStatus
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : school.licenseStatus === 'Expired'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : school.licenseStatus === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Pending">En Attente</option>
                              <option value="Expired">Expirée</option>
                              <option value="Suspended">Suspendue</option>
                            </select>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setActiveSchoolId(school.id);
                              if (onNavigateToTab) onNavigateToTab('dashboard');
                              setFeedbackMsg(`Établissement actif : "${school.name}". Redirection vers son tableau de bord...`);
                              setTimeout(() => setFeedbackMsg(''), 3500);
                            }}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                          >
                            <Activity className="h-3.5 w-3.5" />
                            <span>Piloter</span>
                          </button>

                          <button
                            onClick={() => handleEditSchool(school)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Modifier les paramètres de l'école"
                          >
                            <Wrench className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveSchoolId(school.id);
                              setActiveSubTab('themes');
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Personnaliser la charte graphique"
                          >
                            <Paintbrush className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Confirmez-vous la suppression définitive de "${school.name}" ?`)) {
                                handleDeleteSchool(school.id, school.name);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Supprimer cet établissement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Themes Library and Real-Time Customizer */}
            {activeSubTab === 'themes' && (
              <ThemeCustomizer
                schools={schools}
                setSchools={setSchools}
                addAuditLog={addAuditLog}
              />
            )}

            {/* Tab 4: Centralized Cryptographic Audit Logs */}
            {activeSubTab === 'audit' && (
              <AuditLogManager
                auditLogs={auditLogs}
                schools={schools}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal Overlay for School Tenant Creation / Editing */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFormOpen(false);
                setEditingSchoolId(null);
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body Card with Slide-In & Fade-In Transition */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              <div className="overflow-y-auto p-1">
                <SchoolManagerForm
                  schools={schools}
                  setSchools={setSchools}
                  editingSchoolId={editingSchoolId}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingSchoolId(null);
                  }}
                  activeSchoolId={activeSchoolId}
                  setActiveSchoolId={setActiveSchoolId}
                  setClasses={setClasses}
                  setStudents={setStudents}
                  addAuditLog={addAuditLog}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
