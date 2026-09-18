/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { SchoolClass, Student, Evaluation, AttendanceSheet, AttendanceRecord, SchoolTenant } from '../types';
import { SUBJECTS } from '../data/mockData';
import { Calendar, Users, GraduationCap, Clock, CheckCircle, ArrowRight, BookOpen, FileText, AlertTriangle, ChevronRight, PlusCircle, Sparkles } from 'lucide-react';
import SummaryWidgets from './SummaryWidgets';

interface MainDashboardProps {
  sheets: AttendanceSheet[];
  records: AttendanceRecord[];
  evaluations: Evaluation[];
  setCurrentTab: (tab: string) => void;
  onOpenSheet: (sheetId: string) => void;
  onCreateNewSheet: (classId: string, subjectId: string) => void;
  activeSchool?: SchoolTenant;
  classes?: SchoolClass[];
  students?: Student[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 15 
    } 
  }
};

export default function MainDashboard({ 
  sheets, 
  records,
  evaluations, 
  setCurrentTab, 
  onOpenSheet, 
  onCreateNewSheet, 
  activeSchool,
  classes = [],
  students = []
}: MainDashboardProps) {
  // Theme color styling
  let buttonBg = 'bg-blue-600 hover:bg-blue-500';
  let badgeBorder = 'bg-blue-500/20 text-blue-300 border-blue-400/20';
  const themeColor = activeSchool?.primaryColor || 'blue';
  
  if (themeColor === 'emerald') {
    buttonBg = 'bg-emerald-600 hover:bg-emerald-500';
    badgeBorder = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20';
  } else if (themeColor === 'indigo') {
    buttonBg = 'bg-indigo-600 hover:bg-indigo-500';
    badgeBorder = 'bg-indigo-500/20 text-indigo-300 border-indigo-400/20';
  } else if (themeColor === 'rose') {
    buttonBg = 'bg-rose-600 hover:bg-rose-500';
    badgeBorder = 'bg-rose-500/20 text-rose-300 border-rose-400/20';
  } else if (themeColor === 'amber') {
    buttonBg = 'bg-amber-600 hover:bg-amber-500';
    badgeBorder = 'bg-amber-500/20 text-amber-300 border-amber-400/20';
  } else if (themeColor === 'violet') {
    buttonBg = 'bg-violet-600 hover:bg-violet-500';
    badgeBorder = 'bg-violet-500/20 text-violet-300 border-violet-400/20';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySheets = sheets.filter(s => s.date === todayStr);

  // Compute live classes overview for active school
  const dynamicTodayClasses = classes.slice(0, 5).map(cls => {
    const existingSheet = todaySheets.find(s => s.classId === cls.id);
    const defaultSubject = SUBJECTS[0] || { id: 'subj-math', name: 'Général' };
    return {
      id: `${cls.id}-${defaultSubject.id}`,
      className: cls.name,
      classId: cls.id,
      subjectName: defaultSubject.name,
      subjectId: defaultSubject.id,
      timeSlot: '08:00 - 10:00',
      status: existingSheet ? 'Appel validé' : 'Prendre l\'appel',
      sheetId: existingSheet?.id,
      isDone: Boolean(existingSheet)
    };
  });

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Welcome Banner Card */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800"
      >
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12 pointer-events-none">
          <GraduationCap className="h-72 w-72" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className={`inline-flex items-center space-x-2 ${badgeBorder} font-mono text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border`}>
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Session Académique en Direct</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight flex items-center space-x-2">
            <span>{activeSchool?.logoEmoji || '🏫'}</span>
            <span>{activeSchool?.name || 'Plateforme Établissement'}</span>
          </h2>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            Bienvenue sur le portail de gestion de <strong>{activeSchool?.name || 'Votre Établissement'}</strong>. Gérez vos fiches d'appel, saisissez les notes d'évaluations et pilotez les dossiers académiques en temps réel.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`${buttonBg} text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center space-x-1 cursor-pointer`}
            >
              <span>Prendre les présences</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentTab('grades')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Saisir des notes
            </button>
            <button
              onClick={() => setCurrentTab('classes')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Classes & Élèves
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Widgets Component */}
      {activeSchool ? (
        <SummaryWidgets
          students={students}
          sheets={sheets}
          records={records}
          evaluations={evaluations}
          activeSchool={activeSchool}
          setCurrentTab={setCurrentTab}
        />
      ) : null}

      {/* Main Grid Content */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Today's Schedule Card (left) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>Séances de Cours & Fiches d'Appel</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                Aujourd'hui
              </span>
            </div>

            {dynamicTodayClasses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {dynamicTodayClasses.map((cl, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-mono text-xs font-bold shrink-0">
                        {cl.timeSlot.split(' - ')[0]}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-slate-800 text-sm font-display block leading-tight">{cl.className}</strong>
                        <span className="text-xs text-slate-500 font-medium font-sans block mt-0.5">{cl.subjectName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-[11px] font-mono font-medium text-slate-400 hidden sm:inline">
                        {cl.timeSlot}
                      </span>
                      
                      {cl.isDone ? (
                        <button
                          onClick={() => onOpenSheet(cl.sheetId!)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Consulter l'appel
                        </button>
                      ) : (
                        <button
                          onClick={() => onCreateNewSheet(cl.classId, cl.subjectId)}
                          className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Prendre présence</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Aucune classe configurée pour cet établissement</p>
                <p className="text-xs text-slate-400 max-w-xs">Créez vos classes et inscrivez vos élèves dans l'onglet Administration pour démarrer les appels.</p>
                <button
                  onClick={() => setCurrentTab('admin')}
                  className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Ajouter une classe</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fast Action Shortcuts (right) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display border-b border-slate-100 pb-2">
            Raccourcis Pratiques
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => setCurrentTab('grades')}
              className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-center space-x-3.5 cursor-pointer"
            >
              <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Saisie des Notes</p>
                <p className="text-[10px] text-slate-400">Créer et évaluer les devoirs et contrôles</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-center space-x-3.5 cursor-pointer"
            >
              <div className="h-9 w-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Validation des Évaluations</p>
                <p className="text-[10px] text-slate-400">Approuver ou verrouiller les fiches de notes</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentTab('portal')}
              className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex items-center space-x-3.5 cursor-pointer"
            >
              <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Visualiser un Bulletin</p>
                <p className="text-[10px] text-slate-400">Aperçu officiel de l'élève par séquence</p>
              </div>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-700 text-xs space-y-1">
            <p className="font-semibold flex items-center space-x-1 text-slate-800">
              <Sparkles className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <span>Gestion Sécurisée</span>
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Toutes les données (présences, notes, inscriptions) sont synchronisées en direct avec votre base Firestore sécurisée.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
