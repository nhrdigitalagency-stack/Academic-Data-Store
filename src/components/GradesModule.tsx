/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolClass, Student, Evaluation, Mark, EvaluationType, ValidationStatus, Subject, SchoolTenant } from '../types';
import { CLASSES, STUDENTS, SUBJECTS, INITIAL_EVALUATIONS, INITIAL_MARKS, SEQUENCES, CLASS_SUBJECTS } from '../data/mockData';
import { FileText, Plus, Search, Calendar, Save, Percent, ChevronRight, Lock, Unlock, AlertCircle, Info, CheckCircle, BarChart3, TrendingUp, Award, Download, Sparkles, ArrowLeft, Trash2, X, Users } from 'lucide-react';
import { generateClassRankingPDF } from '../utils/pdfGenerator';
import { formatCycleLevel } from '../utils/cycleUtils';

interface GradesModuleProps {
  evaluations: Evaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<Evaluation[]>>;
  marks: Mark[];
  setMarks: React.Dispatch<React.SetStateAction<Mark[]>>;
  selectedEvalId?: string | null;
  onSelectEval?: (id: string | null) => void;
  classes?: SchoolClass[];
  students?: Student[];
  activeSchoolId?: string;
  activeSchool?: SchoolTenant;
  initialSelectedClassId?: string;
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
  onBack?: () => void;
}

