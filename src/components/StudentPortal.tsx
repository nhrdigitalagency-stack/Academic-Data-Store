/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STUDENTS, CLASSES, SUBJECTS, INITIAL_EVALUATIONS, INITIAL_MARKS, INITIAL_ATTENDANCE_SHEETS, INITIAL_ATTENDANCE_RECORDS, CLASS_SUBJECTS, INITIAL_SCHOOLS } from '../data/mockData';
import { Student, Mark, Evaluation, Subject, ClassSubject, SchoolClass, SchoolTenant, AttendanceRecord, AttendanceSheet, Homework } from '../types';
import { User, Mail, Phone, BookOpen, Clock, AlertTriangle, FileText, ChevronRight, GraduationCap, Calendar, Award, Edit2, Save, X, CheckCircle2, XCircle, CheckSquare, ListFilter, ShieldCheck, ArrowLeft } from 'lucide-react';

interface StudentPortalProps {
  initialStudents?: Student[];
  initialMarks?: Mark[];
  initialEvaluations?: Evaluation[];
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
  classes?: SchoolClass[];
  activeSchool?: SchoolTenant;
  records?: AttendanceRecord[];
  sheets?: AttendanceSheet[];
  homeworks?: Homework[];
  currentUser?: {
    role?: string;
    parentPhone?: string;
    email?: string;
  } | null;
  onUpdateStudent?: (updated: Student) => void;
  onBack?: () => void;
}

