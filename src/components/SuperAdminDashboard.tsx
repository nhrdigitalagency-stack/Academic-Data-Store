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
  AttendanceSheet, 
  Evaluation, 
  AuditLog,
  SchoolSubscription,
  PreRegistrationSubmission,
  SchoolUserAccount,
  LibraryResource
} from '../types';
import { useTenantStats } from '../hooks/useTenantStats';
import PerformanceChart from './PerformanceChart';
import { 
  Building2, 
  Globe, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Layers, 
  Plus, 
  ChevronRight,
  ShieldAlert,
  Clock,
  BookOpen,
  Sparkles,
  Palette,
  CreditCard,
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  UserPlus,
  ArrowRight,
  Info,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { DEFAULT_PALETTES } from '../utils/colorUtils';

interface SuperAdminDashboardProps {
  schools: SchoolTenant[];
  activeSchoolId: string;
  setActiveSchoolId: (id: string) => void;
  students: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: SchoolClass[];
  onEditSchool: (school: SchoolTenant) => void;
  onDeleteSchool: (id: string, name: string) => void;
  onUpdateLicense: (id: string, status: 'Active' | 'Expired' | 'Pending' | 'Suspended') => void;
  onUpdateVersion: (id: string, version: string) => void;
  onAddNewSchool: () => void;
  sheets?: AttendanceSheet[];
  evaluations?: Evaluation[];
  auditLogs?: AuditLog[];
  subscriptions?: Record<string, SchoolSubscription>;
  setSubscriptions?: React.Dispatch<React.SetStateAction<Record<string, SchoolSubscription>>>;
  preRegistrations?: PreRegistrationSubmission[];
  setPreRegistrations?: React.Dispatch<React.SetStateAction<PreRegistrationSubmission[]>>;
  userAccounts?: SchoolUserAccount[];
  setUserAccounts?: React.Dispatch<React.SetStateAction<SchoolUserAccount[]>>;
  libraryResources?: LibraryResource[];
  addAuditLog?: (action: string, schoolId: string, details: string, user?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function SuperAdminDashboard({
  schools,
  activeSchoolId,
  setActiveSchoolId,
  students,
  setStudents,
  classes,
  onEditSchool,
  onDeleteSchool,
  onUpdateLicense,
  onUpdateVersion,
  onAddNewSchool,
  sheets = [],
  evaluations = [],
  auditLogs = [],
  subscriptions = {},
  setSubscriptions,
  preRegistrations = [],
  setPreRegistrations,
  userAccounts = [],
  setUserAccounts,
  libraryResources = [],
  addAuditLog,
  onNavigateToTab
}: SuperAdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [versionInputVal, setVersionInputVal] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'schools' | 'subscriptions' | 'preRegistrations' | 'guide'>('overview');
  const [sandboxPalette, setSandboxPalette] = useState<'blue' | 'emerald' | 'violet' | 'indigo' | 'rose'>('blue');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [feedbackToast, setFeedbackToast] = useState<string>('');
  const [smsTopUpModalSchoolId, setSmsTopUpModalSchoolId] = useState<string | null>(null);
  const [customSmsAmount, setCustomSmsAmount] = useState<number>(1000);

  const onboardingChecklist = {
    createTenant: schools.length > 0,
    configureBranding: schools.some(s => Boolean(s.logoUrl || s.primaryColor)),
    addAdminAccount: userAccounts.length > 0,
    setupClasses: classes.length > 0,
    registerStudents: students.length > 0,
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(''), 4000);
  };

  // Helper: count students for a specific school
  const getSchoolStudentsCount = (schoolId: string) => {
    return students.filter(s => {
      if (!s) return false;
      if (s.schoolId) {
        return s.schoolId === schoolId;
      }
      const studentClass = s.classId ? classes.find(c => c.id === s.classId) : undefined;
      return studentClass?.schoolId === schoolId;
    }).length;
  };

  // Filter schools
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slogan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Invoke the real-time Tenant Stats hook
  const realTimeStats = useTenantStats();

  // Platform usage metrics
  const totalSchoolsCount = realTimeStats.loading ? schools.length : realTimeStats.totalSchoolsCount;
  const activeSchoolsCount = realTimeStats.loading 
    ? schools.filter(s => s.licenseStatus === 'Active' || !s.licenseStatus).length
    : realTimeStats.activeSchoolsCount;
  const totalStudentsCount = realTimeStats.loading 
    ? schools.reduce((acc, s) => acc + getSchoolStudentsCount(s.id), 0)
    : realTimeStats.totalStudents;
  
  // Real-time Platform Usage Aggregations
  const totalSheetsCount = realTimeStats.loading ? sheets.length : realTimeStats.sheetsCount;
  const totalEvalsCount = realTimeStats.loading ? evaluations.length : realTimeStats.evaluationsCount;
  const totalLogsCount = auditLogs.length;
  const systemUsageCount = totalSheetsCount + totalEvalsCount + totalLogsCount;

  // Platform compliance percentage
  const complianceRate = totalSchoolsCount > 0 
    ? Math.round((activeSchoolsCount / totalSchoolsCount) * 100) 
    : 100;

  // Total MRR calculation
  const totalMRR = Object.values(subscriptions).reduce((acc, sub) => acc + (sub.priceMonthlyFcfa || 0), 0);
  const totalSmsQuota = Object.values(subscriptions).reduce((acc, sub) => acc + (sub.smsIncluded || 0), 0);
  const totalSmsUsed = Object.values(subscriptions).reduce((acc, sub) => acc + (sub.smsUsed || 0), 0);

  const handleStartVersionEdit = (id: string, currentVal: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVersionId(id);
    setVersionInputVal(currentVal);
  };

  const handleSaveVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateVersion(id, versionInputVal);
    setEditingVersionId(null);
  };

  // Top up SMS for a school
  const handleTopUpSms = (schoolId: string, amount: number) => {
    const school = schools.find(s => s.id === schoolId);
    if (!setSubscriptions) return;

    setSubscriptions(prev => {
      const current = prev[schoolId] || {
        schoolId,
        planType: 'PRO',
        status: 'ACTIVE',
        billingCycle: 'ANNUAL',
        startDate: '2025-09-01',
        nextRenewalDate: '2026-09-01',
        priceMonthlyFcfa: 75000,
        smsIncluded: 3000,
        smsUsed: 120,
        storageUsedMb: 450,
        storageLimitMb: 50000,
        invoices: []
      };

      const updated: SchoolSubscription = {
        ...current,
        smsIncluded: (current.smsIncluded || 0) + amount
      };

      return {
        ...prev,
        [schoolId]: updated
      };
    });

    addAuditLog?.(
      "Recharge SMS SuperAdmin",
      schoolId,
      `SuperAdmin a crédité ${amount} SMS sur le compte de l'établissement "${school?.name}".`
    );

    showToast(`Succès : +${amount} crédits SMS ajoutés à "${school?.name}"`);
    setSmsTopUpModalSchoolId(null);
  };

  // Change subscription plan
  const handleChangePlan = (schoolId: string, newPlan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    const school = schools.find(s => s.id === schoolId);
    if (!setSubscriptions) return;

    const planPrices = { BASIC: 35000, PRO: 75000, ENTERPRISE: 150000 };
    const planSms = { BASIC: 1000, PRO: 3000, ENTERPRISE: 10000 };
    const planStorage = { BASIC: 10000, PRO: 50000, ENTERPRISE: 200000 };

    setSubscriptions(prev => {
      const current = prev[schoolId] || {
        schoolId,
        planType: newPlan,
        status: 'ACTIVE',
        billingCycle: 'ANNUAL',
        startDate: '2025-09-01',
        nextRenewalDate: '2026-09-01',
        priceMonthlyFcfa: planPrices[newPlan],
        smsIncluded: planSms[newPlan],
        smsUsed: 0,
        storageUsedMb: 200,
        storageLimitMb: planStorage[newPlan],
        invoices: []
      };

      const updated: SchoolSubscription = {
        ...current,
        planType: newPlan,
        priceMonthlyFcfa: planPrices[newPlan],
        smsIncluded: Math.max(current.smsIncluded, planSms[newPlan]),
        storageLimitMb: planStorage[newPlan]
      };

      return { ...prev, [schoolId]: updated };
    });

    addAuditLog?.(
      "Mise à jour Forfait SaaS",
      schoolId,
      `Changement de plan SaaS pour "${school?.name}" vers ${newPlan} (${planPrices[newPlan].toLocaleString()} FCFA/mois).`
    );

    showToast(`Plan de "${school?.name}" mis à jour vers "${newPlan}" avec succès.`);
  };

  // Approve pre-registration directly from Super Admin
  const handleApprovePreRegistration = (submission: PreRegistrationSubmission) => {
    if (!setPreRegistrations) return;

    // 1. Update status
    setPreRegistrations(prev => prev.map(p => p.id === submission.id ? { ...p, status: 'APPROUVE' } : p));

    // 2. Add real student record
    if (setStudents) {
      const targetClass = classes.find(c => c.schoolId === submission.schoolId) || classes[0];
      const newStudent: Student = {
        id: `stud-${Date.now()}`,
        schoolId: submission.schoolId,
        firstName: submission.candidateFirstName,
        lastName: submission.candidateLastName,
        classId: targetClass ? targetClass.id : 'class-tc',
        dob: submission.dob || '2008-01-01',
        gender: submission.gender || 'M',
        parentName: submission.parentName,
        parentPhone: submission.parentPhone,
        parentEmail: submission.parentEmail
      };
      setStudents(prev => [...prev, newStudent]);
    }

    // 3. Create user account
    if (setUserAccounts) {
      const username = `${submission.candidateLastName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${submission.candidateFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const newAcc: SchoolUserAccount = {
        id: `user-${Date.now()}`,
        schoolId: submission.schoolId,
        username,
        email: submission.parentEmail || `${username}@student.academic.cm`,
        phone: submission.parentPhone || '+237 600 00 00 00',
        fullName: `${submission.candidateFirstName} ${submission.candidateLastName}`,
        role: 'ELEVE',
        initialPassword: 'eleve',
        createdAt: new Date().toISOString(),
        status: 'ACTIF'
      };
      setUserAccounts(prev => [...prev, newAcc]);
    }

    const schoolName = schools.find(s => s.id === submission.schoolId)?.name || 'Établissement';
    addAuditLog?.(
      "Validation Inscription Réseau",
      submission.schoolId,
      `SuperAdmin a validé le dossier de pré-inscription de ${submission.candidateLastName} ${submission.candidateFirstName} pour ${schoolName}.`
    );

    showToast(`Dossier de ${submission.candidateLastName} validé ! Élève et compte créés.`);
  };

  return (
    <div className="space-y-6" id="superadmin-dashboard-container">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-bold"
          >
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Firestore KPI Widgets (Always visible at the top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Schools Card */}
        <motion.div 
          whileHover={{ y: -3, boxShadow: '0 12px 20px -3px rgba(59, 130, 246, 0.08)' }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 transition-all flex items-center space-x-4 relative overflow-hidden shadow-xs"
        >
          <div className="h-12 w-12 rounded-xl bg-blue-50/70 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Établissements</p>
              <span className="flex h-1.5 w-1.5 relative" title="Synchro Firestore active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-2xl font-display font-black text-slate-800 font-mono leading-none mt-1.5">
              {totalSchoolsCount} <span className="text-xs text-slate-400 font-normal">écoles</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
              <span>{activeSchoolsCount} actives en direct</span>
            </p>
          </div>
        </motion.div>

        {/* Total Students Card */}
        <motion.div 
          whileHover={{ y: -3, boxShadow: '0 12px 20px -3px rgba(139, 92, 246, 0.08)' }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 transition-all flex items-center space-x-4 relative overflow-hidden shadow-xs"
        >
          <div className="h-12 w-12 rounded-xl bg-violet-50/70 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100/50">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Élèves Plateforme</p>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-2xl font-display font-black text-slate-800 font-mono leading-none mt-1.5">
              {totalStudentsCount} <span className="text-xs text-slate-400 font-normal">inscrits</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
              <span className="text-violet-500 font-bold font-mono">+{Math.round(totalStudentsCount * 0.15)}</span>
              <span>nouveaux ce trimestre</span>
            </p>
          </div>
        </motion.div>

        {/* SaaS MRR & SMS Usage */}
        <motion.div 
          whileHover={{ y: -3, boxShadow: '0 12px 20px -3px rgba(16, 185, 129, 0.08)' }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 transition-all flex items-center space-x-4 relative overflow-hidden shadow-xs"
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-50/70 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Revenu SaaS Réseau (MRR)</p>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xl font-display font-black text-emerald-600 font-mono leading-none mt-1.5">
              {(totalMRR / 1000).toFixed(0)}k <span className="text-xs text-slate-400 font-normal">FCFA/mois</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {totalSmsUsed} / {totalSmsQuota} SMS consommés
            </p>
          </div>
        </motion.div>

        {/* Network Health / Global Compliance Card */}
        <motion.div 
          whileHover={{ y: -3, boxShadow: '0 12px 20px -3px rgba(99, 102, 241, 0.08)' }}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 transition-all flex items-center space-x-4 relative overflow-hidden shadow-xs"
        >
          <div className="h-12 w-12 rounded-xl bg-indigo-50/70 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
            <Globe className="h-6 w-6 animate-pulse" style={{ animationDuration: '4s' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Activité & Pré-inscriptions</p>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-2xl font-display font-black text-indigo-600 font-mono leading-none mt-1.5">
              {preRegistrations.length} <span className="text-xs text-slate-400 font-normal">dossiers</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {systemUsageCount} actions synchronisées
            </p>
          </div>
        </motion.div>

      </div>

      {/* SuperAdmin Inner Sub-navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
              viewMode === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Vue d'Ensemble Analytique</span>
          </button>
          
          <button
            onClick={() => setViewMode('schools')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
              viewMode === 'schools'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Liste des Établissements ({schools.length})</span>
          </button>

          <button
            onClick={() => setViewMode('subscriptions')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
              viewMode === 'subscriptions'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Abonnements & Quotas SMS</span>
          </button>

          <button
            onClick={() => setViewMode('preRegistrations')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
              viewMode === 'preRegistrations'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Pré-inscriptions Réseau</span>
            {preRegistrations.filter(p => p.status === 'EN_ATTENTE').length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {preRegistrations.filter(p => p.status === 'EN_ATTENTE').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('guide')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-none outline-none ${
              viewMode === 'guide'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Guide Déploiement</span>
          </button>
        </div>
        
        {/* Dynamic Sync Status Indicator */}
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200/50 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Synchro Firestore Active</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {viewMode === 'overview' && (
            <>
              {/* Live Recharts-powered enrollment & attendance data analytics */}
              <PerformanceChart schools={schools} />

              {/* Real-Time Performance & Adoption Indicators Section */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800/80 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2 font-display">
                      <Activity className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                      <span>Indicateurs de Performance & Adoption par Établissement</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Analyse d'adoption, d'activité et de santé de la licence par établissement connecté en direct.
                    </p>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono font-bold px-2.5 py-1 rounded-full border border-indigo-400/10 shrink-0">
                    Conformité Réseau : {complianceRate}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {schools.map(school => {
                    const studentCount = getSchoolStudentsCount(school.id);
                    const classCount = classes.filter(c => c.schoolId === school.id).length;
                    const activityCount = evaluations.filter(e => e.schoolId === school.id).length + sheets.filter(s => s.schoolId === school.id).length;
                    const sub = subscriptions[school.id];
                    const license = school.licenseStatus || 'Active';

                    let statusColor = 'text-emerald-400';
                    let statusBg = 'bg-emerald-500/10';
                    let statusBorder = 'border-emerald-500/20';
                    let healthScore = 75 + Math.min(activityCount * 3, 20) + Math.min(classCount, 5);

                    if (license === 'Pending') {
                      statusColor = 'text-amber-400';
                      statusBg = 'bg-amber-500/10';
                      statusBorder = 'border-amber-500/20';
                      healthScore = 55;
                    } else if (license === 'Expired') {
                      statusColor = 'text-rose-400';
                      statusBg = 'bg-rose-500/10';
                      statusBorder = 'border-rose-500/20';
                      healthScore = 20;
                    } else if (license === 'Suspended') {
                      statusColor = 'text-slate-400';
                      statusBg = 'bg-slate-500/10';
                      statusBorder = 'border-slate-500/20';
                      healthScore = 0;
                    }

                    healthScore = Math.max(5, Math.min(100, healthScore));

                    return (
                      <div key={school.id} className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-xl shrink-0">{school.logoEmoji || '🏫'}</span>
                            <div className="min-w-0">
                              <h5 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{school.name}</h5>
                              <p className="text-[10px] text-slate-500 font-mono">{school.systemVersion || 'v2.5.0'} • Plan {sub?.planType || 'PRO'}</p>
                            </div>
                          </div>
                          
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor} ${statusBg} ${statusBorder} uppercase tracking-wider shrink-0`}>
                            {license === 'Active' ? 'Active' : license === 'Pending' ? 'À valider' : license === 'Expired' ? 'Expirée' : 'Suspendue'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-900">
                          <div className="bg-slate-900/50 p-2 rounded-xl">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Élèves</p>
                            <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{studentCount}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded-xl">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Classes</p>
                            <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{classCount}</p>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded-xl">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">SMS Restants</p>
                            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                              {sub ? Math.max(0, (sub.smsIncluded || 0) - (sub.smsUsed || 0)) : 2880}
                            </p>
                          </div>
                        </div>

                        {/* Score adoption gauge */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-medium">Taux d'Adoption Plateforme</span>
                            <span className="text-slate-200 font-bold font-mono">{healthScore}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${healthScore}%` }} 
                              className={`h-full rounded-full transition-all duration-500 ${
                                healthScore >= 80 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                  : healthScore >= 50 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                                  : 'bg-gradient-to-r from-rose-500 to-pink-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {viewMode === 'schools' && (
            <>
              {/* Directory & Actions header search */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-slate-700" />
                      <span>Tableau de Contrôle & Supervision de Réseau</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gérez les licences d'accès scolaires, mettez à jour les versions logicielles et surveillez la charte de chaque locataire.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une école..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-64"
                      />
                    </div>
                    <button
                      onClick={onAddNewSchool}
                      className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Créer Établissement</span>
                    </button>
                  </div>
                </div>

                {/* Schools table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-6">Établissement</th>
                        <th className="py-3 px-4 text-center">Élèves</th>
                        <th className="py-3 px-4">Version Système</th>
                        <th className="py-3 px-4">Statut Licence</th>
                        <th className="py-3 px-4">Palette CSS</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSchools.map(school => {
                        const isSelected = school.id === activeSchoolId;
                        const studentCount = getSchoolStudentsCount(school.id);
                        const license = school.licenseStatus || 'Active';
                        const version = school.systemVersion || 'v2.5.0';

                        let statusBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100';
                        if (license === 'Expired') statusBadgeClass = 'text-rose-700 bg-rose-50 border-rose-100 hover:bg-rose-100';
                        else if (license === 'Pending') statusBadgeClass = 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100';
                        else if (license === 'Suspended') statusBadgeClass = 'text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100';

                        return (
                          <tr key={school.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50/20 font-semibold' : ''}`}>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                {school.logoUrl ? (
                                  <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-inner shrink-0">
                                    <img src={school.logoUrl} alt={school.name} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                ) : (
                                  <span className="text-xl p-1 bg-slate-100 rounded-lg shrink-0">{school.logoEmoji || '🏫'}</span>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 leading-tight flex items-center space-x-1.5 truncate">
                                    <span className="truncate">{school.name}</span>
                                    {isSelected && <span className="inline-block h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Établissement actif" />}
                                  </p>
                                  <p className="text-[10px] text-slate-400 italic truncate">« {school.slogan} »</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center font-bold font-mono text-slate-800">
                              {studentCount}
                            </td>

                            <td className="py-4 px-4">
                              {editingVersionId === school.id ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={versionInputVal}
                                    onChange={e => setVersionInputVal(e.target.value)}
                                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <button onClick={(e) => handleSaveVersion(school.id, e)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer border-0 bg-transparent">
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setEditingVersionId(null); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer border-0 bg-transparent">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1.5 group">
                                  <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                    {version}
                                  </span>
                                  <button onClick={(e) => handleStartVersionEdit(school.id, version, e)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-opacity cursor-pointer border-0 bg-transparent">
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <select
                                value={license}
                                onChange={e => onUpdateLicense(school.id, e.target.value as any)}
                                className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer ${statusBadgeClass}`}
                              >
                                <option value="Active">Active</option>
                                <option value="Expired">Suspendue</option>
                                <option value="Pending">À valider</option>
                                <option value="Suspended">Bloquée</option>
                              </select>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1">
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-2xs" style={{ backgroundColor: school.themePrimary || DEFAULT_PALETTES[school.primaryColor || 'blue'].primary }} />
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-2xs" style={{ backgroundColor: school.themeSecondary || DEFAULT_PALETTES[school.primaryColor || 'blue'].secondary }} />
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shadow-2xs" style={{ backgroundColor: school.themeAccent || DEFAULT_PALETTES[school.primaryColor || 'blue'].accent }} />
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setActiveSchoolId(school.id);
                                    showToast(`Établissement "${school.name}" sélectionné.`);
                                  }}
                                  className={`px-3 py-1 text-[11px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {isSelected ? 'Sélectionné' : 'Piloter'}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onEditSchool(school); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded cursor-pointer border-0 bg-transparent">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSchool(school.id, school.name); }} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded cursor-pointer border-0 bg-transparent">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SaaS Subscriptions & SMS Quotas Multi-Tenant Management */}
          {viewMode === 'subscriptions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <span>Gestion des Abonnements SaaS & Quotas SMS MINESEC</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contrôlez les forfaits actifs, rechargez les soldes SMS pour l'envoi des bulletins/absences et suivez les facturations.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      Total MRR : <strong className="text-slate-900 font-mono">{totalMRR.toLocaleString()} FCFA</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-6">Établissement</th>
                        <th className="py-3 px-4">Forfait Actif</th>
                        <th className="py-3 px-4">Montant Mensuel</th>
                        <th className="py-3 px-4">Solde SMS (Envoyés / Inclus)</th>
                        <th className="py-3 px-4">Stockage Cloud</th>
                        <th className="py-3 px-4">Renouvellement</th>
                        <th className="py-3 px-6 text-right">Actions SuperAdmin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schools.map(school => {
                        const sub = subscriptions[school.id] || {
                          schoolId: school.id,
                          planType: 'PRO',
                          status: 'ACTIVE',
                          billingCycle: 'ANNUAL',
                          startDate: '2025-09-01',
                          nextRenewalDate: '2026-09-01',
                          priceMonthlyFcfa: 75000,
                          smsIncluded: 3000,
                          smsUsed: 120,
                          storageUsedMb: 450,
                          storageLimitMb: 50000,
                          invoices: []
                        };

                        const smsRemaining = Math.max(0, (sub.smsIncluded || 0) - (sub.smsUsed || 0));
                        const smsPercent = sub.smsIncluded ? Math.min(100, Math.round(((sub.smsUsed || 0) / sub.smsIncluded) * 100)) : 0;

                        return (
                          <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2.5">
                                <span className="text-xl">{school.logoEmoji || '🏫'}</span>
                                <div>
                                  <p className="font-bold text-slate-800 leading-tight">{school.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{school.id}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <select
                                value={sub.planType}
                                onChange={(e) => handleChangePlan(school.id, e.target.value as any)}
                                className="bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer focus:outline-none"
                              >
                                <option value="BASIC">Basique (35k FCFA)</option>
                                <option value="PRO">Pro Établissement (75k FCFA)</option>
                                <option value="ENTERPRISE">Entreprise Académique (150k FCFA)</option>
                              </select>
                            </td>

                            <td className="py-4 px-4 font-bold font-mono text-slate-800">
                              {(sub.priceMonthlyFcfa || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">FCFA</span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="font-bold text-slate-800">{smsRemaining} dispo</span>
                                  <span className="text-slate-400">{sub.smsUsed || 0}/{sub.smsIncluded || 0}</span>
                                </div>
                                <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${smsPercent}%` }} 
                                    className={`h-full rounded-full ${smsPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 font-mono text-slate-600">
                              {(sub.storageUsedMb || 0)} Mo / {((sub.storageLimitMb || 50000) / 1000).toFixed(0)} Go
                            </td>

                            <td className="py-4 px-4 font-mono text-slate-500">
                              {sub.nextRenewalDate || '2026-09-01'}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSmsTopUpModalSchoolId(school.id)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                                  title="Créditer des SMS"
                                >
                                  <Smartphone className="h-3.5 w-3.5" />
                                  <span>+ SMS</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleTopUpSms(school.id, 1000);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  title="+1000 SMS Rapide"
                                >
                                  +1k SMS
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SMS Top Up Modal */}
              {smsTopUpModalSchoolId && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-800 flex items-center space-x-2 text-sm">
                        <Smartphone className="h-4 w-4 text-indigo-600" />
                        <span>Créditer des SMS • {schools.find(s => s.id === smsTopUpModalSchoolId)?.name}</span>
                      </h4>
                      <button onClick={() => setSmsTopUpModalSchoolId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      Sélectionnez le volume de SMS à allouer immédiatement à cet établissement pour les alertes de présence et la diffusion des notes aux parents.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[500, 2000, 5000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setCustomSmsAmount(amt)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            customSmsAmount === amt ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <p className="text-sm font-mono font-bold">+{amt}</p>
                          <p className="text-[10px] opacity-80">SMS</p>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Montant personnalisé</label>
                      <input
                        type="number"
                        value={customSmsAmount}
                        onChange={(e) => setCustomSmsAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleTopUpSms(smsTopUpModalSchoolId, customSmsAmount)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-colors cursor-pointer"
                      >
                        Valider l'allocation SMS
                      </button>
                      <button
                        onClick={() => setSmsTopUpModalSchoolId(null)}
                        className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Network Pre-Registrations multi-tenant management */}
          {viewMode === 'preRegistrations' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span>Dossiers de Pré-inscription en Ligne (Toutes Écoles)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralisez et validez les demandes d'admission soumises par les parents d'élèves sur les sites publics de tous les établissements.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={selectedSchoolFilter}
                    onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les établissements ({schools.length})</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6">Candidat</th>
                      <th className="py-3 px-4">Établissement Demandé</th>
                      <th className="py-3 px-4">Classe Sollicitée</th>
                      <th className="py-3 px-4">Parent & Contact</th>
                      <th className="py-3 px-4">Moyenne Antérieure</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-6 text-right">Action Directe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preRegistrations
                      .filter(p => selectedSchoolFilter === 'all' || p.schoolId === selectedSchoolFilter)
                      .map(sub => {
                        const school = schools.find(s => s.id === sub.schoolId);
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-800">
                              {sub.candidateLastName} {sub.candidateFirstName}
                              <div className="text-[10px] text-slate-400 font-normal">Né(e) le {sub.dob} ({sub.gender})</div>
                            </td>

                            <td className="py-4 px-4 font-medium text-slate-700">
                              <span className="flex items-center space-x-1.5">
                                <span>{school?.logoEmoji || '🏫'}</span>
                                <span className="truncate">{school?.name || sub.schoolId}</span>
                              </span>
                            </td>

                            <td className="py-4 px-4 font-mono font-bold text-indigo-600">
                              {sub.requestedClass}
                            </td>

                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-800">{sub.parentName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{sub.parentPhone}</div>
                            </td>

                            <td className="py-4 px-4 font-mono">
                              {sub.previousAverage ? (
                                <span className="font-bold text-emerald-600">{sub.previousAverage} / 20</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                sub.status === 'APPROUVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                sub.status === 'REJETE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {sub.status === 'APPROUVE' ? 'Validé' : sub.status === 'REJETE' ? 'Rejeté' : 'En attente'}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              {sub.status !== 'APPROUVE' ? (
                                <button
                                  onClick={() => handleApprovePreRegistration(sub)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                                >
                                  Inscrire l'Élève
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end space-x-1">
                                  <Check className="h-4 w-4" />
                                  <span>Inscrit</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'guide' && (
            <div className="space-y-6">
              {/* Onboarding Welcome Hero */}
              <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <BookOpen className="h-40 w-40" />
                </div>
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-300 font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-indigo-500/20">
                    <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Tutoriel d'Onboarding Officiel</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight leading-tight">
                    Guide de Configuration Multi-Établissement & Branding
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                    Bienvenue dans le centre de pilotage global de l'application ! En tant que Super Administrateur, vous disposez d'un contrôle total pour provisionner de nouveaux établissements (locataires SaaS ou "Tenants"), configurer leur identité visuelle unique et associer les comptes d'accès pour les personnels administratifs et enseignants.
                  </p>
                </div>

                {/* Local Progress Indicator */}
                <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                  {(() => {
                    const checkedCount = Object.values(onboardingChecklist).filter(Boolean).length;
                    const progressPercent = Math.round((checkedCount / 5) * 100);
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider font-mono">Progression de votre Onboarding</span>
                          <span className="font-mono text-indigo-400 font-bold text-sm bg-indigo-400/10 px-2 py-0.5 rounded-full">{progressPercent}% Complété</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            style={{ width: `${progressPercent}%` }} 
                            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Onboarding Checklist & Active Step Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Steps Navigator Checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 lg:col-span-1">
                  <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Plan de déploiement</h4>
                  
                  <div className="space-y-2">
                    <div
                      className="w-full text-left flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                        onboardingChecklist.createTenant 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}>✓</span>
                      <div>
                        <p className={`text-xs font-bold ${onboardingChecklist.createTenant ? 'text-slate-500' : 'text-slate-800'}`}>
                          1. Création de l'école (Tenant)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Créer un locataire autonome avec ID et informations</p>
                      </div>
                    </div>

                    <div
                      className="w-full text-left flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                        onboardingChecklist.configureBranding 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}>✓</span>
                      <div>
                        <p className={`text-xs font-bold ${onboardingChecklist.configureBranding ? 'text-slate-500' : 'text-slate-800'}`}>
                          2. Configuration de la charte
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Personnaliser le logo emoji, le slogan et la palette CSS</p>
                      </div>
                    </div>

                    <div
                      className="w-full text-left flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                        onboardingChecklist.addAdminAccount 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}>✓</span>
                      <div>
                        <p className={`text-xs font-bold ${onboardingChecklist.addAdminAccount ? 'text-slate-500' : 'text-slate-800'}`}>
                          3. Association des administrateurs
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Déployer les premiers identifiants de direction</p>
                      </div>
                    </div>

                    <div
                      className="w-full text-left flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                        onboardingChecklist.setupClasses 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}>✓</span>
                      <div>
                        <p className={`text-xs font-bold ${onboardingChecklist.setupClasses ? 'text-slate-500' : 'text-slate-800'}`}>
                          4. Initialisation des classes
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Configurer les niveaux académiques et les matières</p>
                      </div>
                    </div>

                    <div
                      className="w-full text-left flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-white"
                    >
                      <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                        onboardingChecklist.registerStudents 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 text-transparent'
                      }`}>✓</span>
                      <div>
                        <p className={`text-xs font-bold ${onboardingChecklist.registerStudents ? 'text-slate-500' : 'text-slate-800'}`}>
                          5. Enregistrement des élèves & notes
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Assurer la saisie des listes d'appel et des notes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                    <p className="font-bold text-slate-700 flex items-center space-x-1">
                      <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>Rappel de l'architecture</span>
                    </p>
                    <p>
                      Chaque école créée est totalement cloisonnée en base de données. L'administrateur d'établissement ne voit jamais les données des autres collèges ou lycées.
                    </p>
                  </div>
                </div>

                {/* Main Guided Step Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 lg:col-span-2">
                  
                  {/* Step 1: Create School */}
                  <div className="space-y-3 pb-5 border-b border-slate-100">
                    <h5 className="text-xs font-bold text-indigo-600 font-mono uppercase tracking-wider flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span>Étape 1 : Création du Tenant Établissement</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      La première étape consiste à déclarer l'école sur notre infrastructure cloud. Le système attribue à l'établissement un identifiant unique (par exemple <code>school-001</code>) qui servira de clé de routage pour isoler toutes ses données (élèves, fiches de présence, notes).
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Prêt à créer une nouvelle école ?</p>
                        <p className="text-[10px] text-slate-500">Cliquez pour ouvrir l'assistant de configuration globale.</p>
                      </div>
                      <button
                        onClick={onAddNewSchool}
                        className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm border-0 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Créer un établissement</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Branding Customization & Live Sandbox Preview */}
                  <div className="space-y-4 pb-5 border-b border-slate-100">
                    <h5 className="text-xs font-bold text-indigo-600 font-mono uppercase tracking-wider flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span>Étape 2 : Configuration du Branding & Charte Visuelle</span>
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Personnalisez l'expérience utilisateur ! Chaque établissement définit son logo (Emoji expressif ou URL d'image), son slogan officiel, ainsi que sa couleur de palette primaire. Cette couleur colore instantanément le tableau de bord de direction de l'école concernée.
                    </p>

                    {/* LIVE BRANDING SIMULATOR SANDBOX */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                            <Palette className="h-4 w-4 text-slate-600" />
                            <span>Aperçu Interactif de la Charte Graphique</span>
                          </p>
                          <p className="text-[10px] text-slate-500">Choisissez une couleur pour tester le rendu de l'interface en direct.</p>
                        </div>
                        
                        {/* Selector Row */}
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1.5 sm:gap-0">
                          {(['blue', 'emerald', 'violet', 'indigo', 'rose'] as const).map(color => {
                            const isChosen = sandboxPalette === color;
                            const bgPreview = 
                              color === 'blue' ? 'bg-blue-600' :
                              color === 'emerald' ? 'bg-emerald-600' :
                              color === 'violet' ? 'bg-violet-600' :
                              color === 'indigo' ? 'bg-indigo-600' : 'bg-rose-600';
                            return (
                              <button
                                key={color}
                                onClick={() => setSandboxPalette(color)}
                                className={`h-6 px-2 text-[10px] font-bold rounded-md border flex items-center space-x-1 cursor-pointer transition-all ${
                                  isChosen 
                                    ? 'bg-white border-slate-800 text-slate-800 shadow-sm' 
                                    : 'bg-transparent border-slate-200 text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${bgPreview}`} />
                                <span className="capitalize">{color}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