export default function GradesModule({ 
  evaluations, 
  setEvaluations, 
  marks, 
  setMarks,
  selectedEvalId: propSelectedEvalId,
  onSelectEval,
  classes = CLASSES,
  students = STUDENTS,
  activeSchoolId = '',
  activeSchool,
  initialSelectedClassId,
  addAuditLog,
  onBack
}: GradesModuleProps) {
  const [activeTab, setActiveTab] = useState<'ranking' | 'entry' | 'list'>('ranking');
  const [localSelectedEvalId, setLocalSelectedEvalId] = useState<string | null>(evaluations[0]?.id || null);
  const selectedEvalId = propSelectedEvalId !== undefined ? propSelectedEvalId : localSelectedEvalId;
  const setSelectedEvalId = onSelectEval !== undefined ? onSelectEval : setLocalSelectedEvalId;

  // Palmarès & Classement par Rang (Audio 2 & Handwritten Note)
  const [rankingClassId, setRankingClassId] = useState<string>(initialSelectedClassId || classes[0]?.id || '');
  const [rankingSubjectId, setRankingSubjectId] = useState<string>(SUBJECTS[0]?.id || 'subj-math');
  const [rankingSequenceId, setRankingSequenceId] = useState<number>(5);
  const [rankingSearchQuery, setRankingSearchQuery] = useState<string>('');

  // Keep rankingClassId synced if initialSelectedClassId changes or classes update
  React.useEffect(() => {
    if (initialSelectedClassId) {
      setRankingClassId(initialSelectedClassId);
      setActiveTab('ranking');
    } else if (!rankingClassId && classes.length > 0) {
      setRankingClassId(classes[0].id);
    }
  }, [initialSelectedClassId, classes]);

  // Creating a new evaluation form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState(classes[0]?.id || '');
  const [newSubject, setNewSubject] = useState(SUBJECTS[0]?.id || 'subj-math');
  const [newType, setNewType] = useState<EvaluationType>('CONTROLE');
  const [newCoeff, setNewCoeff] = useState<number>(1);
  const [newSequence, setNewSequence] = useState<number>(5);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // List Tab filters
  const [listFilterClass, setListFilterClass] = useState<string>('ALL');
  const [listSearchQuery, setListSearchQuery] = useState<string>('');

  // Form input holding temporary grades
  const [tempMarks, setTempMarks] = useState<Record<string, { value: string; comment: string }>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Error notifications for validations
  const [validationError, setValidationError] = useState<string | null>(null);

  // In-app Toast alert state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Automatically select first evaluation if none is selected and tab is entry
  React.useEffect(() => {
    if (activeTab === 'entry' && !selectedEvalId && evaluations.length > 0) {
      setSelectedEvalId(evaluations[0].id);
    }
  }, [activeTab, selectedEvalId, evaluations, setSelectedEvalId]);

  // Load marks when active evaluation changes
  React.useEffect(() => {
    if (selectedEvalId) {
      const activeEval = evaluations.find(e => e.id === selectedEvalId);
      if (activeEval) {
        const classStudents = students.filter(s => s.classId === activeEval.classId);
        const marksDict: Record<string, { value: string; comment: string }> = {};
        
        classStudents.forEach(s => {
          const foundMark = marks.find(m => m.evaluationId === selectedEvalId && m.studentId === s.id);
          marksDict[s.id] = {
            value: foundMark !== undefined ? foundMark.value.toString() : '',
            comment: foundMark?.comment || ''
          };
        });
        setTempMarks(marksDict);
        setValidationError(null);
      }
    } else {
      setTempMarks({});
    }
  }, [selectedEvalId, evaluations, marks, students]);

  // Create Evaluation handler
  const handleCreateEvaluation = () => {
    const targetClass = classes.find(c => c.id === newClass) || classes[0];
    const targetClassId = targetClass?.id || newClass;
    const targetSubject = SUBJECTS.find(s => s.id === newSubject) || SUBJECTS[0];
    const targetSubjectId = targetSubject?.id || newSubject;

    const typeLabel = newType === 'CONTROLE' ? 'Contrôle Continu' : newType === 'DEVOIR' ? 'Devoir Harmonisé' : 'Examen Trimestriel';
    const finalTitle = newTitle.trim() || `${typeLabel} - ${targetSubject.name} (Seq ${newSequence})`;

    const newEvalId = `eval-custom-${Date.now()}`;
    const newEval: Evaluation = {
      id: newEvalId,
      classId: targetClassId,
      subjectId: targetSubjectId,
      teacherId: 'teach-1', // Mock teacher
      sequenceId: newSequence,
      termId: newSequence <= 2 ? 1 : newSequence <= 4 ? 2 : 3,
      type: newType,
      coefficient: newCoeff,
      date: newDate,
      status: 'DRAFT',
      title: finalTitle,
      schoolId: activeSchoolId || activeSchool?.id || 'asi-gabon'
    };

    setEvaluations(prev => [newEval, ...prev]);
    setSelectedEvalId(newEvalId);
    setShowCreateModal(false);
    setShowCreateForm(false);
    setNewTitle('');
    setActiveTab('entry');

    addAuditLog?.(
      "Création fiche de notes",
      activeSchoolId || activeSchool?.id || 'asi-gabon',
      `Création de la fiche d'évaluation "${finalTitle}" (Type: ${newType}, Coeff: ${newCoeff}) en ${targetSubject.name} pour la classe ${targetClass?.name}.`
    );

    showToast(`Évaluation "${finalTitle}" créée avec succès ! La grille de saisie est prête.`, "success");
  };

  // Delete Evaluation
  const handleDeleteEvaluation = (evalId: string) => {
    const target = evaluations.find(e => e.id === evalId);
    if (!target) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'évaluation "${target.title}" ? Toutes les notes associées seront effacées.`)) {
      return;
    }

    setEvaluations(prev => prev.filter(e => e.id !== evalId));
    setMarks(prev => prev.filter(m => m.evaluationId !== evalId));
    if (selectedEvalId === evalId) {
      const remaining = evaluations.filter(e => e.id !== evalId);
      setSelectedEvalId(remaining.length > 0 ? remaining[0].id : null);
    }
    showToast("Évaluation supprimée avec succès.", "info");
  };

  // Grade update values change handler with numerical protection
  const handleGradeChange = (studentId: string, val: string) => {
    // Basic numeric check
    if (val !== '' && isNaN(Number(val))) return;
    
    // Check constraints [0, 20]
    const num = Number(val);
    if (val !== '' && (num < 0 || num > 20)) {
      setValidationError("Alerte : Une note scolaire doit se situer obligatoirement entre 0 et 20.");
    } else {
      setValidationError(null);
    }

    setTempMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        value: val
      }
    }));
  };

  const handleCommentChange = (studentId: string, text: string) => {
    setTempMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment: text
      }
    }));
  };

  // Save changes
  const handleSaveMarks = () => {
    if (!selectedEvalId) return;

    // Validate all notes are valid numbers between 0 and 20
    let hasError = false;
    Object.keys(tempMarks).forEach((studentId) => {
      const data = tempMarks[studentId];
      if (data.value !== '') {
        const num = Number(data.value);
        if (num < 0 || num > 20 || isNaN(num)) {
          hasError = true;
        }
      }
    });

    if (hasError) {
      setValidationError("Action bloquée : Certaines notes saisies possèdent des valeurs invalides (Hors de l'intervalle [0, 20]).");
      return;
    }

    // Save back to parent state
    setMarks(prev => {
      // Remove previous marks
      const filtered = prev.filter(m => m.evaluationId !== selectedEvalId);
      
      // Map dictionary back to list
      const updated: Mark[] = Object.keys(tempMarks)
        .filter(studentId => tempMarks[studentId].value !== '')
        .map(studentId => {
          const data = tempMarks[studentId];
          return {
            id: `m-${selectedEvalId}-${studentId}`,
            evaluationId: selectedEvalId,
            studentId,
            value: Number(data.value),
            comment: data.comment
          };
        });

      return [...filtered, ...updated];
    });

    const activeEvalObj = evaluations.find(e => e.id === selectedEvalId);
    if (activeEvalObj) {
      const className = classes.find(c => c.id === activeEvalObj.classId)?.name || 'Classe';
      addAuditLog?.(
        "Saisie de notes",
        activeEvalObj.schoolId || activeSchoolId,
        `Enregistrement ou modification des notes de l'évaluation "${activeEvalObj.title}" pour la classe ${className}.`
      );
    }

    setValidationError(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Trigger Validation request workflow
  const handleRequestValidation = () => {
    if (!selectedEvalId) return;
    
    // Save first
    handleSaveMarks();

    const ev = evaluations.find(e => e.id === selectedEvalId);
    setEvaluations(prev => prev.map(item => {
      if (item.id === selectedEvalId) {
        return { ...item, status: 'PENDING_VALIDATION' };
      }
      return item;
    }));

    if (ev) {
      const className = classes.find(c => c.id === ev.classId)?.name || 'Classe';
      addAuditLog?.(
        "Soumission de notes",
        ev.schoolId || activeSchoolId,
        `Soumission pour validation de la fiche d'évaluation "${ev.title}" (Classe: ${className}) au Censeur.`
      );
    }

    showToast("Fiche soumise pour validation ! Le statut passe à 'En attente de validation'. Les notes sont transmises au Censeur.", "info");
  };

  // Details for currently selected evaluation
  const activeEval = evaluations.find(e => e.id === selectedEvalId);
  const activeClass = classes.find(c => c.id === activeEval?.classId);
  const activeSubject = SUBJECTS.find(s => s.id === activeEval?.subjectId);
  const isLocked = activeEval?.status === 'VALIDATED';

  // Calculate stats on the fly based on current input values
  const currentGradesArray = Object.keys(tempMarks)
    .map(studentId => {
      const m = tempMarks[studentId];
      return m.value !== '' ? Number(m.value) : null;
    })
    .filter((v): v is number => v !== null);

  const numGradesEntered = currentGradesArray.length;
  const numStudentsInClass = activeClass?.studentCount || 0;
  
  const classStats = {
    average: numGradesEntered > 0 ? Number((currentGradesArray.reduce((a, b) => a + b, 0) / numGradesEntered).toFixed(2)) : 0,
    highest: numGradesEntered > 0 ? Math.max(...currentGradesArray) : 0,
    lowest: numGradesEntered > 0 ? Math.min(...currentGradesArray) : 0,
    passCount: currentGradesArray.filter(v => v >= 10).length
  };

  const classSuccessRate = numGradesEntered > 0 
    ? Number((classStats.passCount / numGradesEntered * 100).toFixed(0))
    : 0;

  return (
    <div className="space-y-6" id="grades-module">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub tabs header controls */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {activeTab !== 'ranking' ? (
            <button
              onClick={() => setActiveTab('ranking')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/80"
              title="Retour au Palmarès"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour Palmarès</span>
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/80"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
          ) : null}

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Palmarès & Rang</span>
            </button>
            <button
              onClick={() => { setActiveTab('entry'); setShowCreateForm(false); }}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'entry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Saisie d'un Devoir</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Liste des Évaluations</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une Évaluation</span>
        </button>
      </div>

      {activeTab === 'ranking' && (
        /* PALMARÈS & CLASSEMENT PAR RANG DÉCROISSANT (Audio 2 & Note Manuscrite) */
        <div className="space-y-6">
          {/* Controls Bar: Class, Subject, Sequence Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                {/* Classe Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Classe sélectionnée *
                  </label>
                  <select
                    value={rankingClassId}
                    onChange={(e) => setRankingClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({students.filter(s => s.classId === c.id).length} élèves)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Matière Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Discipline / Matière *
                  </label>
                  <select
                    value={rankingSubjectId}
                    onChange={(e) => setRankingSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Période / Séquence Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Séquence d'évaluation *
                  </label>
                  <select
                    value={rankingSequenceId}
                    onChange={(e) => setRankingSequenceId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Séquence 1 (Trimestre 1)</option>
                    <option value={2}>Séquence 2 (Trimestre 1)</option>
                    <option value={3}>Séquence 3 (Trimestre 2)</option>
                    <option value={4}>Séquence 4 (Trimestre 2)</option>
                    <option value={5}>Séquence 5 (Trimestre 3)</option>
                    <option value={6}>Séquence 6 (Trimestre 3)</option>
                  </select>
                </div>
              </div>

              {/* Action: Export PDF Button */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const currentCls = classes.find(c => c.id === rankingClassId);
                    const currentSubj = SUBJECTS.find(s => s.id === rankingSubjectId);
                    const classStudents = students.filter(s => s.classId === rankingClassId);

                    // Find existing eval
                    const foundEval = evaluations.find(
                      e => e.classId === rankingClassId && e.subjectId === rankingSubjectId && e.sequenceId === rankingSequenceId
                    );

                    // Build list of students with their marks
                    const listWithGrades = classStudents.map(st => {
                      const m = foundEval ? marks.find(mk => mk.evaluationId === foundEval.id && mk.studentId === st.id) : undefined;
                      const val = m !== undefined ? m.value : 0;
                      return {
                        student: st,
                        grade: val,
                        hasMark: m !== undefined
                      };
                    });

                    // Sort descending
                    listWithGrades.sort((a, b) => b.grade - a.grade);

                    let cRank = 1;
                    const ranked = listWithGrades.map((item, idx) => {
                      if (idx > 0 && item.grade < listWithGrades[idx - 1].grade) {
                        cRank = idx + 1;
                      }
                      let app = 'Passable';
                      if (item.grade >= 16) app = 'Très Bien';
                      else if (item.grade >= 14) app = 'Bien';
                      else if (item.grade >= 12) app = 'Assez Bien';
                      else if (item.grade >= 10) app = 'Passable';
                      else if (item.grade >= 8) app = 'Insuffisant';
                      else app = 'Très Faible';

                      return {
                        rank: cRank,
                        student: item.student,
                        grade: item.grade,
                        appreciation: app
                      };
                    });

                    const gradesArr = listWithGrades.filter(i => i.hasMark).map(i => i.grade);
                    const avg = gradesArr.length > 0 ? gradesArr.reduce((a, b) => a + b, 0) / gradesArr.length : 0;
                    const hi = gradesArr.length > 0 ? Math.max(...gradesArr) : 0;
                    const lo = gradesArr.length > 0 ? Math.min(...gradesArr) : 0;
                    const pass = gradesArr.filter(g => g >= 10).length;

                    const schoolObj = activeSchool || {
                      id: 'school-main',
                      name: 'ÉTABLISSEMENT SCOLAIRE ASI - GABON',
                      slogan: 'Excellence Académique & Innovation',
                      logoEmoji: '🏫',
                      primaryColor: 'blue',
                      address: 'Libreville, République Gabonaise',
                      phone: '+241 01 02 03 04',
                      email: 'direction@asi-gabon.ga',
                      activeSchoolYear: '2025-2026'
                    };

                    generateClassRankingPDF(
                      schoolObj,
                      currentCls?.name || 'Classe',
                      currentSubj?.name || 'Matière',
                      `Séquence ${rankingSequenceId}`,
                      ranked,
                      {
                        average: avg,
                        highest: hi,
                        lowest: lo,
                        passCount: pass,
                        total: classStudents.length
                      }
                    );
                    showToast("Palmarès PDF officiel généré et téléchargé avec succès !", "success");
                  }}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>📄 Télécharger le Palmarès PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Palmarès Board */}
          {(() => {
            const currentCls = classes.find(c => c.id === rankingClassId);
            const currentSubj = SUBJECTS.find(s => s.id === rankingSubjectId);
            const classStudents = students.filter(s => s.classId === rankingClassId);

            // Find evaluation
            const foundEval = evaluations.find(
              e => e.classId === rankingClassId && e.subjectId === rankingSubjectId && e.sequenceId === rankingSequenceId
            );

            // Build student grade list
            const studentGrades = classStudents.map(st => {
              const m = foundEval ? marks.find(mk => mk.evaluationId === foundEval.id && mk.studentId === st.id) : undefined;
              return {
                student: st,
                grade: m !== undefined ? m.value : null,
                comment: m?.comment || ''
              };
            });

            // Sort by grade descending (null grades go to bottom)
            studentGrades.sort((a, b) => {
              if (a.grade === null && b.grade === null) return 0;
              if (a.grade === null) return 1;
              if (b.grade === null) return -1;
              return b.grade - a.grade;
            });

            // Compute rank
            let cRank = 1;
            const rankedList = studentGrades.map((item, idx) => {
              if (idx > 0 && item.grade !== null && studentGrades[idx - 1].grade !== null) {
                if (item.grade < (studentGrades[idx - 1].grade as number)) {
                  cRank = idx + 1;
                }
              }
              return {
                ...item,
                rank: item.grade !== null ? cRank : null
              };
            });

            // Stats
            const entered = studentGrades.filter(g => g.grade !== null).map(g => g.grade as number);
            const avg = entered.length > 0 ? entered.reduce((a, b) => a + b, 0) / entered.length : 0;
            const highest = entered.length > 0 ? Math.max(...entered) : 0;
            const lowest = entered.length > 0 ? Math.min(...entered) : 0;
            const passCount = entered.filter(g => g >= 10).length;
            const passRate = entered.length > 0 ? Math.round((passCount / entered.length) * 100) : 0;

            const handleUpdateStudentGrade = (studentId: string, valStr: string) => {
              const num = valStr === '' ? null : Number(valStr);
              if (num !== null && (isNaN(num) || num < 0 || num > 20)) {
                showToast("La note doit être comprise entre 0 et 20.", "error");
                return;
              }

              // Ensure evaluation exists
              let activeEvalId = foundEval?.id;
              if (!activeEvalId) {
                activeEvalId = `eval-auto-${Date.now()}`;
                const newEv: Evaluation = {
                  id: activeEvalId,
                  classId: rankingClassId,
                  subjectId: rankingSubjectId,
                  teacherId: 'teach-auto',
                  sequenceId: rankingSequenceId,
                  termId: rankingSequenceId <= 2 ? 1 : rankingSequenceId <= 4 ? 2 : 3,
                  type: 'CONTROLE',
                  coefficient: 2,
                  date: new Date().toISOString().split('T')[0],
                  status: 'VALIDATED',
                  title: `Évaluation ${currentSubj?.name || 'Matière'} - Séquence ${rankingSequenceId}`,
                  schoolId: activeSchoolId
                };
                setEvaluations(prev => [newEv, ...prev]);
              }

              // Update marks
              setMarks(prev => {
                const filtered = prev.filter(m => !(m.evaluationId === activeEvalId && m.studentId === studentId));
                if (num !== null) {
                  const newM: Mark = {
                    id: `m-${activeEvalId}-${studentId}`,
                    evaluationId: activeEvalId!,
                    studentId,
                    value: num
                  };
                  return [...filtered, newM];
                }
                return filtered;
              });
            };

            return (
              <div className="space-y-5">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Effectif Classé</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-display font-black text-slate-900">{entered.length} / {classStudents.length}</span>
                      <span className="text-xs text-slate-400 font-semibold">élèves</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Moyenne Classe</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-display font-black text-blue-600">{avg.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ 20</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> Note Maximale (1er)
                    </span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-display font-black text-emerald-600">{highest.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ 20</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className={`text-2xl font-display font-black ${passRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {passRate}%
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">(&ge; 10/20)</span>
                    </div>
                  </div>
                </div>

                {/* Ranking Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 bg-slate-50/50">
                    <div>
                      <h3 className="text-sm font-display font-black text-slate-900 flex items-center gap-2">
                        <span>Classement par ordre décroissant des notes</span>
                        <span className="text-xs font-normal text-slate-500">
                          ({currentCls?.name || 'Classe'} — {currentSubj?.name || 'Matière'})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Vous pouvez saisir ou modifier directement la note d'un élève : le classement et le rang s'actualisent en direct !
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Tri automatique 1er au dernier
                      </span>
                    </div>
                  </div>

                  {classStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <p className="text-sm font-bold text-slate-700">Aucun élève inscrit dans cette classe ({currentCls?.name})</p>
                      <p className="text-xs text-slate-400">
                        Rendez-vous dans l'onglet "Classes & Élèves" pour inscrire des élèves dans cette classe.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="px-5 py-3.5 text-center w-20">Rang</th>
                            <th className="px-5 py-3.5">Matricule & Élève</th>
                            <th className="px-5 py-3.5 text-center w-36">Note sur 20</th>
                            <th className="px-5 py-3.5">Écart Moyenne</th>
                            <th className="px-5 py-3.5">Appréciation</th>
                            <th className="px-5 py-3.5 text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {rankedList.map((item, idx) => {
                            const isFirst = item.rank === 1;
                            const isPass = item.grade !== null && item.grade >= 10;
                            const diff = item.grade !== null ? (item.grade - avg).toFixed(2) : null;

                            let appreciation = 'En attente de note';
                            if (item.grade !== null) {
                              if (item.grade >= 16) appreciation = 'Très Bien - Félicitations';
                              else if (item.grade >= 14) appreciation = 'Bien - Tableau d\'honneur';
                              else if (item.grade >= 12) appreciation = 'Assez Bien - Encouragements';
                              else if (item.grade >= 10) appreciation = 'Passable - Admis';
                              else if (item.grade >= 8) appreciation = 'Insuffisant - Peut mieux faire';
                              else appreciation = 'Très Faible - Travail à intensifier';
                            }

                            return (
                              <tr 
                                key={item.student.id} 
                                className={`transition-colors ${
                                  isFirst ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/60'
                                }`}
                              >
                                {/* Rang */}
                                <td className="px-5 py-3.5 text-center">
                                  {item.rank !== null ? (
                                    <span className={`inline-flex items-center justify-center font-display font-black text-xs px-2.5 py-1 rounded-xl ${
                                      item.rank === 1 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs' 
                                        : item.rank <= 3 
                                        ? 'bg-blue-100 text-blue-800 font-bold' 
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {item.rank === 1 ? '🥇 1er' : `${item.rank}e`}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Nom & Matricule */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center space-x-2.5">
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                      item.student.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {item.student.lastName.charAt(0)}{item.student.firstName.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">
                                        {item.student.lastName.toUpperCase()} {item.student.firstName}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {item.student.matricule || item.student.id.slice(-6).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Saisie directe de Note */}
                                <td className="px-5 py-3.5 text-center">
                                  <div className="inline-flex items-center space-x-1.5">
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="20"
                                      placeholder="-"
                                      defaultValue={item.grade !== null ? item.grade : ''}
                                      onBlur={(e) => handleUpdateStudentGrade(item.student.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                      className={`w-18 text-center py-1.5 px-2 rounded-xl font-bold font-mono text-sm border focus:outline-none focus:ring-2 ${
                                        item.grade !== null && item.grade >= 10
                                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 focus:ring-emerald-500'
                                          : item.grade !== null
                                          ? 'bg-rose-50/80 border-rose-300 text-rose-800 focus:ring-rose-500'
                                          : 'bg-slate-50 border-slate-200 text-slate-600 focus:ring-blue-500'
                                      }`}
                                    />
                                    <span className="text-xs text-slate-400 font-semibold">/ 20</span>
                                  </div>
                                </td>

                                {/* Écart Moyenne */}
                                <td className="px-5 py-3.5 font-mono text-xs font-semibold">
                                  {diff !== null ? (
                                    <span className={Number(diff) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                      {Number(diff) >= 0 ? `+${diff}` : diff}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Appréciation */}
                                <td className="px-5 py-3.5">
                                  <span className="text-xs font-medium text-slate-700 italic">
                                    {appreciation}
                                  </span>
                                </td>

                                {/* Statut Admis / Non-admis */}
                                <td className="px-5 py-3.5 text-center">
                                  {item.grade !== null ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      isPass 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {isPass ? 'Admis' : 'Non-admis'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Non noté</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'entry' && (
        /* GRADE SPREADSHEET ENTRY VIEW */
        <div className="space-y-4">
          {/* Sub Navigation Bar for Saisie d'un Devoir */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('ranking')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← Retour au Palmarès</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Créer une Nouvelle Évaluation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Saisie Setup Form (left column) */}
            <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm self-start space-y-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-1.5">
                      <span>Fiche d'Évaluation</span>
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Nouvelle</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Sélectionner l'Épreuve
                    </label>
                    {evaluations.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                        <p>Aucune évaluation n'est disponible pour cette école.</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Créer une Évaluation
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedEvalId || ''}
                        onChange={(e) => setSelectedEvalId(e.target.value || null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Choisir une évaluation --</option>
                        {evaluations.map(ev => {
                          const cl = classes.find(c => c.id === ev.classId)?.name;
                          const subj = SUBJECTS.find(s => s.id === ev.subjectId)?.name;
                          return (
                            <option key={ev.id} value={ev.id}>
                              [{cl}] {subj} - {ev.title} (S{ev.sequenceId})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </div>

                {activeEval && (
                  <>
                    {/* Locked Workflow Indicator Card */}
                    <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                      isLocked 
                        ? 'bg-slate-50 border-slate-200 text-slate-600' 
                        : activeEval.status === 'PENDING_VALIDATION'
                        ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-slate-500" />
                        ) : (
                          <Unlock className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold">
                          Statut : {
                            isLocked 
                              ? 'Validé & Verrouillé' 
                              : activeEval.status === 'PENDING_VALIDATION'
                              ? 'En attente de validation'
                              : 'Brouillon (Modifiable)'
                          }
                        </p>
                        <p className="text-slate-500 mt-1 leading-relaxed">
                          {isLocked 
                            ? 'Cette épreuve a été auditée et validée par le censeur. Aucune modification de note n\'est permise.'
                            : activeEval.status === 'PENDING_VALIDATION'
                            ? 'En attente de contrôle de saisie par la direction. Les inputs restent disponibles avant validation.'
                            : 'Fiche modifiable en local par l\'enseignant. Soumettez pour verouillage.'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Stats for currently loaded eval */}
                    <div className="border-t border-b border-slate-100 py-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Statistiques de l'Épreuve
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                          <p className="text-[10px] uppercase font-mono font-bold">Moyenne de classe</p>
                          <p className="text-base font-bold font-mono mt-0.5">{classStats.average}/20</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                          <p className="text-[10px] uppercase font-mono font-bold">Taux Réussite</p>
                          <p className="text-base font-bold font-mono mt-0.5">{classSuccessRate}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                          <p className="text-[9px] uppercase font-mono font-bold">Note Maximale</p>
                          <p className="text-xs font-bold font-mono mt-0.5">{classStats.highest}/20</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                          <p className="text-[9px] uppercase font-mono font-bold">Note Minimale</p>
                          <p className="text-xs font-bold font-mono mt-0.5">{classStats.lowest}/20</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Taux de complétude :</span>
                        <span className="font-mono font-bold text-slate-700">{numGradesEntered} / {numStudentsInClass} notes</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                      {!isLocked && (
                        <>
                          <button
                            onClick={handleSaveMarks}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition-all flex items-center justify-center space-x-2 cursor-pointer hover:shadow-md"
                          >
                            <Save className="h-4 w-4" />
                            <span>Enregistrer les Notes</span>
                          </button>

                          {activeEval.status === 'DRAFT' && (
                            <button
                              onClick={handleRequestValidation}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              Soumettre au Censeur
                            </button>
                          )}
                        </>
                      )}

                      {saveSuccess && (
                        <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-pulse">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>Notes enregistrées avec succès en base de données.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SPREADSHEET TABLE GRID (right column) */}
            <div className="xl:col-span-8 space-y-4">
              {!selectedEvalId ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl mb-4">
                    <FileText className="h-10 w-10 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-800">
                    {evaluations.length === 0 ? "Aucune Évaluation Créée" : "Sélectionnez une évaluation pour saisir les notes"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md">
                    {evaluations.length === 0 
                      ? "Pour commencer à saisir des notes scolaires, configurez une fiche d'évaluation (contrôle, devoir ou examen)."
                      : "Choisissez une évaluation existante à gauche, ou cliquez sur l'une des épreuves ci-dessous pour ouvrir la grille de saisie."}
                  </p>

                  {evaluations.length > 0 && (
                    <div className="mt-6 w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {evaluations.slice(0, 4).map(ev => {
                        const cl = classes.find(c => c.id === ev.classId)?.name;
                        const subj = SUBJECTS.find(s => s.id === ev.subjectId)?.name;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvalId(ev.id)}
                            className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left cursor-pointer group"
                          >
                            <div className="text-[10px] font-bold text-blue-600 font-mono uppercase">{cl}</div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate mt-0.5">{ev.title}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{subj} • Coeff {ev.coefficient}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Créer une Nouvelle Évaluation</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  {/* Spreadsheet header */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-slate-800 text-sm">
                        Saisie des Notes : {activeEval?.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Classe : <strong className="text-slate-700">{activeClass?.name}</strong> • Coefficient : <strong className="text-slate-700">x{activeEval?.coefficient}</strong> • Séquence : <strong className="text-slate-700">{activeEval?.sequenceId}</strong>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isLocked ? (
                        <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg font-mono font-bold flex items-center space-x-1.5">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Fiche Verrouillée</span>
                        </span>
                      ) : (
                        <button
                          onClick={handleSaveMarks}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Enregistrer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Validation warnings */}
                  {validationError && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-800 text-xs flex items-center space-x-2.5">
                      <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                      <span className="font-medium">{validationError}</span>
                    </div>
                  )}

                  {/* Main spreadsheet rows */}
                  <div className="overflow-x-auto custom-scrollbar">
                    {students.filter(s => s.classId === activeEval?.classId).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Users className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="text-xs">Aucun élève n'est inscrit dans la classe {activeClass?.name || ''} pour le moment.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-600 font-display font-semibold">
                            <th className="p-4 pl-6">N°</th>
                            <th className="p-4">Nom & Prénom de l'Élève</th>
                            <th className="p-4 text-center">Note /20</th>
                            <th className="p-4">Appréciation / Commentaire</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100">
                          {students.filter(s => s.classId === activeEval?.classId).map((stud, idx) => {
                            const scoreData = tempMarks[stud.id] || { value: '', comment: '' };
                            const scoreNum = scoreData.value !== '' ? Number(scoreData.value) : null;
                            const isUnderAverage = scoreNum !== null && scoreNum < 10;

                            return (
                              <tr key={stud.id} className="hover:bg-slate-50/30">
                                <td className="p-4 pl-6 font-mono text-xs text-slate-400">{idx + 1}</td>
                                <td className="p-4">
                                  <p className="font-semibold text-slate-800">{stud.lastName} {stud.firstName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Matricule : {stud.matricule || `STU-${idx+1}`} • Genre : {stud.gender}</p>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="inline-flex items-center space-x-2">
                                    <input
                                      type="text"
                                      maxLength={5}
                                      value={scoreData.value}
                                      disabled={isLocked}
                                      onChange={(e) => handleGradeChange(stud.id, e.target.value)}
                                      className={`w-16 bg-slate-50 border ${
                                        isLocked 
                                          ? 'border-slate-100 text-slate-400 font-semibold text-center cursor-not-allowed'
                                          : isUnderAverage 
                                          ? 'border-rose-300 text-rose-700 bg-rose-50/30 font-bold focus:ring-rose-500' 
                                          : 'border-slate-200 text-slate-800 font-bold focus:ring-blue-500'
                                      } rounded-lg px-2 py-1.5 text-center font-mono text-sm focus:outline-none focus:ring-2`}
                                      placeholder="--"
                                    />
                                    <span className="text-xs text-slate-400 font-mono">/20</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={scoreData.comment}
                                    disabled={isLocked}
                                    onChange={(e) => handleCommentChange(stud.id, e.target.value)}
                                    className={`w-full bg-slate-50 border ${
                                      isLocked 
                                        ? 'border-transparent text-slate-400 italic cursor-not-allowed' 
                                        : 'border-slate-200 text-slate-700 focus:ring-blue-500'
                                    } rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2`}
                                    placeholder="Ex: Bon travail, à approfondir..."
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        /* EVALUATIONS LISTING VIEW (Tab 2) */
        <div className="space-y-4">
          {/* Sub Navigation Bar for Liste des Évaluations */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('ranking')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← Retour au Palmarès</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Créer une Évaluation</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une évaluation..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">Filtrer par classe :</span>
                <select
                  value={listFilterClass}
                  onChange={(e) => setListFilterClass(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Toutes les classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatCycleLevel(c.level)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Evaluations Table */}
            {(() => {
              const filteredEvals = evaluations.filter(ev => {
                const matchesClass = listFilterClass === 'ALL' || ev.classId === listFilterClass;
                const subj = SUBJECTS.find(s => s.id === ev.subjectId)?.name || '';
                const matchesSearch = !listSearchQuery.trim() || 
                  ev.title.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
                  subj.toLowerCase().includes(listSearchQuery.toLowerCase());
                return matchesClass && matchesSearch;
              });

              if (filteredEvals.length === 0) {
                return (
                  <div className="text-center py-12 space-y-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Aucune évaluation trouvée</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Créez votre première épreuve pour démarrer la saisie des notes scolaires.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Créer une Évaluation</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-600 font-display font-semibold">
                        <th className="p-4 pl-6">Intitulé de l'Évaluation</th>
                        <th className="p-4">Classe</th>
                        <th className="p-4">Matière</th>
                        <th className="p-4 text-center">Coeff</th>
                        <th className="p-4 text-center">Séquence</th>
                        <th className="p-4 text-center">Date</th>
                        <th className="p-4 text-center">Statut Workflow</th>
                        <th className="p-4 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {filteredEvals.map((ev) => {
                        const sClass = classes.find(c => c.id === ev.classId);
                        const sSubject = SUBJECTS.find(sub => sub.id === ev.subjectId);
                        
                        return (
                          <tr key={ev.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6">
                              <p className="font-semibold text-slate-800">{ev.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono">{ev.type}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-slate-700">{sClass?.name}</span>
                              {sClass?.level && (
                                <p className="text-[10px] text-blue-600 font-medium">
                                  {formatCycleLevel(sClass.level)}
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-slate-600">{sSubject?.name}</td>
                            <td className="p-4 text-center font-mono font-medium text-slate-600">{ev.coefficient}</td>
                            <td className="p-4 text-center font-mono text-xs font-semibold text-slate-500">Seq {ev.sequenceId}</td>
                            <td className="p-4 text-center font-mono text-xs text-slate-500">{ev.date}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-2.5 py-1 text-[10px] font-bold font-mono rounded-full uppercase border ${
                                ev.status === 'VALIDATED'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : ev.status === 'PENDING_VALIDATION'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {ev.status === 'VALIDATED' 
                                  ? '🔒 Validé' 
                                  : ev.status === 'PENDING_VALIDATION' 
                                  ? '⏳ En attente' 
                                  : '📝 Brouillon'
                                }
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6 space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedEvalId(ev.id);
                                  setActiveTab('entry');
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                {ev.status === 'VALIDATED' ? 'Consulter' : 'Saisir les notes'}
                              </button>
                              <button
                                onClick={() => handleDeleteEvaluation(ev.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer cette évaluation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dedicated High-Clarity Modal: Créer une Évaluation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-display font-black text-slate-900">Créer une Évaluation</h3>
                  <p className="text-xs text-slate-500">Configurez une nouvelle épreuve pour saisir les notes</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Intitulé de l'épreuve</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optionnel (généré automatiquement si vide)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contrôle N°1 - Trigonométrie & Fonctions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Classe *</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-medium"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCycleLevel(c.level)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Matière / Discipline *</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-medium"
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Type d'Épreuve</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EvaluationType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-medium"
                  >
                    <option value="CONTROLE">Contrôle Continu</option>
                    <option value="DEVOIR">Devoir Surveillé / De Maison</option>
                    <option value="EXAMEN">Examen Trimestriel / Blanc</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newCoeff}
                    onChange={(e) => setNewCoeff(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Séquence (1 à 6)</label>
                  <select
                    value={newSequence}
                    onChange={(e) => setNewSequence(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>Séquence {num} ({num <= 2 ? '1er Trimestre' : num <= 4 ? '2e Trimestre' : '3e Trimestre'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Date de l'épreuve</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateEvaluation}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Créer et Saisir les Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
