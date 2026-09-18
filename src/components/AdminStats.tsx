/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolClass, Student, Evaluation, Mark, Subject, ClassSubject, AttendanceSheet, AttendanceRecord, SchoolTenant } from '../types';
import { CLASSES, STUDENTS, SUBJECTS, INITIAL_ATTENDANCE_SHEETS, INITIAL_ATTENDANCE_RECORDS, CLASS_SUBJECTS, INITIAL_SCHOOLS } from '../data/mockData';
import { 
  ShieldCheck, 
  BarChart3, 
  Lock, 
  CheckCircle, 
  FileText, 
  Printer, 
  Award, 
  Info, 
  Users, 
  ChevronRight, 
  Check, 
  X, 
  AlertTriangle, 
  CalendarDays, 
  LineChart,
  Eye,
  Download,
  Send,
  Sparkles,
  Medal,
  Scale,
  CheckCheck,
  FolderArchive,
  Archive,
  FolderDown,
  ArrowLeft
} from 'lucide-react';
import ClassPerformanceTrends from './ClassPerformanceTrends';
import SummaryWidgets from './SummaryWidgets';

interface AdminStatsProps {
  evaluations: Evaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
  marks: Mark[];
  setMarks: React.Dispatch<React.SetStateAction<Mark[]>>;
  sheets: AttendanceSheet[];
  classes?: SchoolClass[];
  students?: Student[];
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
  records: AttendanceRecord[];
  activeSchool?: SchoolTenant;
  onBack?: () => void;
}

