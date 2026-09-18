/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Users, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Student, AttendanceSheet, AttendanceRecord, Evaluation, SchoolTenant } from '../types';

import { useTenantStats } from '../hooks/useTenantStats';

interface SummaryWidgetsProps {
  students: Student[];
  sheets: AttendanceSheet[];
  records: AttendanceRecord[];
  evaluations: Evaluation[];
  activeSchool: SchoolTenant;
  setCurrentTab?: (tab: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 14 }
  }
};

export default function SummaryWidgets({
  students: propStudents,
  sheets: propSheets,
  records: propRecords,
  evaluations: propEvaluations,
  activeSchool,
  setCurrentTab
}: SummaryWidgetsProps) {
  // Use the real-time Tenant Stats hook
  const realTimeStats = useTenantStats(activeSchool.id);

  // Fall back to prop values if real-time loading is active, otherwise use live Firestore values
  const activeStudentsCount = realTimeStats.loading 
    ? propStudents.filter(s => s.status === 'Active' || s.status === 'Actif' || !s.status).length 
    : realTimeStats.activeStudentsCount;

  const attendanceRate = realTimeStats.loading ? (() => {
    const schoolSheetIds = new Set(propSheets.map(s => s.id));
    const schoolRecords = propRecords.filter(r => schoolSheetIds.has(r.sheetId));
    const totalAttendanceCount = schoolRecords.length;
    const presentCount = schoolRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    return totalAttendanceCount > 0 
      ? Number(((presentCount / totalAttendanceCount) * 100).toFixed(1))
      : 0;
  })() : realTimeStats.attendanceRate;

  const pendingCount = realTimeStats.loading 
    ? propEvaluations.filter(e => e.status === 'PENDING_VALIDATION').length 
    : realTimeStats.pendingValidationsCount;

  // Visual Theme mapping based on activeSchool primaryColor
  const primaryColor = activeSchool.primaryColor || 'blue';
  
  let bgGradient = 'from-blue-500/10 to-transparent';
  let accentBorder = 'border-blue-500/30';
  let iconBg = 'bg-blue-500/10 text-blue-600';
  let pingBg = 'bg-blue-500';

  if (primaryColor === 'emerald') {
    bgGradient = 'from-emerald-500/10 to-transparent';
    accentBorder = 'border-emerald-500/30';
    iconBg = 'bg-emerald-500/10 text-emerald-600';
    pingBg = 'bg-emerald-500';
  } else if (primaryColor === 'indigo') {
    bgGradient = 'from-indigo-500/10 to-transparent';
    accentBorder = 'border-indigo-500/30';
    iconBg = 'bg-indigo-500/10 text-indigo-600';
    pingBg = 'bg-indigo-500';
  } else if (primaryColor === 'rose') {
    bgGradient = 'from-rose-500/10 to-transparent';
    accentBorder = 'border-rose-500/30';
    iconBg = 'bg-rose-500/10 text-rose-600';
    pingBg = 'bg-rose-500';
  } else if (primaryColor === 'amber') {
    bgGradient = 'from-amber-500/10 to-transparent';
    accentBorder = 'border-amber-500/30';
    iconBg = 'bg-amber-500/10 text-amber-600';
    pingBg = 'bg-amber-500';
  } else if (primaryColor === 'violet') {
    bgGradient = 'from-violet-500/10 to-transparent';
    accentBorder = 'border-violet-500/30';
    iconBg = 'bg-violet-500/10 text-violet-600';
    pingBg = 'bg-violet-500';
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-5"
    >
      {/* Widget 1: Total Active Students */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, transition: { duration: 0.15 } }}
        className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group`}
      >
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
              <span>Effectif Actif (Active Students)</span>
              {!realTimeStats.loading && (
                <span className="flex h-1.5 w-1.5 relative" title="Synchro en direct Firestore active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </p>
            <p className="text-2xl font-display font-black text-slate-800 font-mono mt-0.5">
              {activeStudentsCount} <span className="text-sm font-sans font-medium text-slate-500">élèves</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Enrôlés pour l'année {activeSchool.activeSchoolYear}</p>
          </div>
        </div>
        {setCurrentTab && (
          <button
            onClick={() => setCurrentTab('classes')}
            className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0 self-start"
            title="Gérer les classes & élèves"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {/* Widget 2: Average Daily Attendance Rate */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, transition: { duration: 0.15 } }}
        className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group`}
      >
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
              <span>Assiduité Journalière (Attendance Rate)</span>
              {!realTimeStats.loading && (
                <span className="flex h-1.5 w-1.5 relative" title="Synchro en direct Firestore active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </p>
            <p className="text-2xl font-display font-black text-slate-800 font-mono mt-0.5">
              {attendanceRate}%
            </p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
              <p className="text-[10px] text-emerald-600 font-semibold">Taux d'assiduité global</p>
            </div>
          </div>
        </div>
        {setCurrentTab && (
          <button
            onClick={() => setCurrentTab('attendance')}
            className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0 self-start"
            title="Gérer les présences"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {/* Widget 3: Pending Grade Validations */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4, transition: { duration: 0.15 } }}
        className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group`}
      >
        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-xl group-hover:opacity-10 transition-opacity"></div>
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
            {pendingCount > 0 ? <Clock className="h-6 w-6 animate-pulse" /> : <CheckCircle className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5">
              <span>Notes en Attente (Pending Validations)</span>
              {!realTimeStats.loading && (
                <span className="flex h-1.5 w-1.5 relative" title="Synchro en direct Firestore active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </p>
            <p className="text-2xl font-display font-black text-slate-800 font-mono mt-0.5">
              {pendingCount} <span className="text-sm font-sans font-medium text-slate-500">épreuves</span>
            </p>
            {pendingCount > 0 ? (
              <div className="flex items-center space-x-1 mt-0.5 text-rose-500">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <p className="text-[10px] font-semibold">Action requise par le Censeur</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mt-0.5">Toutes les épreuves sont validées</p>
            )}
          </div>
        </div>
        {setCurrentTab && (
          <button
            onClick={() => setCurrentTab('admin')}
            className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0 self-start"
            title="Consulter les validations"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
