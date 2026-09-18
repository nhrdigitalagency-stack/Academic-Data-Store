/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Calendar, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Users,
  School,
  Sparkles,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { Homework, HomeworkStatus, HomeworkSubmission, SchoolClass, Student, SchoolTenant } from '../types';
import { SUBJECTS } from '../data/mockData';
import { generateHomeworkControlPDF } from '../utils/pdfGenerator';

interface HomeworkModuleProps {
  homeworks: Homework[];
  setHomeworks: React.Dispatch<React.SetStateAction<Homework[]>>;
  classes: SchoolClass[];
  students: Student[];
  activeSchool?: SchoolTenant;
  activeSchoolId?: string;
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
  onBack?: () => void;
}

export default function HomeworkModule({
  homeworks,
  setHomeworks,
  classes,
  students,
  activeSchool,
  activeSchoolId = '',
  addAuditLog,
  onBack
}: HomeworkModuleProps) {
  // Filtered by current school
  const currentSchoolClasses = classes.filter(c => !activeSchoolId || !c.schoolId || c.schoolId === activeSchoolId);
  const currentSchoolHomeworks = homeworks.filter(h => !activeSchoolId || !h.schoolId || h.schoolId === activeSchoolId);

  // Selected homework for checking/grading
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(currentSchoolHomeworks[0]?.id || null);

  // Modal create homework
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClassId, setNewClassId] = useState(currentSchoolClasses[0]?.id || '');
  const [newSubjectId, setNewSubjectId] = useState(SUBJECTS[0]?.id || 'subj-math');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [newDescription, setNewDescription] = useState('');

  // Search and filter
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Currently viewed homework object
  const activeHomework = currentSchoolHomeworks.find(h => h.id === selectedHomeworkId) || currentSchoolHomeworks[0] || null;

  // Students of active homework's class
  const classStudents = activeHomework 
    ? students.filter(s => s.classId === activeHomework.classId)
    : [];

  // Handle create new homework
  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Veuillez indiquer le titre du devoir.", "error");
      return;
    }
    if (!newClassId) {
      showToast("Veuillez choisir une classe.", "error");
      return;
    }

    const cls = classes.find(c => c.id === newClassId);
    const subj = SUBJECTS.find(s => s.id === newSubjectId);

    const newId = `hw-${Date.now()}`;
    const newHw: Homework = {
      id: newId,
      schoolId: activeSchoolId || activeSchool?.id,
      classId: newClassId,
      subjectId: newSubjectId,
      teacherId: 'teach-auto',
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
      createdAt: new Date().toISOString().split('T')[0],
      submissions: []
    };

    setHomeworks(prev => [newHw, ...prev]);
    setSelectedHomeworkId(newId);
    setShowCreateModal(false);

    // Reset form
    setNewTitle('');
    setNewDescription('');

    addAuditLog?.(
      "Nouveau devoir de maison", 
      activeSchoolId, 
      `Création du devoir "${newTitle.trim()}" en ${subj?.name} pour la classe ${cls?.name}.`
    );
    showToast(`Devoir de maison publié pour la classe ${cls?.name} !`, "success");
  };

  // Handle toggle submission status for a student
  const handleSetStudentStatus = (studentId: string, status: HomeworkStatus, comment = '') => {
    if (!activeHomework) return;

    setHomeworks(prev => prev.map(hw => {
      if (hw.id === activeHomework.id) {
        const existing = hw.submissions.find(s => s.studentId === studentId);
        let updatedSubmissions: HomeworkSubmission[];

        if (existing) {
          updatedSubmissions = hw.submissions.map(sub => {
            if (sub.studentId === studentId) {
              return {
                ...sub,
                status,
                comment: comment !== undefined && comment !== '' ? comment : sub.comment,
                submittedAt: new Date().toISOString()
              };
            }
            return sub;
          });
        } else {
          const newSub: HomeworkSubmission = {
            studentId,
            status,
            comment: comment || undefined,
            submittedAt: new Date().toISOString()
          };
          updatedSubmissions = [...hw.submissions, newSub];
        }

        return {
          ...hw,
          submissions: updatedSubmissions
        };
      }
      return hw;
    }));
  };

  // Mark all students as DONE
  const handleMarkAllDone = () => {
    if (!activeHomework) return;
    classStudents.forEach(st => {
      handleSetStudentStatus(st.id, 'DONE');
    });
    showToast("Tous les élèves ont été marqués comme ayant fait le devoir !", "success");
  };

  // Delete homework
  const handleDeleteHomework = (hwId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce devoir de maison ?")) return;
    setHomeworks(prev => prev.filter(h => h.id !== hwId));
    if (selectedHomeworkId === hwId) {
      setSelectedHomeworkId(null);
    }
    showToast("Devoir supprimé.", "info");
  };

  // Filtered homework list
  const filteredHomeworks = currentSchoolHomeworks.filter(hw => {
    const matchesClass = filterClassId === 'all' || hw.classId === filterClassId;
    const q = searchQuery.toLowerCase().trim();
    const subj = SUBJECTS.find(s => s.id === hw.subjectId);
    const cls = classes.find(c => c.id === hw.classId);
    const matchesQuery = !q || 
      hw.title.toLowerCase().includes(q) || 
      (subj && subj.name.toLowerCase().includes(q)) ||
      (cls && cls.name.toLowerCase().includes(q));
    return matchesClass && matchesQuery;
  });

  // Calculate completion percentage for an active homework
  const getHomeworkStats = (hw: Homework) => {
    const studentsInClass = students.filter(s => s.classId === hw.classId);
    const total = studentsInClass.length;
    const doneCount = hw.submissions.filter(s => s.status === 'DONE').length;
    const notDoneCount = hw.submissions.filter(s => s.status === 'NOT_DONE').length;
    const lateCount = hw.submissions.filter(s => s.status === 'LATE').length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    return { total, doneCount, notDoneCount, lateCount, rate };
  };

  return (
    <div className="space-y-6" id="homework-module">
      {/* Toast Alert */}
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
                className="p-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
                title="Retour à la page précédente"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                Cahier de Textes & Contrôle des Devoirs de Maison
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                  {activeSchool?.name || 'Établissement'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assignez des devoirs par classe, cochez le travail fait/non fait et téléchargez la fiche de contrôle PDF.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (currentSchoolClasses.length === 0) {
              showToast("Veuillez d'abord créer au moins une classe dans 'Classes & Élèves'.", "error");
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Donner un Devoir</span>
        </button>
      </div>

      {/* Two Column Layout: Homeworks List (left) & Active Homework Checking Sheet (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Homeworks (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-slate-800">Devoirs programmés</h3>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg font-bold">
                {currentSchoolHomeworks.length}
              </span>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher devoir, matière..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">Toutes les classes</option>
                {currentSchoolClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of cards */}
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredHomeworks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">Aucun devoir de maison trouvé.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  + Créer un premier devoir
                </button>
              </div>
            ) : (
              filteredHomeworks.map((hw) => {
                const isSelected = activeHomework?.id === hw.id;
                const cls = classes.find(c => c.id === hw.classId);
                const subj = SUBJECTS.find(s => s.id === hw.subjectId);
                const stats = getHomeworkStats(hw);

                return (
                  <div
                    key={hw.id}
                    onClick={() => setSelectedHomeworkId(hw.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                          {cls?.name || 'Classe'} • {subj?.name || 'Matière'}
                        </span>
                        <h4 className="text-sm font-display font-bold text-slate-900 mt-1">
                          {hw.title}
                        </h4>
                      </div>
                      <button
                        title="Supprimer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHomework(hw.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>À rendre le {hw.dueDate}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-bold text-indigo-700">
                        <span>{stats.doneCount}/{stats.total} fait ({stats.rate}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Homework Checking Board (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {activeHomework ? (
            (() => {
              const cls = classes.find(c => c.id === activeHomework.classId);
              const subj = SUBJECTS.find(s => s.id === activeHomework.subjectId);
              const stats = getHomeworkStats(activeHomework);

              return (
                <div className="space-y-5">
                  {/* Homework Details Banner */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                            {cls?.name}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            {subj?.name}
                          </span>
                        </div>
                        <h3 className="text-lg font-display font-black text-slate-900 mt-1">
                          {activeHomework.title}
                        </h3>
                        {activeHomework.description && (
                          <p className="text-xs text-slate-600 mt-1 max-w-xl">
                            {activeHomework.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => {
                            if (activeSchool) {
                              generateHomeworkControlPDF(activeSchool, activeHomework, classStudents);
                              showToast("Fiche de contrôle officielle générée et téléchargée !", "success");
                            }
                          }}
                          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          <span>Fiche de Contrôle (PDF)</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Quick Batch Controls */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="text-xs text-slate-500 font-medium">Statut de réalisation : </span>
                          <span className="text-xs font-bold text-indigo-700 font-mono">
                            {stats.doneCount} / {stats.total} élèves ({stats.rate}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleMarkAllDone}
                          className="flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Tout marquer comme "Fait"</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Checking Checklist Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-slate-600">
                        Pointage individuel des élèves ({classStudents.length})
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Cliquez directement sur l'état pour enregistrer
                      </span>
                    </div>

                    {classStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <p className="text-xs font-bold text-slate-700">Aucun élève dans cette classe ({cls?.name})</p>
                        <p className="text-xs text-slate-400">Inscrivez d'abord des élèves dans la section "Classes & Élèves".</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                              <th className="px-5 py-3">Élève & Matricule</th>
                              <th className="px-5 py-3 text-center">État du devoir</th>
                              <th className="px-5 py-3">Observation / Commentaire</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {classStudents.map((st) => {
                              const submission = activeHomework.submissions.find(s => s.studentId === st.id);
                              const currentStatus: HomeworkStatus = submission?.status || 'PENDING';

                              return (
                                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                                  {/* Student Name */}
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center space-x-2.5">
                                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                        st.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {st.lastName.charAt(0)}{st.firstName.charAt(0)}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-900 block">
                                          {st.lastName.toUpperCase()} {st.firstName}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          Matricule : {st.matricule || st.id.slice(-6).toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Quick Status Buttons */}
                                  <td className="px-5 py-3.5 text-center">
                                    <div className="inline-flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                                      <button
                                        type="button"
                                        onClick={() => handleSetStudentStatus(st.id, 'DONE')}
                                        title="Fait"
                                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                          currentStatus === 'DONE'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Fait</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetStudentStatus(st.id, 'NOT_DONE')}
                                        title="Non fait"
                                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                          currentStatus === 'NOT_DONE'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        <span>Non fait</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetStudentStatus(st.id, 'LATE')}
                                        title="En retard"
                                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                          currentStatus === 'LATE'
                                            ? 'bg-amber-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                      >
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>En retard</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetStudentStatus(st.id, 'EXCUSED')}
                                        title="Dispensé"
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                          currentStatus === 'EXCUSED'
                                            ? 'bg-slate-600 text-white shadow-xs'
                                            : 'text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        Dispensé
                                      </button>
                                    </div>
                                  </td>

                                  {/* Observation / Comment input */}
                                  <td className="px-5 py-3.5">
                                    <input
                                      type="text"
                                      placeholder="Observation (ex: cahier oublié, incomplet...)"
                                      defaultValue={submission?.comment || ''}
                                      onBlur={(e) => {
                                        const val = e.target.value;
                                        handleSetStudentStatus(st.id, currentStatus, val);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
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
            })()
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Sélectionnez ou créez un devoir de maison</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choisissez un devoir dans la liste de gauche pour effectuer le pointage des élèves (Fait / Non fait) ou créez-en un nouveau.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouveau Devoir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE NEW HOMEWORK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Assigner un Nouveau Devoir de Maison
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Titre du devoir *</label>
                <input
                  type="text"
                  placeholder="Ex: Exercices 14 et 15 page 82 sur la gravitation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Classe concernée *</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  >
                    {currentSchoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Matière *</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Date limite de remise *</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Consignes / Description détaillée</label>
                <textarea
                  rows={3}
                  placeholder="Détails du travail à faire, chapitres à relire, consignes particulières pour les élèves et parents..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                >
                  Publier le devoir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