export default function AdminStats({ 
  evaluations, 
  setEvaluations, 
  marks, 
  setMarks, 
  sheets,
  classes = CLASSES,
  students = STUDENTS,
  addAuditLog,
  records,
  activeSchool,
  onBack
}: AdminStatsProps) {
  const [adminTab, setAdminTab] = useState<'approvals' | 'bulletins' | 'deliberations' | 'attendance-stats' | 'performance-trends' | 'archives'>('approvals');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSequenceId, setSelectedSequenceId] = useState<number>(5);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [isBatchPrintMode, setIsBatchPrintMode] = useState<boolean>(false);
  const [previewEvalId, setPreviewEvalId] = useState<string | null>(null);
  const [sendingSmsToStudent, setSendingSmsToStudent] = useState<string | null>(null);
  const [isExportingBatchPDF, setIsExportingBatchPDF] = useState(false);
  const [isExportingSinglePDF, setIsExportingSinglePDF] = useState(false);
  const [isExportingAttendanceArchive, setIsExportingAttendanceArchive] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Administrative Archive PDF Exporters
  const handleExportBatchBulletinsPDF = async (targetClassId?: string, seqId?: number) => {
    const classId = targetClassId || selectedClassId;
    const currentClass = classes.find(c => c.id === classId);
    const targetSeq = seqId || selectedSequenceId;
    if (!currentClass) {
      showToast("Veuillez sélectionner une classe valide.", "error");
      return;
    }
    if (rankedReports.length === 0) {
      showToast("Aucun bulletin ou note calculée pour cette sélection.", "error");
      return;
    }
    setIsExportingBatchPDF(true);
    try {
      const { generateClassBatchReportCardsPDF } = await import('../utils/pdfGenerator');
      const schoolObj = activeSchool || INITIAL_SCHOOLS[0];
      await generateClassBatchReportCardsPDF(
        schoolObj,
        currentClass.name,
        targetSeq,
        rankedReports,
        classGeneralStats
      );
      addAuditLog?.(
        "Export Archives Bulletins PDF",
        schoolObj.id,
        `Génération officielle du recueil des bulletins de la classe ${currentClass.name} (Séquence ${targetSeq}, ${rankedReports.length} élèves) pour les archives administratives.`
      );
      showToast(`Recueil complet des bulletins de ${currentClass.name} exporté au format PDF avec succès !`, "success");
    } catch (err) {
      console.error("Erreur lors de l'exportation des bulletins:", err);
      showToast("Erreur lors de la génération du PDF des bulletins.", "error");
    } finally {
      setIsExportingBatchPDF(false);
    }
  };

  const handleExportSingleBulletinPDF = async () => {
    if (!selectedPrintData || !printClass) {
      showToast("Veuillez sélectionner un élève dans la liste d'abord.", "error");
      return;
    }
    setIsExportingSinglePDF(true);
    try {
      const { generateStudentReportCardPDF } = await import('../utils/pdfGenerator');
      const schoolObj = activeSchool || INITIAL_SCHOOLS[0];
      await generateStudentReportCardPDF(
        schoolObj,
        selectedPrintData.student,
        printClass.name,
        selectedPrintData.subjects,
        selectedPrintData.generalAverage,
        selectedSequenceId,
        selectedPrintData.totalCoefficients
      );
      addAuditLog?.(
        "Export Bulletin Individuel PDF",
        schoolObj.id,
        `Téléchargement du bulletin officiel pour l'élève ${selectedPrintData.student.lastName} ${selectedPrintData.student.firstName} (Classe ${printClass.name}, Séquence ${selectedSequenceId}).`
      );
      showToast(`Bulletin officiel de ${selectedPrintData.student.lastName} ${selectedPrintData.student.firstName} téléchargé en PDF !`, "success");
    } catch (err) {
      console.error("Erreur lors de l'exportation du bulletin individuel:", err);
      showToast("Erreur lors du téléchargement du bulletin.", "error");
    } finally {
      setIsExportingSinglePDF(false);
    }
  };

  const handleExportAttendanceArchiveForAdmin = async (targetClassId?: string) => {
    const classId = targetClassId || selectedClassId;
    const currentClass = classes.find(c => c.id === classId);
    if (!currentClass) {
      showToast("Veuillez sélectionner une classe valide.", "error");
      return;
    }
    const classSheets = sheets.filter(s => s.classId === classId);
    const classStudentsList = students.filter(s => s.classId === classId);

    if (classStudentsList.length === 0) {
      showToast(`Aucun élève trouvé dans la classe ${currentClass.name}.`, "error");
      return;
    }

    setIsExportingAttendanceArchive(true);
    try {
      const { generateClassAttendanceArchivePDF } = await import('../utils/pdfGenerator');
      const schoolObj = activeSchool || INITIAL_SCHOOLS[0];
      await generateClassAttendanceArchivePDF(
        schoolObj,
        currentClass.name,
        classSheets,
        records,
        classStudentsList,
        `Séquence ${selectedSequenceId} & Année Complète`
      );
      addAuditLog?.(
        "Export Archives Registre Appel PDF",
        schoolObj.id,
        `Export officiel du registre d'appel et d'assiduité de la classe ${currentClass.name} (${classSheets.length} fiches, ${classStudentsList.length} élèves) pour archivage administratif.`
      );
      showToast(`Registre officiel d'appel de ${currentClass.name} exporté au format PDF avec succès !`, "success");
    } catch (err) {
      console.error("Erreur lors de l'exportation du registre d'appel:", err);
      showToast("Erreur lors de l'exportation du registre d'appel en PDF.", "error");
    } finally {
      setIsExportingAttendanceArchive(false);
    }
  };

  const handleExportCompleteSchoolArchives = async () => {
    if (!printClass) return;
    showToast(`Démarrage de l'archivage complet pour ${printClass.name}...`, "info");
    await handleExportBatchBulletinsPDF();
    await handleExportAttendanceArchiveForAdmin();
    showToast(`Dossier complet d'archives administratives (Bulletins + Fiches d'appel) généré avec succès !`, "success");
  };

  // 1. Approvals handler (pending validation list)
  const pendingEvals = evaluations.filter(e => e.status === 'PENDING_VALIDATION');

  const handleApproveEvaluation = (evalId: string) => {
    const ev = evaluations.find(e => e.id === evalId);
    setEvaluations(prev => prev.map(item => {
      if (item.id === evalId) {
        return { ...item, status: 'VALIDATED' };
      }
      return item;
    }));

    if (ev) {
      const className = classes.find(c => c.id === ev.classId)?.name || 'Classe';
      const subjectName = SUBJECTS.find(s => s.id === ev.subjectId)?.name || 'Matière';
      addAuditLog?.(
        "Validation de notes",
        ev.schoolId || activeSchool?.id || '',
        `Validation et verrouillage définitif par l'administrateur de la fiche "${ev.title}" (Classe: ${className}, Matière: ${subjectName}).`
      );
    }

    showToast("L'évaluation a été validée avec succès. Elle est désormais verrouillée et disponible pour les bulletins de notes !", "success");
    if (previewEvalId === evalId) setPreviewEvalId(null);
  };

  const handleApproveAllPending = () => {
    if (pendingEvals.length === 0) return;
    setEvaluations(prev => prev.map(item => item.status === 'PENDING_VALIDATION' ? { ...item, status: 'VALIDATED' } : item));
    
    addAuditLog?.(
      "Validation de notes par lot",
      activeSchool?.id || '',
      `Validation globale de ${pendingEvals.length} fiches d'évaluation par l'administrateur d'école.`
    );
    showToast(`Les ${pendingEvals.length} évaluations ont toutes été validées et verrouillées avec succès !`, "success");
  };

  const handleRejectEvaluation = (evalId: string) => {
    const ev = evaluations.find(e => e.id === evalId);
    setEvaluations(prev => prev.map(item => {
      if (item.id === evalId) {
        return { ...item, status: 'DRAFT' };
      }
      return item;
    }));

    if (ev) {
      const className = classes.find(c => c.id === ev.classId)?.name || 'Classe';
      const subjectName = SUBJECTS.find(s => s.id === ev.subjectId)?.name || 'Matière';
      addAuditLog?.(
        "Validation de notes",
        ev.schoolId || activeSchool?.id || '',
        `Rejet et renvoi en brouillon par l'administrateur de la fiche de notes "${ev.title}" (Classe: ${className}, Matière: ${subjectName}).`
      );
    }

    showToast("L'évaluation a été renvoyée en brouillon à l'enseignant pour modification.", "info");
    if (previewEvalId === evalId) setPreviewEvalId(null);
  };

  // Handle Parent Summon SMS
  const handleSendSummonsSms = (studentName: string, parentPhone: string, hours: number) => {
    setSendingSmsToStudent(studentName);
    setTimeout(() => {
      setSendingSmsToStudent(null);
      addAuditLog?.(
        "Alerte Assiduité / SMS",
        activeSchool?.id || '',
        `Convocation envoyée par SMS au parent (${parentPhone}) pour l'élève ${studentName} (${hours}h d'absence).`
      );
      showToast(`Convocation SMS envoyée avec succès au tuteur de ${studentName} (${parentPhone}).`, "success");
    }, 700);
  };

  // 2. Attendance Stats calculations
  const classAttendanceRates = classes.map(c => {
    const classSheets = sheets.filter(s => s.classId === c.id);
    let totalAssigned = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    classSheets.forEach(sh => {
      const shRecords = records.filter(r => r.sheetId === sh.id);
      shRecords.forEach(rec => {
        totalAssigned++;
        if (rec.status === 'PRESENT') presentCount++;
        else if (rec.status === 'LATE') lateCount++;
        else if (rec.status === 'ABSENT') absentCount++;
      });
    });

    const rate = totalAssigned > 0 
      ? Number(((presentCount + lateCount) / totalAssigned * 100).toFixed(1))
      : 100.0;

    return {
      classId: c.id,
      className: c.name,
      totalSessions: classSheets.length,
      attendanceRate: rate,
      absentCount: absentCount,
      lateCount: lateCount
    };
  });

  // Top Absent Students
  const studentAbsenteeism = students.map(s => {
    const sRecords = records.filter(r => r.studentId === s.id);
    const absences = sRecords.filter(r => r.status === 'ABSENT').length;
    const lates = sRecords.filter(r => r.status === 'LATE').length;
    const sClass = classes.find(c => c.id === s.classId)?.name || '';

    return {
      id: s.id,
      name: `${s.lastName} ${s.firstName}`,
      className: sClass,
      absencesCount: absences,
      latesCount: lates
    };
  }).filter(s => s.absencesCount > 0)
    .sort((a, b) => b.absencesCount - a.absencesCount)
    .slice(0, 5);

  // 3. BULLETINS / REPORT CARDS SYSTEM
  // We need to calculate class averages, rankings, and individual performance cards for the selected class and sequence.
  const classStudents = students.filter(s => s.classId === selectedClassId);
  const rawClassSubjects = CLASS_SUBJECTS.filter(cs => cs.classId === selectedClassId);
  const classSubjects = rawClassSubjects.length > 0
    ? rawClassSubjects
    : SUBJECTS.map(s => ({
        id: `cs-${selectedClassId}-${s.id}`,
        classId: selectedClassId,
        subjectId: s.id,
        teacherId: 'teacher-1',
        coefficient: s.code === 'MATH' || s.code === 'PHYS' || s.code === 'SVT' ? 5 : 3
      }));

  // We find validated evaluations for this class & sequence
  const activeEvals = evaluations.filter(e => 
    e.classId === selectedClassId && 
    e.sequenceId === selectedSequenceId && 
    e.status === 'VALIDATED'
  );

  // Calculate averages per student
  const studentReportData = classStudents.map(student => {
    let weightedPointsTotal = 0;
    let totalCoefficients = 0;
    const subjectsGradesList: { subjectName: string; code: string; average: number | null; coefficient: number }[] = [];

    classSubjects.forEach(cs => {
      const subject = SUBJECTS.find(s => s.id === cs.subjectId) as Subject;
      if (!subject) return;
      const evals = activeEvals.filter(e => e.subjectId === cs.subjectId);
      
      let sumGrades = 0;
      let sumCoeffs = 0;

      evals.forEach(ev => {
        const mark = marks.find(m => m.evaluationId === ev.id && m.studentId === student.id);
        if (mark) {
          sumGrades += mark.value * ev.coefficient;
          sumCoeffs += ev.coefficient;
        }
      });

      const average = sumCoeffs > 0 ? Number((sumGrades / sumCoeffs).toFixed(2)) : null;

      subjectsGradesList.push({
        subjectName: subject.name,
        code: subject.code,
        average,
        coefficient: cs.coefficient
      });

      if (average !== null) {
        weightedPointsTotal += average * cs.coefficient;
        totalCoefficients += cs.coefficient;
      }
    });

    const generalAverage = totalCoefficients > 0 
      ? Number((weightedPointsTotal / totalCoefficients).toFixed(2))
      : null;

    return {
      student,
      subjects: subjectsGradesList,
      generalAverage,
      totalCoefficients,
      weightedPointsTotal
    };
  });

  // Sort by average to determine rank
  const rankedReports = studentReportData
    .filter(r => r.generalAverage !== null)
    .sort((a, b) => (b.generalAverage || 0) - (a.generalAverage || 0));

  const getRank = (studentId: string): number => {
    return rankedReports.findIndex(r => r.student.id === studentId) + 1;
  };

  // Class aggregates
  const classAveragesArray = rankedReports.map(r => r.generalAverage || 0);
  const numRanked = classAveragesArray.length;

  const classGeneralStats = {
    classAverage: numRanked > 0 ? Number((classAveragesArray.reduce((a, b) => a + b, 0) / numRanked).toFixed(2)) : 0,
    highest: numRanked > 0 ? Math.max(...classAveragesArray) : 0,
    lowest: numRanked > 0 ? Math.min(...classAveragesArray) : 0,
    successRate: numRanked > 0 ? Number((classAveragesArray.filter(a => a >= 10).length / numRanked * 100).toFixed(0)) : 0
  };

  const selectedPrintData = rankedReports.find(r => r.student.id === printStudentId);
  const printClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6" id="admin-stats-module">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {activeSchool && (
        <SummaryWidgets
          students={students}
          sheets={sheets}
          records={records}
          evaluations={evaluations}
          activeSchool={activeSchool}
        />
      )}

      {/* Admin Module Navigation Tabs */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2 max-w-full">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/80 shrink-0"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
          )}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto custom-scrollbar max-w-full">
            <button
              onClick={() => setAdminTab('approvals')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                adminTab === 'approvals'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Workflow de Validation</span>
            {pendingEvals.length > 0 && (
              <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-pulse ml-1">
                {pendingEvals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminTab('bulletins')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'bulletins'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Bulletins de Notes</span>
          </button>
          <button
            onClick={() => setAdminTab('deliberations')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'deliberations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Conseil & Délibérations</span>
          </button>
          <button
            onClick={() => setAdminTab('attendance-stats')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'attendance-stats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Rapports d'Assiduité</span>
          </button>
          <button
            onClick={() => setAdminTab('performance-trends')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'performance-trends'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            <span>Courbe de Gauss & Tendances</span>
          </button>
          <button
            onClick={() => setAdminTab('archives')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'archives'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FolderArchive className="h-3.5 w-3.5" />
            <span>Archives Administratives (PDF)</span>
          </button>
        </div>
      </div>
    </div>

      {/* MODAL: PREVIEW EVALUATION MARKS */}
      {previewEvalId && (() => {
        const ev = evaluations.find(e => e.id === previewEvalId);
        if (!ev) return null;
        const sClass = classes.find(c => c.id === ev.classId);
        const sSubject = SUBJECTS.find(sub => sub.id === ev.subjectId);
        const evalMarks = marks.filter(m => m.evaluationId === ev.id);
        const classStuds = students.filter(s => s.classId === ev.classId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
                    Audit des Notes • Séquence {ev.sequenceId}
                  </span>
                  <h3 className="text-base font-bold font-display text-slate-800 mt-1">{ev.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Classe : <strong>{sClass?.name}</strong> • Matière : <strong>{sSubject?.name}</strong> • Coefficient : <strong>{ev.coefficient}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setPreviewEvalId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2.5">Élève</th>
                      <th className="p-2.5 text-center">Note /20</th>
                      <th className="p-2.5">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStuds.map((stud) => {
                      const m = evalMarks.find(mark => mark.studentId === stud.id);
                      const noteVal = m ? m.value : null;
                      return (
                        <tr key={stud.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-semibold text-slate-800">
                            {stud.lastName} {stud.firstName}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">
                            {noteVal !== null ? (
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                noteVal >= 10 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-rose-50 text-rose-700 font-bold'
                              }`}>
                                {noteVal} / 20
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Non noté</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-500 italic text-[11px]">
                            {noteVal !== null ? (
                              noteVal >= 16 ? 'Très Bien' : noteVal >= 14 ? 'Bien' : noteVal >= 12 ? 'Assez Bien' : noteVal >= 10 ? 'Passable' : 'Insuffisant'
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Total : <strong>{evalMarks.length} / {classStuds.length} élèves notés</strong>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRejectEvaluation(ev.id)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Renvoyer en Brouillon
                  </button>
                  <button
                    onClick={() => handleApproveEvaluation(ev.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Check className="h-4 w-4" />
                    <span>Valider & Verrouiller</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {adminTab === 'approvals' && (
        /* WORKFLOW APPROVAL VIEW */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-slate-800">
                Contrôle de conformité de saisie des notes (Censeur & Proviseur)
              </h3>
              <p className="text-xs text-slate-500">
                Les notes saisies par les enseignants doivent être auditées et validées par la direction des études avant d'être publiées sur les bulletins scolaires et verrouillées à la modification.
              </p>
            </div>
            {pendingEvals.length > 0 && (
              <button
                onClick={handleApproveAllPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Valider tout le lot ({pendingEvals.length})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pendingEvals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
                <h4 className="font-display font-bold text-slate-800">Saisie des notes à jour !</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Aucune évaluation n'est actuellement en attente de validation administrative. Toutes les épreuves soumises sont auditées.
                </p>
              </div>
            ) : (
              pendingEvals.map((ev) => {
                const sClass = classes.find(c => c.id === ev.classId);
                const sSubject = SUBJECTS.find(sub => sub.id === ev.subjectId);
                const totalMarks = marks.filter(m => m.evaluationId === ev.id);
                
                // Calculate average grade of the validation candidate
                const averageVal = totalMarks.length > 0 
                  ? Number((totalMarks.reduce((acc, curr) => acc + curr.value, 0) / totalMarks.length).toFixed(2))
                  : 0;

                return (
                  <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-100 text-amber-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          Séquence {ev.sequenceId}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">• Saisie de note</span>
                      </div>
                      <h4 className="text-base font-display font-bold text-slate-800">{ev.title}</h4>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <p>Classe : <strong className="text-slate-700">{sClass?.name}</strong></p>
                        <p>Matière : <strong className="text-slate-700">{sSubject?.name}</strong></p>
                        <p>Note Moyenne : <strong className="text-blue-700 font-mono">{averageVal}/20</strong></p>
                        <p>Notes enregistrées : <strong className="text-slate-700">{totalMarks.length} copies</strong></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => setPreviewEvalId(ev.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer border border-slate-200"
                        title="Consulter les notes"
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                        <span>Aperçu</span>
                      </button>
                      <button
                        onClick={() => handleRejectEvaluation(ev.id)}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Renvoyer</span>
                      </button>
                      <button
                        onClick={() => handleApproveEvaluation(ev.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Valider</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: DELIBERATIONS & CONSEIL DE CLASSE */}
      {adminTab === 'deliberations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
                <Scale className="h-5 w-5 text-blue-600" />
                <span>Conseil de Classe & Procès-Verbal des Délibérations</span>
              </h3>
              <p className="text-xs text-slate-500">
                Synthèse officielle des performances, attribution des mentions honorifiques et décisions du jury de classe pour la Séquence {selectedSequenceId}.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-slate-500">Classe :</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const csvRows = [
                    ['Rang', 'Nom', 'Prenom', 'Genre', 'Moyenne Generale', 'Total Points', 'Total Coeffs', 'Mention Conseil', 'Decision'].join(','),
                    ...rankedReports.map((r, idx) => {
                      const avg = r.generalAverage || 0;
                      const mention = avg >= 16 ? 'Felicitations' : avg >= 14 ? 'Tableau d Honneur' : avg >= 12 ? 'Encouragements' : avg >= 10 ? 'Tableau d Honneur Simple' : avg >= 8 ? 'Avertissement Travail' : 'Blame Travail';
                      const decision = avg >= 10 ? 'Admis' : 'Conditionnel';
                      return [
                        idx + 1,
                        `"${r.student.lastName}"`,
                        `"${r.student.firstName}"`,
                        r.student.gender,
                        avg,
                        r.weightedPointsTotal,
                        r.totalCoefficients,
                        `"${mention}"`,
                        decision
                      ].join(',');
                    })
                  ];
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `PV_Conseil_${printClass?.name.replace(/\s+/g, '_')}_Seq${selectedSequenceId}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("Procès-verbal de délibération exporté au format CSV !", "success");
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Exporter PV (CSV)</span>
              </button>

              <button
                onClick={() => handleExportBatchBulletinsPDF()}
                disabled={isExportingBatchPDF}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                title="Génère le recueil officiel relié des bulletins avec PV pour les archives administratives"
              >
                <FileText className="h-4 w-4" />
                <span>{isExportingBatchPDF ? "Génération PDF..." : "Exporter Recueil Bulletins (PDF)"}</span>
              </button>
            </div>
          </div>

          {/* Deliberations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{printClass?.name || 'Classe'} — {rankedReports.length} élèves délibérés</span>
              <span className="font-mono text-blue-700">Taux de Réussite : {classGeneralStats.successRate}% • Moyenne : {classGeneralStats.classAverage}/20</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <th className="p-3 pl-4">Rang</th>
                    <th className="p-3">Élève</th>
                    <th className="p-3 text-center">Genre</th>
                    <th className="p-3 text-center">Total Coeffs</th>
                    <th className="p-3 text-center">Points</th>
                    <th className="p-3 text-center">Moyenne /20</th>
                    <th className="p-3">Distinction / Mention</th>
                    <th className="p-3 text-center">Décision Jury</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rankedReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Aucune note validée pour cette séquence. Validez d'abord les évaluations.
                      </td>
                    </tr>
                  ) : (
                    rankedReports.map((report, idx) => {
                      const avg = report.generalAverage || 0;
                      const isPassed = avg >= 10;
                      const mention = avg >= 16 ? 'Félicitations du Conseil' : avg >= 14 ? 'Tableau d\'Honneur & Encouragements' : avg >= 12 ? 'Encouragements' : avg >= 10 ? 'Tableau d\'Honneur' : avg >= 8 ? 'Avertissement Travail' : 'Blâme Travail';
                      
                      return (
                        <tr key={report.student.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 font-extrabold border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-850">
                            {report.student.lastName} {report.student.firstName}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-mono">{report.student.gender}</td>
                          <td className="p-3 text-center font-mono text-slate-600">{report.totalCoefficients}</td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-700">{report.weightedPointsTotal}</td>
                          <td className="p-3 text-center font-mono font-bold text-sm">
                            <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                              {avg}/20
                            </span>
                          </td>
                          <td className="p-3 text-[11px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center space-x-1 ${
                              avg >= 14 ? 'bg-amber-100 text-amber-800' :
                              avg >= 10 ? 'bg-blue-100 text-blue-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {avg >= 14 && <Sparkles className="h-3 w-3 inline mr-1" />}
                              <span>{mention}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono ${
                              isPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isPassed ? 'PROMU / ADMIS' : 'CONDITIONNEL'}
                            </span>
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

      {adminTab === 'bulletins' && (
        /* BULLETIN / TRANSCRIPT BOARD */
        <div className="space-y-6">
          {/* Class and sequence selectors */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-display font-bold text-slate-800">
                  Générateur & Éditeur de Bulletins de Notes
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisez, contrôlez les classements et imprimez les bulletins individuels ou de toute la classe en un clic.
                </p>
              </div>

              <div className="flex items-center space-x-4 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Classe :</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setPrintStudentId(null); }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Séquence :</label>
                  <select
                    value={selectedSequenceId}
                    onChange={(e) => { setSelectedSequenceId(Number(e.target.value)); setPrintStudentId(null); }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>Séquence {num}</option>
                    ))}
                  </select>
                </div>

                {rankedReports.length > 0 && (
                  <>
                    <button
                      onClick={() => handleExportBatchBulletinsPDF()}
                      disabled={isExportingBatchPDF}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      title="Génère le recueil officiel relié de tous les bulletins de la classe pour les archives administratives"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{isExportingBatchPDF ? "Génération PDF..." : "Exporter Recueil Bulletins (PDF)"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsBatchPrintMode(!isBatchPrintMode);
                        if (!isBatchPrintMode) {
                          showToast(`Mode impression globale activé pour les ${rankedReports.length} bulletins de la classe !`, "info");
                        }
                      }}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer ${
                        isBatchPrintMode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Printer className="h-4 w-4" />
                      <span>{isBatchPrintMode ? "Vue Individuelle" : `Imprimer toute la classe (${rankedReports.length})`}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {isBatchPrintMode ? (
            /* BATCH PRINT MODE: ALL BULLETINS */
            <div className="space-y-8 print:space-y-0">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between print:hidden">
                <div className="flex items-center space-x-2 text-xs text-blue-800">
                  <Printer className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    Prêt pour impression : <strong>{rankedReports.length} bulletins</strong> prêts pour la classe <strong>{printClass?.name}</strong> (Séquence {selectedSequenceId}).
                  </span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Lancer l'impression PDF</span>
                </button>
              </div>

              {rankedReports.map((rep, idx) => (
                <div key={rep.student.id} className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden border-t-8 border-t-blue-700 print:shadow-none print:border-none print:break-after-page">
                  {/* Cameroonian National Header */}
                  <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-display font-semibold uppercase text-slate-500 border-b border-slate-200 pb-4 text-center">
                    <div className="border-r border-slate-100 pr-2">
                      <p className="text-slate-800 font-bold">RÉPUBLIQUE DU CAMEROUN</p>
                      <p className="font-mono text-[7px] italic text-slate-400">Paix - Travail - Patrie</p>
                      <p className="mt-1">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</p>
                      <p>DÉLÉGATION RÉGIONALE DE L'ÉDUCATION</p>
                    </div>
                    <div className="pl-2">
                      <p className="text-slate-800 font-bold">REPUBLIC OF CAMEROON</p>
                      <p className="font-mono text-[7px] italic text-slate-400">Peace - Work - Fatherland</p>
                      <p className="mt-1">MINISTRY OF SECONDARY EDUCATION</p>
                      <p className="font-bold text-blue-800">{activeSchool?.name?.toUpperCase() || 'ÉTABLISSEMENT SCOLAIRE'}</p>
                    </div>
                  </div>

                  {/* Bulletin identity */}
                  <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-display font-bold text-slate-850 text-sm tracking-wider uppercase">
                      BULLETIN DE NOTES SÉQUENTIEL
                    </h4>
                    <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                      SÉQUENCE {selectedSequenceId} • TRIMESTRE {selectedSequenceId <= 2 ? '1' : selectedSequenceId <= 4 ? '2' : '3'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Année Scolaire : {activeSchool?.activeSchoolYear || '2025 - 2026'}</p>
                  </div>

                  {/* Student details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="space-y-1">
                      <p>Élève : <strong className="text-slate-850 text-sm font-display font-bold">{rep.student.lastName} {rep.student.firstName}</strong></p>
                      <p>Classe : <strong className="text-slate-700">{printClass?.name}</strong></p>
                      <p>Genre : <strong className="text-slate-700">{rep.student.gender}</strong></p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p>Rang Séquentiel : <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">#{idx + 1} sur {numRanked}</span></p>
                      <p>Moyenne Générale : <strong className="text-blue-800 font-mono font-bold text-sm">{rep.generalAverage}/20</strong></p>
                      <p>Total Coefficients : <strong className="text-slate-700 font-mono">{rep.totalCoefficients}</strong></p>
                    </div>
                  </div>

                  {/* Subject table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-display font-bold text-[10px]">
                          <th className="p-2.5 pl-4">Matières</th>
                          <th className="p-2.5 text-center">Coeff</th>
                          <th className="p-2.5 text-center">Moyenne /20</th>
                          <th className="p-2.5 text-center">Points Coeff.</th>
                          <th className="p-2.5">Appréciation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rep.subjects.map((sub, sIdx) => {
                          const weighted = sub.average !== null ? Number((sub.average * sub.coefficient).toFixed(2)) : null;
                          return (
                            <tr key={sIdx} className="hover:bg-slate-50/40">
                              <td className="p-2.5 pl-4 font-semibold text-slate-800">{sub.subjectName}</td>
                              <td className="p-2.5 text-center font-mono font-medium text-slate-500">{sub.coefficient}</td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                {sub.average !== null ? `${sub.average}` : '-'}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-500">
                                {weighted !== null ? weighted : '-'}
                              </td>
                              <td className="p-2.5 text-[11px] italic text-slate-500">
                                {sub.average !== null && sub.average >= 16 
                                  ? 'Excellent' 
                                  : sub.average !== null && sub.average >= 14 
                                  ? 'Très satisfaisant' 
                                  : sub.average !== null && sub.average >= 12 
                                  ? 'Satisfaisant' 
                                  : sub.average !== null && sub.average >= 10 
                                  ? 'Passable' 
                                  : sub.average !== null 
                                  ? 'Insuffisant' 
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Stamp signatures */}
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 font-display font-medium pt-4 border-t border-slate-100">
                    <div>
                      <p className="italic">Le {new Date().toLocaleDateString('fr-FR')}</p>
                      <p className="font-bold text-slate-700 mt-1">Le Titulaire de Classe</p>
                      <div className="h-8"></div>
                      <p className="text-[9px] text-slate-400">(Signature certifiée)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">Le Chef d'Établissement (Censeur)</p>
                      <div className="h-8 flex justify-end items-center">
                        <div className="h-7 w-24 border border-dashed border-blue-400 text-blue-500 font-mono text-[6px] p-0.5 text-center rounded flex flex-col justify-center select-none rotate-2 opacity-80">
                          <p className="font-bold uppercase leading-tight">{activeSchool?.name || 'LYCÉE'}</p>
                          <p className="uppercase leading-tight">VISA ACADÉMIQUE</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400">Cachet officiel</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* List of ranks (left side) */}
            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 self-start">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider">
                  Classement Général
                </h4>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded-full">
                  Seq {selectedSequenceId}
                </span>
              </div>

              {rankedReports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                  <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold">Aucune note validée pour cette période</p>
                  <p className="text-[11px] text-slate-400">Le censeur doit d'abord valider les épreuves dans l'onglet "Workflow de Validation".</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {rankedReports.map((report, rIdx) => {
                    const isTop = rIdx < 3;
                    const isPassed = report.generalAverage !== null && report.generalAverage >= 10;
                    
                    return (
                      <button
                        key={report.student.id}
                        onClick={() => setPrintStudentId(report.student.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          printStudentId === report.student.id
                            ? 'bg-blue-50 border-blue-400'
                            : 'bg-slate-50 border-transparent hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className={`h-6 w-6 rounded-full font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            rIdx === 0 
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm'
                              : rIdx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : rIdx === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {rIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-850 text-xs truncate">
                              {report.student.lastName} {report.student.firstName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Moy. Gén : <strong className="font-mono">{report.generalAverage}/20</strong>
                            </p>
                          </div>
                        </div>

                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${
                          printStudentId === report.student.id ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Individual Bulletin Preview Sheet (right side) */}
            <div className="xl:col-span-7">
              {!printStudentId || !selectedPrintData ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
                  <Printer className="h-14 w-14 text-slate-300 stroke-[1.5] mb-4" />
                  <h3 className="text-base font-display font-bold text-slate-800">Visualisation de Bulletin Scolaire</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Sélectionnez un élève dans le classement général de gauche pour générer sa fiche d'évaluation officielle certifiée par {activeSchool?.name || 'l\'Établissement'}.
                  </p>
                </div>
              ) : (
                /* OFFICIAL BULLETIN FORMAT SHEET */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px] border-t-8 border-t-blue-700 print:shadow-none print:border-none">
                  {/* Official watermark security seal */}
                  <div className="absolute right-10 top-24 opacity-5 pointer-events-none transform rotate-12">
                    <ShieldCheck className="h-44 w-44 text-blue-800" />
                  </div>

                  {/* Cameroonian National Header */}
                  <div className="grid grid-cols-2 text-[8px] sm:text-[9px] font-display font-semibold uppercase text-slate-500 border-b border-slate-200 pb-4 text-center">
                    <div className="border-r border-slate-100 pr-2">
                      <p className="text-slate-800 font-bold">RÉPUBLIQUE DU CAMEROUN</p>
                      <p className="font-mono text-[7px] italic text-slate-400">Paix - Travail - Patrie</p>
                      <p className="mt-1">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</p>
                      <p>DÉLÉGATION RÉGIONALE DE L'ÉDUCATION</p>
                    </div>
                    <div className="pl-2">
                      <p className="text-slate-800 font-bold">REPUBLIC OF CAMEROON</p>
                      <p className="font-mono text-[7px] italic text-slate-400">Peace - Work - Fatherland</p>
                      <p className="mt-1">MINISTRY OF SECONDARY EDUCATION</p>
                      <p className="font-bold text-blue-800">{activeSchool?.name?.toUpperCase() || 'ÉTABLISSEMENT SCOLAIRE'}</p>
                    </div>
                  </div>

                  {/* Bulletin identity */}
                  <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-display font-bold text-slate-850 text-sm tracking-wider uppercase">
                      BULLETIN DE NOTES SÉQUENTIEL
                    </h4>
                    <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                      SÉQUENCE {selectedSequenceId} • TRIMESTRE {selectedSequenceId <= 2 ? '1' : selectedSequenceId <= 4 ? '2' : '3'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Année Scolaire : {activeSchool?.activeSchoolYear || '2025 - 2026'}</p>
                  </div>

                  {/* Student details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="space-y-1">
                      <p>Élève : <strong className="text-slate-850 text-sm font-display font-bold">{selectedPrintData.student.lastName} {selectedPrintData.student.firstName}</strong></p>
                      <p>Classe : <strong className="text-slate-700">{printClass?.name}</strong></p>
                      <p>Genre : <strong className="text-slate-700">{selectedPrintData.student.gender}</strong></p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p>Rang Séquentiel : <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">#{getRank(selectedPrintData.student.id)} sur {numRanked}</span></p>
                      <p>Moyenne Générale : <strong className="text-blue-800 font-mono font-bold text-sm">{selectedPrintData.generalAverage}/20</strong></p>
                      <p>Total Coefficients : <strong className="text-slate-700 font-mono">{selectedPrintData.totalCoefficients}</strong></p>
                    </div>
                  </div>

                  {/* Subject and score report table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-display font-bold text-[10px]">
                          <th className="p-2.5 pl-4">Matières</th>
                          <th className="p-2.5 text-center">Coeff</th>
                          <th className="p-2.5 text-center">Moyenne /20</th>
                          <th className="p-2.5 text-center">Points Coeff.</th>
                          <th className="p-2.5">Appréciations & Mentions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPrintData.subjects.map((sub, sIdx) => {
                          const weighted = sub.average !== null ? Number((sub.average * sub.coefficient).toFixed(2)) : null;
                          const isPassed = sub.average !== null && sub.average >= 10;
                          
                          return (
                            <tr key={sIdx} className="hover:bg-slate-50/40">
                              <td className="p-2.5 pl-4 font-semibold text-slate-800">{sub.subjectName}</td>
                              <td className="p-2.5 text-center font-mono font-medium text-slate-500">{sub.coefficient}</td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                {sub.average !== null ? `${sub.average}` : '-'}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-500">
                                {weighted !== null ? weighted : '-'}
                              </td>
                              <td className="p-2.5 text-[11px] italic text-slate-500">
                                {sub.average !== null && sub.average >= 16 
                                  ? 'Excellent' 
                                  : sub.average !== null && sub.average >= 14 
                                  ? 'Très satisfaisant' 
                                  : sub.average !== null && sub.average >= 12 
                                  ? 'Satisfaisant' 
                                  : sub.average !== null && sub.average >= 10 
                                  ? 'Passable' 
                                  : sub.average !== null 
                                  ? 'Insuffisant' 
                                  : 'Aucune épreuve validée'
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer on Class statistics */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Moyenne Classe</p>
                      <p className="text-xs font-bold font-mono text-slate-700 mt-0.5">{classGeneralStats.classAverage}/20</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Note Maximale</p>
                      <p className="text-xs font-bold font-mono text-slate-700 mt-0.5">{classGeneralStats.highest}/20</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Note Minimale</p>
                      <p className="text-xs font-bold font-mono text-slate-700 mt-0.5">{classGeneralStats.lowest}/20</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono">Taux de Réussite</p>
                      <p className="text-xs font-bold font-mono text-emerald-700 mt-0.5">{classGeneralStats.successRate}%</p>
                    </div>
                  </div>

                  {/* Board and Stamp signatures block */}
                  <div className="grid grid-cols-2 text-[10px] text-slate-500 font-display font-medium pt-4 border-t border-slate-100">
                    <div>
                      <p className="italic">Yaoundé, le {new Date().toLocaleDateString('fr-FR')}</p>
                      <p className="font-bold text-slate-700 mt-1">Le Titulaire de Classe</p>
                      <div className="h-12"></div>
                      <p className="text-[9px] text-slate-400">(Signature électronique certifiée)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-700">Le Chef d'Établissement (Censeur)</p>
                      <div className="h-12 flex justify-end items-center">
                        <div className="h-10 w-28 border border-dashed border-blue-400 text-blue-500 font-mono text-[7px] p-1 text-center rounded flex flex-col justify-center select-none rotate-3 opacity-80">
                          <p className="font-bold uppercase leading-tight">{activeSchool?.name || 'LYCÉE'}</p>
                          <p className="uppercase leading-tight">VISA ACADÉMIQUE</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400">Cachet de l'Académie</p>
                    </div>
                  </div>

                  {/* Print & PDF Button actions */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5 print:hidden">
                    <button
                      onClick={handleExportSingleBulletinPDF}
                      disabled={isExportingSinglePDF}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>{isExportingSinglePDF ? "Téléchargement..." : "Télécharger Bulletin PDF"}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {adminTab === 'attendance-stats' && (
        /* ATTENDANCE GLOBAL METRICS */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-display font-bold text-slate-800">
              Statistiques d'Assiduité des Classes (Trimestriel)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Vue analytique consolidant les appels de présence afin de détecter le décrochage scolaire et d'éditer des alertes d'absences injustifiées.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Class attendance bars (left column) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 pb-3 flex items-center space-x-1.5">
                <Users className="h-4.5 w-4.5 text-blue-500" />
                <span>Taux de Présence par Classe</span>
              </h4>

              <div className="space-y-4">
                {classAttendanceRates.map((cRate) => (
                  <div key={cRate.classId} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-slate-800 font-display font-bold">{cRate.className}</strong>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {cRate.attendanceRate}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cRate.attendanceRate}%` }}
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                      <p>Heures de cours évaluées : <strong className="text-slate-600">{cRate.totalSessions * 2}h</strong></p>
                      <p>Retards cumulés : <strong className="text-amber-600">{cRate.lateCount}</strong></p>
                      <p>Absences cumulées : <strong className="text-rose-600">{cRate.absentCount}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Absent students list (right column) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 pb-3 flex items-center space-x-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                <span>Alertes Décrochage (Élèves les plus absents)</span>
              </h4>

              {studentAbsenteeism.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Aucune absence enregistrée pour l'instant.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentAbsenteeism.map((s, idx) => {
                    const parentPhone = "+237 699 82 14 0" + idx;
                    const isSending = sendingSmsToStudent === s.name;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Classe : {s.className} • Tuteur : {parentPhone}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block bg-rose-100 text-rose-800 font-mono font-bold px-2.5 py-0.5 rounded-lg text-[11px]">
                              {s.absencesCount * 2} heures
                            </span>
                            <p className="text-[9px] text-slate-400 mt-0.5">({s.latesCount} retards)</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-rose-100/60 flex justify-end">
                          <button
                            onClick={() => handleSendSummonsSms(s.name, parentPhone, s.absencesCount * 2)}
                            disabled={isSending}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="h-3 w-3" />
                            <span>{isSending ? "Envoi du SMS..." : "Envoyer Convocation SMS"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[10px] text-amber-800 leading-relaxed flex items-start space-x-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Les tuteurs des élèves cumulant plus de 10 heures d'absence unexcused reçoivent une convocation d'alerte automatisée par SMS.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'performance-trends' && (
        <ClassPerformanceTrends
          evaluations={evaluations}
          marks={marks}
          classes={classes}
          students={students}
        />
      )}

      {adminTab === 'archives' && (
        /* OFFICIAL ADMINISTRATIVE ARCHIVES & PDF EXPORT HUB */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
              <FolderArchive className="h-64 w-64 text-white" />
            </div>

            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-mono text-blue-200 uppercase tracking-wider">
                <Archive className="h-3.5 w-3.5" />
                <span>Archives Administratives & Légales Certifiées</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold">
                Dossiers d'Archivage Officiels (PDF)
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                Exportez en un clic les liasses réglementaires de l'établissement : recueils complets des bulletins de notes aux normes MINESEC et registres d'assiduité avec procès-verbaux de contrôle et visas de direction.
              </p>
            </div>
          </div>

          {/* Class & Period Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-slate-500">Classe cible :</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-slate-500">Période / Séquence :</label>
                <select
                  value={selectedSequenceId}
                  onChange={(e) => setSelectedSequenceId(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>Séquence {num}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportCompleteSchoolArchives}
              disabled={isExportingBatchPDF || isExportingAttendanceArchive}
              className="bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer shrink-0"
              title="Génère simultanément le recueil complet des bulletins et le registre d'appel de la classe"
            >
              <FolderDown className="h-4 w-4" />
              <span>Pack d'Archivage Complet (Bulletins + Appel)</span>
            </button>
          </div>

          {/* Quick Stats Summary for Selected Class */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Effectif Classe</p>
              <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">{classStudents.length} élèves</p>
              <p className="text-[10px] text-slate-400 mt-1">{rankedReports.length} bulletins calculés</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Moyenne Générale</p>
              <p className="text-lg font-bold font-mono text-blue-700 mt-0.5">{classGeneralStats.classAverage}/20</p>
              <p className="text-[10px] text-slate-400 mt-1">Taux réussite : {classGeneralStats.successRate}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Séances d'Appel</p>
              <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                {sheets.filter(s => s.classId === selectedClassId).length} fiches
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Enregistrées dans l'historique</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-[10px] font-mono uppercase text-slate-400 font-bold">Statut Archivage</p>
              <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">Prêt à l'export</p>
              <p className="text-[10px] text-slate-400 mt-1">Conforme MINESEC</p>
            </div>
          </div>

          {/* Dual Archive Dossiers Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: BULLETINS ARCHIVE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6 hover:border-blue-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">
                    Recueil Multi-Pages PDF
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-display font-bold text-slate-850">
                    Recueil Officiel des Bulletins de Notes
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Dossier académique certifié pour les archives de l'inspection et de la direction d'établissement :
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Page de garde & Procès-Verbal officiel :</strong> tableau récapitulatif des classements, moyennes, taux de succès et mentions.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Bulletins séquentiels complets :</strong> un bulletin distinct par page pour chaque élève ({rankedReports.length} élèves).</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Visas & Cachets réglementaires :</strong> signatures préformatées pour le Titulaire et le Chef d'Établissement.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Pagination officielle :</strong> numérotation continue « Page X sur Y » pour conservation légale.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-mono">
                  {printClass?.name} • Séquence {selectedSequenceId}
                </div>
                <button
                  onClick={() => handleExportBatchBulletinsPDF()}
                  disabled={isExportingBatchPDF || rankedReports.length === 0}
                  className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingBatchPDF ? "Génération du Recueil..." : "Exporter Recueil Bulletins (PDF)"}</span>
                </button>
              </div>
            </div>

            {/* CARD 2: ATTENDANCE ARCHIVE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6 hover:border-teal-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                    <FolderArchive className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full uppercase">
                    Registre Légal d'Assiduité
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-display font-bold text-slate-850">
                    Registre Complet d'Appel & Présences
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Dossier d'émargement réglementaire pour la Surveillance Générale et la Vie Scolaire :
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Page de garde & Bilan de surveillance :</strong> synthèse statistique d'assiduité, volume horaire dispensé et taux global.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Bilan cumulé nominatif par élève :</strong> heures d'absence justifiées/injustifiées, retards et taux individuel de présence.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Journal chronologique des séances :</strong> historique de toutes les fiches d'appel avec dates, créneaux et matières.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Visas officiels :</strong> signatures du Surveillant Général et du Chef d'Établissement.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-mono">
                  {printClass?.name} • {sheets.filter(s => s.classId === selectedClassId).length} séances
                </div>
                <button
                  onClick={() => handleExportAttendanceArchiveForAdmin()}
                  disabled={isExportingAttendanceArchive}
                  className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExportingAttendanceArchive ? "Génération du Registre..." : "Exporter Registre d'Appel (PDF)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