export default function StudentPortal({ 
  initialStudents = STUDENTS, 
  initialMarks = INITIAL_MARKS, 
  initialEvaluations = INITIAL_EVALUATIONS,
  selectedStudentId: propSelectedStudentId,
  onSelectStudent,
  classes = CLASSES,
  activeSchool,
  records = INITIAL_ATTENDANCE_RECORDS,
  sheets = INITIAL_ATTENDANCE_SHEETS,
  homeworks = [],
  currentUser,
  onUpdateStudent,
  onBack
}: StudentPortalProps) {
  const [portalSubTab, setPortalSubTab] = useState<'grades' | 'homework' | 'attendance'>('grades');
  const [homeworkFilter, setHomeworkFilter] = useState<'ALL' | 'FAIT' | 'NON_FAIT' | 'PENDING'>('ALL');

  const isParentSession = currentUser?.role === 'parent';
  const parentPhoneClean = (currentUser?.parentPhone || '').replace(/[\s\-\.\(\)]/g, '');
  const parentStudents = isParentSession && parentPhoneClean
    ? initialStudents.filter(s => (s.parentPhone || '').replace(/[\s\-\.\(\)]/g, '') === parentPhoneClean)
    : initialStudents;

  const currentStudentList = parentStudents.length > 0 ? parentStudents : initialStudents;

  const [localSelectedStudentId, setLocalSelectedStudentId] = useState<string>(currentStudentList[0]?.id || '');
  const selectedStudentId = propSelectedStudentId !== undefined ? propSelectedStudentId : localSelectedStudentId;
  const setSelectedStudentId = onSelectStudent !== undefined ? onSelectStudent : setLocalSelectedStudentId;

  // Sync selected student with available students list
  React.useEffect(() => {
    if (currentStudentList.length > 0 && !currentStudentList.some(s => s.id === selectedStudentId)) {
      setSelectedStudentId(currentStudentList[0].id);
    }
  }, [currentStudentList, selectedStudentId, setSelectedStudentId]);

  // Student profile edit form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Reset edit state when student selection changes
  React.useEffect(() => {
    setIsEditingProfile(false);
  }, [selectedStudentId]);

  // Find selected student details
  const student = currentStudentList.find(s => s.id === selectedStudentId) || currentStudentList[0];

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-white rounded-2xl border border-slate-100 h-64">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2 animate-bounce" />
        <span className="text-sm font-bold">Aucun élève disponible</span>
        <span className="text-xs text-slate-400 mt-1 text-center max-w-xs">
          Veuillez d'abord ajouter des élèves dans l'administration ou attendre le chargement de la base de données.
        </span>
      </div>
    );
  }

  const handleStartEditProfile = () => {
    setEditFirstName(student.firstName);
    setEditLastName(student.lastName);
    setEditParentName(student.parentName);
    setEditParentPhone(student.parentPhone);
    setEditParentEmail(student.parentEmail || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editParentName.trim() || !editParentPhone.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires (*).", "error");
      return;
    }
    const updatedStudent: Student = {
      ...student,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      parentName: editParentName.trim(),
      parentPhone: editParentPhone.trim(),
      parentEmail: editParentEmail.trim() || undefined
    };
    onUpdateStudent?.(updatedStudent);
    setIsEditingProfile(false);
    showToast("Profil élève mis à jour avec succès !", "success");
  };
  const sClass = classes.find(c => c.id === student?.classId);

  // Get all class-subject relations for this class
  const classSubjectsForStudent = CLASS_SUBJECTS.filter(cs => cs.classId === student.classId);

  // Attendance metrics for student
  const studentRecords = records.filter(r => r.studentId === student.id);
  const totalAbsences = studentRecords.filter(r => r.status === 'ABSENT').length;
  const unexcusedAbsences = studentRecords.filter(r => r.status === 'ABSENT' && r.reason === 'NON_AUTORISE').length;
  const totalLates = studentRecords.filter(r => r.status === 'LATE').length;

  // Let's calculate subject averages for Séquence 5 (current sequence)
  const currentSequenceId = 5;
  const evaluationsInSeq5 = initialEvaluations.filter(e => e.classId === student.classId && e.sequenceId === currentSequenceId);
  
  const subjectPerformanceSeq5 = classSubjectsForStudent.map(cs => {
    const subject = SUBJECTS.find(s => s.id === cs.subjectId) as Subject;
    
    // Find evaluations of this subject in seq 5
    const evals = evaluationsInSeq5.filter(e => e.subjectId === cs.subjectId);
    
    // Find grades for this student in these evaluations
    const studentGrades = evals.map(ev => {
      const mark = initialMarks.find(m => m.evaluationId === ev.id && m.studentId === student.id);
      return {
        evalTitle: ev.title,
        evalType: ev.type,
        coeff: ev.coefficient,
        value: mark ? mark.value : null,
        comment: mark ? mark.comment : ''
      };
    }).filter(g => g.value !== null); // only count entered marks

    // Calculate weighted average
    let totalValue = 0;
    let totalCoeff = 0;
    studentGrades.forEach(g => {
      if (g.value !== null) {
        totalValue += g.value * g.coeff;
        totalCoeff += g.coeff;
      }
    });

    const average = totalCoeff > 0 ? Number((totalValue / totalCoeff).toFixed(2)) : null;

    return {
      subjectId: cs.subjectId,
      subjectName: subject.name,
      code: subject.code,
      coefficient: cs.coefficient,
      grades: studentGrades,
      average
    };
  });

  // Calculate Overall General Average for Seq 5
  let totalPoints = 0;
  let totalCoeffs = 0;
  subjectPerformanceSeq5.forEach(sp => {
    if (sp.average !== null) {
      totalPoints += sp.average * sp.coefficient;
      totalCoeffs += sp.coefficient;
    }
  });

  const overallAverageSeq5 = totalCoeffs > 0 ? Number((totalPoints / totalCoeffs).toFixed(2)) : null;

  const handleDownloadPDF = async () => {
    try {
      const { generateBulletinPDF } = await import('../utils/pdfGenerator');
      const schoolObj = activeSchool || INITIAL_SCHOOLS.find(s => s.id === student.schoolId) || INITIAL_SCHOOLS[0];
      
      await generateBulletinPDF(
        schoolObj,
        student,
        sClass?.name || 'Classe inconnue',
        subjectPerformanceSeq5,
        overallAverageSeq5,
        currentSequenceId,
        totalCoeffs
      );
    } catch (error) {
      console.error('Erreur lors du téléchargement du bulletin PDF:', error);
      showToast('Une erreur est survenue lors du téléchargement du bulletin.', 'error');
    }
  };

  // Progression of Averages across sequences (S1 to S5)
  // Let's compute overall sequence averages for this student or mock realistic curves if some grades are not in mock data
  const getSequenceAverage = (seqId: number): number => {
    const evalsInSeq = initialEvaluations.filter(e => e.classId === student.classId && e.sequenceId === seqId);
    let points = 0;
    let coeffs = 0;

    classSubjectsForStudent.forEach(cs => {
      const evals = evalsInSeq.filter(e => e.subjectId === cs.subjectId);
      let subPoints = 0;
      let subCoeffs = 0;

      evals.forEach(ev => {
        const mark = initialMarks.find(m => m.evaluationId === ev.id && m.studentId === student.id);
        if (mark) {
          subPoints += mark.value * ev.coefficient;
          subCoeffs += ev.coefficient;
        }
      });

      if (subCoeffs > 0) {
        const subAvg = subPoints / subCoeffs;
        points += subAvg * cs.coefficient;
        coeffs += cs.coefficient;
      }
    });

    if (coeffs > 0) return Number((points / coeffs).toFixed(2));
    return 0;
  };

  const sequenceAverages = [1, 2, 3, 4, 5].map(seqId => ({
    seqName: `Séquence ${seqId}`,
    average: getSequenceAverage(seqId)
  }));

  // Helper to determine appreciation
  const getAppreciation = (avg: number | null) => {
    if (avg === null) return { text: 'Inconnu', color: 'text-slate-500 bg-slate-100' };
    if (avg >= 16) return { text: 'Très Bien - Félicitations', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
    if (avg >= 14) return { text: 'Bien - Tableau d\'Honneur', color: 'text-blue-700 bg-blue-100 border-blue-200' };
    if (avg >= 12) return { text: 'Assez Bien - Encouragements', color: 'text-blue-700 bg-blue-100 border-blue-200' };
    if (avg >= 10) return { text: 'Passable', color: 'text-amber-700 bg-amber-100 border-amber-200' };
    return { text: 'Médiocre - Doit redoubler d\'efforts', color: 'text-rose-700 bg-rose-100 border-rose-200' };
  };

  const appreciation = getAppreciation(overallAverageSeq5);

  // SVG dimensions for chart
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Calculate points for SVG Polyline
  const xCoords = [0, 1, 2, 3, 4].map(idx => 
    paddingLeft + (idx * (chartWidth - paddingLeft - paddingRight) / 4)
  );

  const getPointsString = () => {
    return sequenceAverages.map((item, idx) => {
      // Map score 8-20 to height chartHeight-bottom to top
      const minScore = 8;
      const maxScore = 20;
      const x = xCoords[idx];
      const y = chartHeight - paddingBottom - (
        (item.average - minScore) / (maxScore - minScore) * (chartHeight - paddingTop - paddingBottom)
      );
      return `${x},${y}`;
    }).join(' ');
  };

  // Homework stats for current student
  const studentHomeworks = (homeworks || []).filter(h => h.classId === student?.classId);
  const doneHwCount = studentHomeworks.filter(h => {
    const sub = h.submissions?.find(s => s.studentId === student?.id);
    return sub?.status === 'FAIT';
  }).length;
  const missedHwCount = studentHomeworks.filter(h => {
    const sub = h.submissions?.find(s => s.studentId === student?.id);
    return sub?.status === 'NON_FAIT';
  }).length;
  const pendingHwCount = studentHomeworks.filter(h => {
    const sub = h.submissions?.find(s => s.studentId === student?.id);
    return !sub || sub.status === 'PARTIEL';
  }).length;
  const hwCompletionRate = studentHomeworks.length > 0
    ? Math.round((doneHwCount / studentHomeworks.length) * 100)
    : 100;

  // Attendance stats for current student
  const studentAttendanceRecords = (records || []).filter(r => r.studentId === student?.id);
  const unexcusedCount = studentAttendanceRecords.filter(r => r.status === 'ABSENT' && !r.isExcused).length;
  const excusedCount = studentAttendanceRecords.filter(r => r.status === 'ABSENT' && r.isExcused).length;
  const lateCount = studentAttendanceRecords.filter(r => r.status === 'LATE').length;

  return (
    <div className="space-y-6" id="student-portal-module">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <Award className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <FileText className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Selector and Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {isParentSession && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Session Parent Certifiée • Téléphone : {currentUser?.parentPhone || student?.parentPhone || 'Non renseigné'}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-semibold">
              Parent / Tuteur : {student?.parentName || 'Famille'}
            </span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-1 p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
                title="Retour à la page précédente"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2 text-blue-600 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                <User className="h-4 w-4" />
                <span>{isParentSession ? "Espace Parent d'Élève" : "Espace Consultatif Personnel"}</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-800">
                {isParentSession ? `Dossier de ${student.firstName} ${student.lastName}` : "Portail Élève & Famille"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Consultez les moyennes, devoirs de maison (faits / non faits) et assiduité en temps réel.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {isParentSession ? "Enfant :" : "Profil Élève :"}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {Array.from(new Set(currentStudentList.map(s => s.classId))).map(classId => {
                const className = classes.find(c => c.id === classId)?.name || 'Classe';
                const classStudents = currentStudentList.filter(s => s.classId === classId);
                if (classStudents.length === 0) return null;
                return (
                  <optgroup key={classId} label={className}>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        </div>

        {/* Subtabs for navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setPortalSubTab('grades')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              portalSubTab === 'grades'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Bulletin & Notes Séquentielles</span>
          </button>

          <button
            onClick={() => setPortalSubTab('homework')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              portalSubTab === 'homework'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Devoirs de Maison (Cahier de Textes)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              portalSubTab === 'homework' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {studentHomeworks.length}
            </span>
          </button>

          <button
            onClick={() => setPortalSubTab('attendance')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              portalSubTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Suivi d'Assiduité & Absences</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              portalSubTab === 'attendance' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {studentAttendanceRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content depending on subtab */}
      {portalSubTab === 'grades' && (
        <>
          {/* Grid: Profile and Averages Progression Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {!isEditingProfile ? (
            <>
              <div className="text-center pb-4 border-b border-slate-100 relative group">
                <button
                  onClick={handleStartEditProfile}
                  className="absolute right-0 top-0 text-slate-400 hover:text-blue-600 hover:bg-slate-50 p-1.5 rounded-lg border border-slate-100 transition-all flex items-center space-x-1 cursor-pointer"
                  title="Modifier le profil de liaison"
                >
                  <Edit2 className="h-3 w-3" />
                  <span className="text-[10px] font-bold">Modifier</span>
                </button>

                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-display text-2xl font-bold flex items-center justify-center mx-auto shadow-md">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <h3 className="text-lg font-display font-bold text-slate-800 mt-3 leading-snug">
                  {student.firstName} {student.lastName}
                </h3>
                <span className="inline-block mt-1 bg-blue-100 text-blue-800 font-mono text-xs font-bold px-3 py-1 rounded-full">
                  Classe : {sClass?.name || 'Inconnue'}
                </span>
              </div>

              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Fiche de Liaison Parents
                </h4>
                
                <div className="flex items-center space-x-3 text-slate-600 text-xs">
                  <Award className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px]">Tuteur Légat</p>
                    <p className="font-medium text-slate-800">{student.parentName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-600 text-xs">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px]">Numéro Alerte SMS</p>
                    <p className="font-mono font-medium text-slate-800">{student.parentPhone}</p>
                  </div>
                </div>

                {student.parentEmail && (
                  <div className="flex items-center space-x-3 text-slate-600 text-xs">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 text-[10px]">Email de correspondance</p>
                      <p className="font-medium text-slate-800">{student.parentEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Édition Fiche de Liaison</h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                  title="Annuler"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prénom de l'élève *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nom de l'élève *</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tuteur Légal (Parent) *</label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={e => setEditParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Téléphone Tuteur SMS *</label>
                  <input
                    type="tel"
                    required
                    value={editParentPhone}
                    onChange={e => setEditParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail Tuteur</label>
                  <input
                    type="email"
                    value={editParentEmail}
                    onChange={e => setEditParentEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-1.5 rounded-lg text-center transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-center transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
            <p className="text-blue-800 font-semibold text-xs flex items-center space-x-1.5">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Statut National</span>
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Inscrit au Registre Unique des Établissements Secondaires sous tutelle du MINESEC (Cameroun).
            </p>
          </div>
        </div>

        {/* Charts & Highlights */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Metrics Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Moyenne Générale</p>
                <p className="text-xl font-display font-bold text-slate-800 font-mono">
                  {overallAverageSeq5 !== null ? `${overallAverageSeq5} /20` : 'Non calculée'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Retards (Appel)</p>
                <p className="text-xl font-display font-bold text-slate-800 font-mono">
                  {totalLates} {totalLates > 1 ? 'retards' : 'retard'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Heures d'Absence</p>
                <p className="text-xl font-display font-bold text-slate-800 font-mono">
                  {totalAbsences * 2} h <span className="text-xs text-rose-500 font-normal">({unexcusedAbsences * 2}h non-justifiées)</span>
                </p>
              </div>
            </div>
          </div>

          {/* SVG Progression Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 font-display flex items-center space-x-2 mb-4">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Courbe d'Évolution des Moyennes (Trimestres & Séquences)</span>
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Custom SVG Line Chart */}
              <div className="w-full flex-1">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
                  {/* Grid Lines */}
                  {[8, 11, 14, 17, 20].map((level, idx) => {
                    const y = chartHeight - paddingBottom - (
                      (level - 8) / (20 - 8) * (chartHeight - paddingTop - paddingBottom)
                    );
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1.5"
                        />
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="font-mono text-[9px] fill-slate-400"
                        >
                          {level}
                        </text>
                      </g>
                    );
                  })}

                  {/* Horizontal X axis labels */}
                  {sequenceAverages.map((item, idx) => {
                    const x = xCoords[idx];
                    return (
                      <text
                        key={idx}
                        x={x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="font-display font-semibold text-[9px] fill-slate-500"
                      >
                        {item.seqName}
                      </text>
                    );
                  })}

                  {/* Filled background area under the line */}
                  <path
                    d={`M ${paddingLeft} ${chartHeight - paddingBottom} 
                        L ${getPointsString()} 
                        L ${xCoords[xCoords.length - 1]} ${chartHeight - paddingBottom} Z`}
                    fill="url(#gradient-blue)"
                    opacity="0.1"
                  />

                  {/* Connecting Line */}
                  <polyline
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getPointsString()}
                  />

                  {/* Dots with average labels */}
                  {sequenceAverages.map((item, idx) => {
                    const minScore = 8;
                    const maxScore = 20;
                    const x = xCoords[idx];
                    const y = chartHeight - paddingBottom - (
                      (item.average - minScore) / (maxScore - minScore) * (chartHeight - paddingTop - paddingBottom)
                    );
                    return (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#ffffff"
                          stroke="#2563EB"
                          strokeWidth="3"
                        />
                        <rect
                          x={x - 18}
                          y={y - 25}
                          width="36"
                          height="16"
                          rx="4"
                          fill="#0f172a"
                          className="hidden group-hover:block"
                        />
                        <text
                          x={x}
                          y={y - 14}
                          textAnchor="middle"
                          className="font-mono text-[10px] font-bold fill-blue-800"
                        >
                          {item.average}
                        </text>
                      </g>
                    );
                  })}

                  {/* Definitions */}
                  <defs>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Interpretation Box */}
              <div className="w-full md:w-56 p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between h-full space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Avis d'Appréciation
                  </h4>
                  <div className={`mt-2 p-2.5 rounded-lg border text-xs font-semibold ${appreciation.color} text-center`}>
                    {appreciation.text}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <p>• Taux de réussite de l'élève supérieur à la moyenne de classe.</p>
                  <p>• Suivi assiduité : conduite exemplaire, aucun blâme de discipline enregistré.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Details per subject card table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <span>Bulletin de Notes Courant : Séquence 5 (3e Trimestre)</span>
          </h3>
          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Exporter Bulletin (PDF)</span>
            </button>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-mono">
              Coeffs Totaux : {totalCoeffs}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-600 font-display font-semibold">
                <th className="p-4 pl-6">Code</th>
                <th className="p-4">Matière</th>
                <th className="p-4 text-center">Coefficient</th>
                <th className="p-4">Notes Obtenues</th>
                <th className="p-4 text-center">Moyenne de Matière</th>
                <th className="p-4">Appréciation Enseignant</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {subjectPerformanceSeq5.map((sp) => {
                const isPassed = sp.average !== null && sp.average >= 10;
                return (
                  <tr key={sp.subjectId} className="hover:bg-slate-50/30">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-500">{sp.code}</td>
                    <td className="p-4 font-semibold text-slate-800">{sp.subjectName}</td>
                    <td className="p-4 text-center font-mono font-medium text-slate-600">{sp.coefficient}</td>
                    <td className="p-4">
                      {sp.grades.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {sp.grades.map((g, gIdx) => (
                            <span
                              key={gIdx}
                              title={`${g.evalTitle} (${g.evalType})`}
                              className={`inline-block text-xs font-mono px-2 py-0.5 rounded ${
                                g.value !== null && g.value >= 10
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}
                            >
                              {g.value !== null ? `${g.value}/20` : '-'}
                              {g.coeff > 1 && <span className="text-[9px] text-slate-400 ml-1">x{g.coeff}</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pas de note saisie</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {sp.average !== null ? (
                        <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs border ${
                          isPassed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-100'
                        }`}>
                          {sp.average} /20
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {sp.grades.find(g => g.comment)?.comment || (sp.average !== null && sp.average >= 12 ? 'Travail satisfaisant' : sp.average !== null && sp.average >= 10 ? 'Doit s\'impliquer davantage' : sp.average !== null ? 'Insuffisant' : '-')}
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

  {/* Homework / Cahier de Textes View */}
  {portalSubTab === 'homework' && (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Total Devoirs Donnés
          </span>
          <div className="text-2xl font-display font-bold text-slate-800 mt-1">
            {studentHomeworks.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Classe : {sClass?.name}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
            Devoirs Réalisés
          </span>
          <div className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {doneHwCount}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Vérifiés par l'enseignant</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono">
            Devoirs Non Faits
          </span>
          <div className="text-2xl font-display font-bold text-rose-700 mt-1">
            {missedHwCount}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">Oublis ou non rendus</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/20">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
            Taux de Réalisation
          </span>
          <div className="text-2xl font-display font-bold text-blue-700 mt-1">
            {hwCompletionRate}%
          </div>
          <p className="text-[11px] text-blue-600/80 mt-1">Assiduité au travail</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <ListFilter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filtrer par statut :</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: `Tous (${studentHomeworks.length})` },
            { id: 'FAIT', label: `Faits (${doneHwCount})` },
            { id: 'NON_FAIT', label: `Non faits (${missedHwCount})` },
            { id: 'PENDING', label: `En attente (${pendingHwCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setHomeworkFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                homeworkFilter === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Homework Cards List */}
      {studentHomeworks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Aucun devoir programmé</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun devoir de maison ou cahier de textes n'a été saisi pour la classe {sClass?.name} pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentHomeworks
            .filter(h => {
              const sub = h.submissions?.find(s => s.studentId === student?.id);
              if (homeworkFilter === 'FAIT') return sub?.status === 'FAIT';
              if (homeworkFilter === 'NON_FAIT') return sub?.status === 'NON_FAIT';
              if (homeworkFilter === 'PENDING') return !sub || sub.status === 'PARTIEL';
              return true;
            })
            .map(h => {
              const subjectObj = SUBJECTS.find(sub => sub.id === h.subjectId);
              const sub = h.submissions?.find(s => s.studentId === student?.id);
              const isDone = sub?.status === 'FAIT';
              const isMissed = sub?.status === 'NON_FAIT';
              const isPartial = sub?.status === 'PARTIEL';
              const isPending = !sub;

              return (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        {subjectObj?.name || h.subjectId}
                      </span>
                      <h4 className="text-base font-bold text-slate-800 mt-1.5">{h.title}</h4>
                    </div>

                    {isDone && (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Fait & Rendu</span>
                      </span>
                    )}

                    {isMissed && (
                      <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Non Fait</span>
                      </span>
                    )}

                    {isPartial && (
                      <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Partiel</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        <span>À rendre</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {h.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center space-x-1 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Date limite : {new Date(h.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>

                    {sub?.comment && (
                      <span className="text-[11px] text-slate-500 italic max-w-[200px] truncate" title={sub.comment}>
                        Note prof : {sub.comment}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  )}

  {/* Attendance / Assiduité View */}
  {portalSubTab === 'attendance' && (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Total Incidents
          </span>
          <div className="text-2xl font-display font-bold text-slate-800 mt-1">
            {studentAttendanceRecords.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Année scolaire en cours</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono">
            Absences Non Justifiées
          </span>
          <div className="text-2xl font-display font-bold text-rose-700 mt-1">
            {unexcusedCount}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">Nécessite régularisation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
            Absences Justifiées
          </span>
          <div className="text-2xl font-display font-bold text-emerald-700 mt-1">
            {excusedCount}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Certificats validés</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">
            Retards Constatés
          </span>
          <div className="text-2xl font-display font-bold text-amber-700 mt-1">
            {lateCount}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-1">Entrées en retard</p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Historique d'Assiduité de l'Élève</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {studentAttendanceRecords.length} enregistrement(s)
          </span>
        </div>

        {studentAttendanceRecords.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Conduite et Assiduité Exemplaires</h4>
            <p className="text-xs text-slate-400 mt-1">
              Aucune absence ni retard n'a été enregistré pour cet élève cette année.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-600 font-display font-semibold">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Statut de Justification</th>
                  <th className="p-4">Motif / Commentaire</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {studentAttendanceRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-600">
                      {new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      {r.status === 'ABSENT' ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          Absence
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Retard
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.isExcused ? (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Justifiée</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-700 flex items-center space-x-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Non justifiée</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600 italic">
                      {r.reason || 'Aucun motif renseigné'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}
    </div>
  );
}
