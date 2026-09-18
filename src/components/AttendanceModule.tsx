/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolClass, Student, AttendanceSheet, AttendanceRecord, AttendanceStatus, AbsenceReason, SchoolTenant } from '../types';
import { CLASSES, STUDENTS, SUBJECTS, INITIAL_ATTENDANCE_SHEETS, INITIAL_ATTENDANCE_RECORDS, SEQUENCES, INITIAL_SCHOOLS } from '../data/mockData';
import { formatCycleLevel } from '../utils/cycleUtils';
import { Calendar, Users, CheckCircle, XCircle, Clock, Plus, Search, Download, ChevronRight, FileSpreadsheet, FileText, AlertCircle, Save, Filter, Info, Sparkles, ArrowLeft } from 'lucide-react';

interface AttendanceModuleProps {
  sheets: AttendanceSheet[];
  setSheets: React.Dispatch<React.SetStateAction<AttendanceSheet[]>>;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  selectedClass?: string;
  onSelectClass?: (classId: string) => void;
  classes?: SchoolClass[];
  students?: Student[];
  activeSchoolId?: string;
  activeSchool?: SchoolTenant;
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
  initialSheetId?: string | null;
  initialSubjectId?: string;
  onBack?: () => void;
}

export default function AttendanceModule({ 
  sheets, 
  setSheets, 
  records, 
  setRecords,
  selectedClass: propSelectedClass,
  onSelectClass,
  classes = CLASSES,
  students = STUDENTS,
  activeSchoolId = '',
  activeSchool,
  addAuditLog,
  initialSheetId,
  initialSubjectId,
  onBack
}: AttendanceModuleProps) {
  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');
  
  // States for creating a new sheet
  const [localSelectedClass, setLocalSelectedClass] = useState<string>(classes[0]?.id || '');
  const selectedClass = propSelectedClass !== undefined ? propSelectedClass : localSelectedClass;
  const setSelectedClass = onSelectClass !== undefined ? onSelectClass : setLocalSelectedClass;
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectId || SUBJECTS[0]?.id || 'subj-math');
  const [selectedSequence, setSelectedSequence] = useState<number>(5);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('08:00 - 10:00');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Selection/editing state
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  // Auto-load initial sheet when provided
  React.useEffect(() => {
    if (initialSheetId) {
      handleOpenSheet(initialSheetId);
    }
  }, [initialSheetId]);

  React.useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubject(initialSubjectId);
    }
  }, [initialSubjectId]);
  
  // Temporary editing state for records in the active sheet
  const [editingRecords, setEditingRecords] = useState<Record<string, { status: AttendanceStatus; reason: AbsenceReason; comment: string }>>({});
  
  // Filters for history tab
  const [historyClassFilter, setHistoryClassFilter] = useState<string>('All');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Search inside active take-attendance panel
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Handle opening sheet for editing
  const handleOpenSheet = (sheetId: string) => {
    setActiveSheetId(sheetId);
    
    // Find all records for this sheet
    const sheetRecords = records.filter(r => r.sheetId === sheetId);
    
    // Convert to state dict
    const recordsDict: Record<string, { status: AttendanceStatus; reason: AbsenceReason; comment: string }> = {};
    
    // Find students for this class
    const sheetObj = sheets.find(s => s.id === sheetId);
    if (sheetObj) {
      const classStudents = students.filter(s => s.classId === sheetObj.classId);
      classStudents.forEach(stud => {
        const foundRec = sheetRecords.find(r => r.studentId === stud.id);
        recordsDict[stud.id] = {
          status: foundRec ? foundRec.status : 'PRESENT',
          reason: foundRec ? foundRec.reason : '',
          comment: foundRec ? (foundRec.comment || '') : ''
        };
      });
    }
    
    setEditingRecords(recordsDict);
    setActiveTab('take');
  };

  // Create new sheet
  const handleCreateNewSheet = () => {
    // Check if sheet for this class, date and timeslot already exists
    const duplicate = sheets.find(s => s.classId === selectedClass && s.date === selectedDate && s.timeSlot === selectedTimeSlot);
    
    if (duplicate) {
      showToast(`Une feuille d'appel existe déjà pour la classe, la date et le créneau sélectionné !`, 'info');
      handleOpenSheet(duplicate.id);
      return;
    }

    const newSheetId = `ash-${Date.now()}`;
    const newSheet: AttendanceSheet = {
      id: newSheetId,
      classId: selectedClass,
      subjectId: selectedSubject,
      teacherId: 'teach-1', // Mock log-in
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      sequenceId: selectedSequence,
      schoolId: activeSchoolId
    };

    // Initialize records for all students of this class
    const classStudents = students.filter(s => s.classId === selectedClass);
    const newRecords: AttendanceRecord[] = classStudents.map(stud => ({
      id: `ar-${newSheetId}-${stud.id}`,
      sheetId: newSheetId,
      studentId: stud.id,
      status: 'PRESENT',
      reason: '',
      comment: ''
    }));

    setSheets(prev => [newSheet, ...prev]);
    setRecords(prev => [...prev, ...newRecords]);

    const className = classes.find(c => c.id === selectedClass)?.name || 'Classe';
    addAuditLog?.(
      "Saisie d'absences",
      activeSchoolId,
      `Création d'une nouvelle feuille d'appel (${selectedDate} à ${selectedTimeSlot}) pour la classe ${className}.`
    );
    
    // Load into editor
    const recordsDict: Record<string, { status: AttendanceStatus; reason: AbsenceReason; comment: string }> = {};
    classStudents.forEach(stud => {
      recordsDict[stud.id] = { status: 'PRESENT', reason: '', comment: '' };
    });
    
    setEditingRecords(recordsDict);
    setActiveSheetId(newSheetId);
  };

  // Save current active attendance sheet changes
  const [saveSuccess, setSaveSuccess] = useState(false);
  const handleSaveAttendance = () => {
    if (!activeSheetId) return;

    // Update main records state
    setRecords(prev => {
      // Remove old records for this sheet
      const rest = prev.filter(r => r.sheetId !== activeSheetId);
      
      // Map dictionary back to array
      const updated: AttendanceRecord[] = Object.keys(editingRecords).map(studentId => {
        const data = editingRecords[studentId];
        return {
          id: `ar-${activeSheetId}-${studentId}`,
          sheetId: activeSheetId,
          studentId,
          status: data.status,
          reason: data.reason,
          comment: data.comment
        };
      });

      return [...rest, ...updated];
    });

    const sheetObj = sheets.find(s => s.id === activeSheetId);
    if (sheetObj) {
      const className = classes.find(c => c.id === sheetObj.classId)?.name || 'Classe';
      const absCount = Object.values(editingRecords).filter((r: any) => r.status === 'ABSENT').length;
      const lateCount = Object.values(editingRecords).filter((r: any) => r.status === 'LATE').length;
      addAuditLog?.(
        "Saisie d'absences",
        sheetObj.schoolId || activeSchoolId,
        `Mise à jour des présences pour la classe ${className} (Appel du ${sheetObj.date}, créneau: ${sheetObj.timeSlot}). Total: ${absCount} absents, ${lateCount} retards.`
      );
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Mark all students as present
  const handleMarkAllPresent = () => {
    const updated = { ...editingRecords };
    Object.keys(updated).forEach(studentId => {
      updated[studentId] = {
        ...updated[studentId],
        status: 'PRESENT',
        reason: ''
      };
    });
    setEditingRecords(updated);
  };

  // Export function
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [isExportingArchivePDF, setIsExportingArchivePDF] = useState(false);

  const handleExportClassAttendanceArchive = async (classIdFilter?: string) => {
    const targetClassId = classIdFilter && classIdFilter !== 'All' 
      ? classIdFilter 
      : propSelectedClass || selectedClass || classes[0]?.id;
    const targetClass = classes.find(c => c.id === targetClassId) || classes[0];
    if (!targetClass) {
      showToast("Veuillez sélectionner une classe.", "error");
      return;
    }

    const classSheets = sheets.filter(s => s.classId === targetClass.id);
    const classStudentsList = students.filter(s => s.classId === targetClass.id);

    if (classStudentsList.length === 0) {
      showToast(`Aucun élève trouvé dans la classe ${targetClass.name}.`, "error");
      return;
    }

    setIsExportingArchivePDF(true);
    try {
      const { generateClassAttendanceArchivePDF } = await import('../utils/pdfGenerator');
      const schoolObj = activeSchool || INITIAL_SCHOOLS.find(s => s.id === activeSchoolId) || INITIAL_SCHOOLS[0];
      await generateClassAttendanceArchivePDF(
        schoolObj,
        targetClass.name,
        classSheets,
        records,
        classStudentsList,
        "Archives Administratives & Direction"
      );
      addAuditLog?.(
        "Export Archives Registre Appel PDF",
        schoolObj.id,
        `Export officiel du registre d'appel et d'assiduité de la classe ${targetClass.name} (${classSheets.length} séances, ${classStudentsList.length} élèves) pour les archives administratives.`
      );
      showToast(`Registre officiel d'appel de ${targetClass.name} exporté au format PDF avec succès !`, "success");
    } catch (err) {
      console.error("Erreur lors de l'exportation du registre d'appel:", err);
      showToast("Erreur lors de l'exportation du registre d'appel en PDF.", "error");
    } finally {
      setIsExportingArchivePDF(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'csv', sheetObj: AttendanceSheet, className: string) => {
    setExportingType(type);
    const sheetRecords = records.filter(r => r.sheetId === sheetObj.id);
    const schoolObj = activeSchool || INITIAL_SCHOOLS.find(s => s.id === sheetObj.schoolId || s.id === activeSchoolId) || INITIAL_SCHOOLS[0];

    if (type === 'pdf') {
      try {
        const { generateAttendancePDF } = await import('../utils/pdfGenerator');
        await generateAttendancePDF(schoolObj, sheetObj, sheetRecords, className, students);
        showToast(`Génération du PDF pour la feuille de ${className} effectuée avec succès !`, 'success');
      } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        showToast('Une erreur est survenue lors de la génération du PDF.', 'error');
      } finally {
        setExportingType(null);
      }
    } else {
      try {
        // Build genuine CSV content with BOM for Excel UTF-8 support
        const subjectObj = SUBJECTS.find(s => s.id === sheetObj.subjectId);
        const headers = ["Matricule", "Nom", "Prenom", "Statut", "Motif", "Observation", "Date", "Creneau", "Matiere", "Classe"];
        const rows = sheetRecords.map(rec => {
          const st = students.find(s => s.id === rec.studentId);
          return [
            `"${st?.matricule || ''}"`,
            `"${st?.lastName || ''}"`,
            `"${st?.firstName || ''}"`,
            `"${rec.status}"`,
            `"${rec.reason || ''}"`,
            `"${rec.comment || ''}"`,
            `"${sheetObj.date}"`,
            `"${sheetObj.timeSlot}"`,
            `"${subjectObj?.name || ''}"`,
            `"${className}"`
          ].join(';');
        });

        const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Feuille_Appel_${className.replace(/\s+/g, '_')}_${sheetObj.date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Export CSV téléchargé : Feuille d'appel de ${className} du ${sheetObj.date}`, 'success');
      } catch (err) {
        console.error('Erreur lors de la génération du CSV:', err);
        showToast('Erreur lors de l\'export CSV.', 'error');
      } finally {
        setExportingType(null);
      }
    }
  };

  // Fetching data for editing panel
  const activeSheetObj = sheets.find(s => s.id === activeSheetId);
  const activeClassObj = classes.find(c => c.id === activeSheetObj?.classId);
  const activeSubjectObj = SUBJECTS.find(s => s.id === activeSheetObj?.subjectId);
  const activeStudents = activeSheetObj ? students.filter(s => s.classId === activeSheetObj.classId) : [];

  // Filter student listing in taker panel
  const filteredActiveStudents = activeStudents.filter(s => {
    const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
    return fullName.includes(studentSearch.toLowerCase());
  });

  // Stats calculation for the open sheet
  const openSheetStats = {
    present: Object.keys(editingRecords).filter(sid => editingRecords[sid].status === 'PRESENT').length,
    absent: Object.keys(editingRecords).filter(sid => editingRecords[sid].status === 'ABSENT').length,
    late: Object.keys(editingRecords).filter(sid => editingRecords[sid].status === 'LATE').length,
    total: Object.keys(editingRecords).length
  };

  const openSheetRate = openSheetStats.total > 0 
    ? Number(((openSheetStats.present + openSheetStats.late) / openSheetStats.total * 100).toFixed(1))
    : 100;

  return (
    <div className="space-y-6" id="attendance-module">
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

      {/* Upper Module Navigation Tab */}
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/80"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
          )}

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('take')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'take'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Faire l'Appel</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Historique des Feuilles</span>
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 font-medium">
          <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>Suivi assiduité connecté en temps réel avec l'administration</span>
        </span>
      </div>

      {activeTab === 'take' ? (
        /* TAKE ATTENDANCE INTERFACE */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Form setup or stats preview */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm self-start space-y-6">
            {!activeSheetId ? (
              /* Create New Sheet Form */
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-800">Initialiser un Appel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Renseignez la séance pour charger le trombinoscope.</p>
                </div>

                <div className="space-y-4">
                  {/* Class Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Classe d'Enseignement</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({formatCycleLevel(c.level)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Matière / Cours</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Sequence Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Séquence en cours</label>
                    <select
                      value={selectedSequence}
                      onChange={(e) => setSelectedSequence(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {SEQUENCES.map(seq => (
                        <option key={seq.id} value={seq.id}>{seq.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Timeslot Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Créneau Horaire</label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="08:00 - 10:00">Matinée : 08h00 - 10h00</option>
                      <option value="10:00 - 12:00">Matinée : 10h00 - 12h00</option>
                      <option value="12:30 - 14:30">Après-midi : 12h30 - 14h30</option>
                      <option value="14:30 - 16h30">Après-midi : 14h30 - 16h30</option>
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Date du Jour</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateNewSheet}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  <span>Charger les élèves</span>
                </button>
              </div>
            ) : (
              /* Stats for currently open sheet */
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                    Fiche Active
                  </span>
                  <h3 className="text-lg font-display font-bold text-slate-800 mt-2 leading-tight">
                    {activeClassObj?.name}
                  </h3>
                  <p className="text-xs font-semibold font-display mt-1 text-blue-600">
                    {activeSubjectObj?.name}
                  </p>
                </div>

                <div className="space-y-4 border-t border-b border-slate-100 py-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Taux de présence :</span>
                    <span className="font-mono font-bold text-slate-800">{openSheetRate}%</span>
                  </div>

                  {/* Custom progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(openSheetStats.present / openSheetStats.total) * 100}%` }}
                      className="bg-emerald-500"
                      title={`${openSheetStats.present} Présents`}
                    ></div>
                    <div
                      style={{ width: `${(openSheetStats.late / openSheetStats.total) * 100}%` }}
                      className="bg-amber-400"
                      title={`${openSheetStats.late} Retards`}
                    ></div>
                    <div
                      style={{ width: `${(openSheetStats.absent / openSheetStats.total) * 100}%` }}
                      className="bg-rose-500"
                      title={`${openSheetStats.absent} Absents`}
                    ></div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                      <p className="text-[10px] uppercase font-mono font-bold">Présent</p>
                      <p className="text-base font-bold font-mono mt-0.5">{openSheetStats.present}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
                      <p className="text-[10px] uppercase font-mono font-bold">Retard</p>
                      <p className="text-base font-bold font-mono mt-0.5">{openSheetStats.late}</p>
                    </div>
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-800">
                      <p className="text-[10px] uppercase font-mono font-bold">Absent</p>
                      <p className="text-base font-bold font-mono mt-0.5">{openSheetStats.absent}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleMarkAllPresent}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Marquer tous présents
                  </button>
                  
                  <button
                    onClick={handleSaveAttendance}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Enregistrer la Fiche</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSheetId(null);
                      setEditingRecords({});
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Fermer l'appel en cours
                  </button>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-bounce">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Feuille d'appel synchronisée avec succès !</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Students Roll-call List */}
          <div className="xl:col-span-8 space-y-4">
            {!activeSheetId ? (
              /* Welcome / Empty state */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
                <Users className="h-14 w-14 text-slate-300 stroke-[1.5] mb-4" />
                <h3 className="text-lg font-display font-bold text-slate-800">Aucune feuille d'appel ouverte</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  Utilisez le volet de gauche pour configurer la classe, la matière, et charger l'appel nominal de vos élèves.
                </p>
              </div>
            ) : (
              /* Real Roll-call List Grid */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                {/* Roll-call Header and Search */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-display font-bold text-slate-800 text-sm">Appel Nominal</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                      {openSheetStats.total} élèves
                    </span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un élève..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Grid Lists / Table */}
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                  {filteredActiveStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      Aucun élève trouvé pour cette recherche.
                    </div>
                  ) : (
                    filteredActiveStudents.map((stud) => {
                      const editState = editingRecords[stud.id] || { status: 'PRESENT', reason: '', comment: '' };
                      
                      const setStatus = (status: AttendanceStatus) => {
                        setEditingRecords(prev => ({
                          ...prev,
                          [stud.id]: {
                            ...prev[stud.id],
                            status,
                            // clear reason if turning back to present
                            reason: status === 'PRESENT' ? '' : prev[stud.id]?.reason || ''
                          }
                        }));
                      };

                      const setReason = (reason: AbsenceReason) => {
                        setEditingRecords(prev => ({
                          ...prev,
                          [stud.id]: {
                            ...prev[stud.id],
                            reason
                          }
                        }));
                      };

                      const setComment = (comment: string) => {
                        setEditingRecords(prev => ({
                          ...prev,
                          [stud.id]: {
                            ...prev[stud.id],
                            comment
                          }
                        }));
                      };

                      return (
                        <div key={stud.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40">
                          {/* Student identity */}
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-slate-100 font-display font-semibold text-xs text-slate-700 flex items-center justify-center shrink-0">
                              {stud.firstName[0]}{stud.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm leading-snug">
                                {stud.lastName} {stud.firstName}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Parent: {stud.parentName} • {stud.parentPhone}
                              </p>
                            </div>
                          </div>

                          {/* Controls (Present, Late, Absent toggle pills) */}
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Toggle Pills */}
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                              <button
                                onClick={() => setStatus('PRESENT')}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  editState.status === 'PRESENT'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-850'
                                }`}
                              >
                                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden sm:inline">Présent</span>
                              </button>
                              
                              <button
                                onClick={() => setStatus('LATE')}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  editState.status === 'LATE'
                                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-850'
                                }`}
                              >
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden sm:inline">Retard</span>
                              </button>

                              <button
                                onClick={() => setStatus('ABSENT')}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  editState.status === 'ABSENT'
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-850'
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden sm:inline">Absent</span>
                              </button>
                            </div>

                            {/* Conditional Reason / Comment Block */}
                            {editState.status !== 'PRESENT' && (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={editState.reason}
                                  onChange={(e) => setReason(e.target.value as AbsenceReason)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none"
                                >
                                  <option value="">-- Sélectionner Motif --</option>
                                  <option value="MALADIE">Maladie</option>
                                  <option value="AUTORISE">Autorisé (Billet)</option>
                                  <option value="NON_AUTORISE">Non Autorisé</option>
                                  <option value="AUTRE">Autre raison</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Commentaire..."
                                  value={editState.comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none w-28 sm:w-40"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="space-y-6">
          {/* History filters */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={historyClassFilter}
                  onChange={(e) => setHistoryClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                >
                  <option value="All">Toutes les classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleExportClassAttendanceArchive(historyClassFilter === 'All' ? undefined : historyClassFilter)}
                disabled={isExportingArchivePDF}
                className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                title="Génère le registre officiel d'assiduité complet avec statistiques et journal pour les archives administratives"
              >
                <FileText className="h-4 w-4" />
                <span>{isExportingArchivePDF ? "Génération du PDF..." : "Exporter Registre d'Appel (Archives PDF)"}</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Chercher par date, cours..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* List of Previous Sheets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-600 font-display font-semibold">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Classe</th>
                    <th className="p-4">Matière</th>
                    <th className="p-4">Créneau</th>
                    <th className="p-4 text-center">Taux Présence</th>
                    <th className="p-4 text-center">Séquence</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {sheets
                    .filter(s => {
                      if (historyClassFilter !== 'All' && s.classId !== historyClassFilter) return false;
                      if (historySearchQuery) {
                        const subj = SUBJECTS.find(sub => sub.id === s.subjectId)?.name || '';
                        const cl = classes.find(c => c.id === s.classId)?.name || '';
                        const term = `${subj} ${cl} ${s.date}`.toLowerCase();
                        return term.includes(historySearchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((sheet) => {
                      const sClass = classes.find(c => c.id === sheet.classId);
                      const sSubject = SUBJECTS.find(sub => sub.id === sheet.subjectId);
                      
                      // Calculate sheet statistics
                      const sheetRecords = records.filter(r => r.sheetId === sheet.id);
                      const totalCount = sheetRecords.length;
                      const absentCount = sheetRecords.filter(r => r.status === 'ABSENT').length;
                      const lateCount = sheetRecords.filter(r => r.status === 'LATE').length;
                      const presentCount = sheetRecords.filter(r => r.status === 'PRESENT').length;
                      
                      const rate = totalCount > 0 
                        ? Number(((presentCount + lateCount) / totalCount * 100).toFixed(0)) 
                        : 100;

                      return (
                        <tr key={sheet.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-mono text-xs font-semibold text-slate-700">{sheet.date}</td>
                          <td className="p-4 font-semibold text-slate-800">{sClass?.name}</td>
                          <td className="p-4 text-slate-600">{sSubject?.name}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{sheet.timeSlot}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                              rate >= 90
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : rate >= 75
                                ? 'bg-amber-50 text-amber-800 border-amber-100'
                                : 'bg-rose-50 text-rose-800 border-rose-100'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono text-xs font-semibold text-slate-500">Seq {sheet.sequenceId}</td>
                          <td className="p-4 text-right pr-6 space-x-2">
                            <button
                              onClick={() => handleOpenSheet(sheet.id)}
                              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors border border-blue-100 cursor-pointer"
                            >
                              Voir/Modifier
                            </button>
                            <button
                              title="Exporter au format Excel"
                              onClick={() => handleExport('csv', sheet, sClass?.name || '')}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors inline-flex align-middle cursor-pointer"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>
                            <button
                              title="Exporter au format PDF imprimable"
                              onClick={() => handleExport('pdf', sheet, sClass?.name || '')}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-lg transition-colors inline-flex align-middle cursor-pointer"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
