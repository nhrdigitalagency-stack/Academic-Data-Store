/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog, SchoolTenant } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  Layers, 
  Terminal, 
  Download, 
  Trash2,
  CalendarDays,
  FileCheck,
  UserCheck,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AuditLogManagerProps {
  auditLogs: AuditLog[];
  schools: SchoolTenant[];
  onClearLogs?: () => void;
}

export default function AuditLogManager({
  auditLogs,
  schools,
  onClearLogs
}: AuditLogManagerProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');

  // Filter computation
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSchool = selectedSchoolId === 'all' || log.schoolId === selectedSchoolId;
    
    let matchesAction = true;
    if (selectedActionType !== 'all') {
      matchesAction = log.action.toLowerCase().includes(selectedActionType.toLowerCase());
    }
    
    return matchesSearch && matchesSchool && matchesAction;
  });

  // Action categories for filter
  const actionCategories = [
    { value: 'all', label: "Tous types d'actions" },
    { value: 'Validation', label: "Validation de notes" },
    { value: 'Saisie', label: "Saisie d'absences / Appel" },
    { value: 'élève', label: "Mises à jour Élèves" },
    { value: 'thème', label: "Thèmes & Chartes graphiques" },
    { value: 'établissement', label: "Actions Locataires" },
  ];

  // Quick stats
  const totalLogs = filteredLogs.length;
  const gradeValidationCount = filteredLogs.filter(l => l.action.includes('Validation') || l.action.includes('notes')).length;
  const attendanceCount = filteredLogs.filter(l => l.action.includes('absences') || l.action.includes('Saisie') || l.action.includes('Appel')).length;
  const tenantActionCount = filteredLogs.filter(l => l.action.includes('établissement') || l.action.includes('Création') || l.action.includes('Suppression') || l.action.includes('thème') || l.action.includes('Licence')).length;

  return (
    <div className="space-y-6" id="audit-log-manager-root">
      
      {/* Metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Logs Filtrés</p>
            <p className="text-xl font-extrabold text-slate-800 font-mono mt-1 leading-none">{totalLogs}</p>
          </div>
        </div>

        {/* Grade actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Validations de Notes</p>
            <p className="text-xl font-extrabold text-blue-600 font-mono mt-1 leading-none">{gradeValidationCount}</p>
          </div>
        </div>

        {/* Attendance actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Saisies de Présences</p>
            <p className="text-xl font-extrabold text-emerald-600 font-mono mt-1 leading-none">{attendanceCount}</p>
          </div>
        </div>

        {/* Admin tenant actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Actions Système</p>
            <p className="text-xl font-extrabold text-amber-600 font-mono mt-1 leading-none">{tenantActionCount}</p>
          </div>
        </div>
      </div>

      {/* Audit ledger filter options */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search, filters & clear */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par action, détails, tuteur, élève..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 font-medium transition-all"
            />
          </div>

          <div className="flex items-center space-x-3 flex-wrap gap-2.5">
            {/* School Tenant Dropdown Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Établissement :</span>
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer hover:bg-slate-50"
              >
                <option value="all">Tous les locataires</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.logoEmoji || '🏫'} {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action types selection */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Catégorie :</span>
              <select
                value={selectedActionType}
                onChange={e => setSelectedActionType(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer hover:bg-slate-50"
              >
                {actionCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear logs option (SuperAdmin privileged action) */}
            {onClearLogs && auditLogs.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir vider l'historique complet de la console d'audit ? Cette action est irréversible.")) {
                    onClearLogs();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white"
                title="Vider tous les logs de l'application"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ledger logs list view */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3.5">
              <History className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-500">Aucun log d'audit ne correspond à vos filtres</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Modifiez vos critères de recherche pour afficher les événements enregistrés dans le système.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Horodatage (UTC)</th>
                  <th className="py-3 px-4">Établissement</th>
                  <th className="py-3 px-4">Action Critique</th>
                  <th className="py-3 px-6">Journalisation des Détails de l'Activité</th>
                  <th className="py-3 px-4">Utilisateur / Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 font-mono">
                {filteredLogs.map(log => {
                  // Type of action categorization badge
                  let actionBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (log.action.includes('Validation') || log.action.includes('notes')) {
                    actionBadgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
                  } else if (log.action.includes('absences') || log.action.includes('appel') || log.action.includes('Appel') || log.action.includes('Saisie')) {
                    actionBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  } else if (log.action.includes('élève') || log.action.includes('Profil')) {
                    actionBadgeClass = 'bg-purple-50 text-purple-700 border-purple-100';
                  } else if (log.action.includes('établissement') || log.action.includes('Création') || log.action.includes('Suppression')) {
                    actionBadgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                  } else if (log.action.includes('thème') || log.action.includes('Réinitialisation')) {
                    actionBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                  }

                  // Date formatter
                  const formattedTime = new Date(log.timestamp).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500 font-normal">
                        {formattedTime}
                      </td>

                      {/* School Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 font-sans">
                        {log.schoolName}
                      </td>

                      {/* Action Tag */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] font-bold font-sans uppercase tracking-wider ${actionBadgeClass}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-6 font-sans text-slate-600 font-medium max-w-sm sm:max-w-md md:max-w-lg leading-relaxed">
                        {log.details}
                      </td>

                      {/* Operator User */}
                      <td className="py-3.5 px-4 font-normal text-slate-500 font-mono text-[11px] truncate max-w-[120px]">
                        {log.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Security warning footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center space-x-2 text-[10px] text-slate-400">
          <Info className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            <strong>Note de Sécurité :</strong> Tous les logs de la console d'audit sont scellés et cryptographiquement isolés par établissement locataire. Seul le super administrateur de la plateforme MINESEC possède les droits de supervision centralisée multi-établissements.
          </span>
        </div>

      </div>
    </div>
  );
}
