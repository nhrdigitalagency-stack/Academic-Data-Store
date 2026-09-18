/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UploadCloud,
  CheckCircle,
  FileCheck,
  Tag,
  GraduationCap,
  Calendar,
  Lock,
  Unlock,
  Share2,
  X,
  Printer,
  Copy,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { LibraryResource, LibraryResourceType, SchoolTenant, Subject, SchoolClass } from '../types';

interface DigitalLibraryModuleProps {
  resources: LibraryResource[];
  setResources: React.Dispatch<React.SetStateAction<LibraryResource[]>>;
  activeSchool?: SchoolTenant;
  subjects: Subject[];
  classes: SchoolClass[];
  addAuditLog: (action: string, schoolId: string, details: string) => void;
  currentUserRole?: string;
  onBack?: () => void;
}

export default function DigitalLibraryModule({
  resources,
  setResources,
  activeSchool,
  subjects,
  classes,
  addAuditLog,
  currentUserRole = 'school_admin',
  onBack
}: DigitalLibraryModuleProps) {
  // Tabs: 'explore' | 'stats' | 'upload'
  const [activeTab, setActiveTab] = useState<'explore' | 'stats' | 'upload'>('explore');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Document Viewer Modal State
  const [viewingResource, setViewingResource] = useState<LibraryResource | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<LibraryResourceType>('ÉPREUVE');
  const [uploadSubjectId, setUploadSubjectId] = useState(subjects[0]?.id || 'subj-math');
  const [uploadClassLevel, setUploadClassLevel] = useState('Terminale C');
  const [uploadExamType, setUploadExamType] = useState<'BAC' | 'PROBATOIRE' | 'BEPC' | 'SÉQUENCE' | 'AUTRE'>('BAC');
  const [uploadYear, setUploadYear] = useState(2026);
  const [uploadVisibility, setUploadVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('Mathématiques, BAC, Annales');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('Professeur Titulaire');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});

  // Loading indicator for active downloads
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // In-app Notification Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle document view
  const handleOpenDocument = (res: LibraryResource) => {
    setViewingResource(res);
    setResources(prev => prev.map(r => r.id === res.id ? { ...r, viewCount: r.viewCount + 1 } : r));
  };

  // Handle document download
  const handleDownload = (res: LibraryResource) => {
    setDownloadingId(res.id);
    
    // Simulate generation and package creation
    setTimeout(() => {
      setResources(prev => prev.map(r => r.id === res.id ? { ...r, downloadCount: r.downloadCount + 1 } : r));
      
      const content = `========================================================================
MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES (MINESEC) - RÉPUBLIQUE DU CAMEROUN
ÉTABLISSEMENT : ${(activeSchool?.name || 'ÉTABLISSEMENT').toUpperCase()}
PORTAIL ACADEMIC DATA STORE • BIBLIOTHÈQUE NUMÉRIQUE PÉDAGOGIQUE
========================================================================

DOCUMENT : ${res.title.toUpperCase()}
TYPE : ${res.type} • NIVEAU : ${res.classLevel} • MATIÈRE : ${res.subjectName}
ANNÉE ACADÉMIQUE : ${res.year} • ACCÈS : ${res.visibility}
DÉPOSÉ PAR : ${res.uploadedBy} LE ${res.uploadedAt}

------------------------------------------------------------------------
DESCRIPTIF :
${res.description}

------------------------------------------------------------------------
CONTENU PÉDAGOGIQUE DU DOCUMENT :
${res.contentPreview || 'Contenu complet certifié par l\'inspection pédagogique de l\'établissement.'}

========================================================================
Téléchargé depuis la plateforme ADS Store de ${activeSchool.name}
Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
========================================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${res.title.replace(/[^a-zA-Z0-9]/g, '_')}_${activeSchool.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addAuditLog('Téléchargement Document', activeSchool.id, `Téléchargement de la ressource "${res.title}" (${res.type}).`);
      setDownloadingId(null);
      showToast(`Document "${res.title}" téléchargé avec succès.`, 'success');
    }, 600);
  };

  // Handle new resource submission
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string; description?: string } = {};

    if (!uploadTitle.trim()) {
      errors.title = 'Le titre officiel du document est obligatoire.';
    }
    if (!uploadDescription.trim()) {
      errors.description = 'Veuillez saisir un descriptif pédagogique pour orienter les élèves.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Veuillez corriger les champs requis dans le formulaire.', 'error');
      return;
    }

    setFormErrors({});
    setIsUploading(true);

    const subjectObj = subjects.find(s => s.id === uploadSubjectId);
    const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);

    const newRes: LibraryResource = {
      id: `lib-${Date.now()}`,
      schoolId: activeSchool.id,
      title: uploadTitle.trim(),
      description: uploadDescription.trim(),
      type: uploadType,
      subjectId: uploadSubjectId,
      subjectName: subjectObj?.name || 'Matière Générale',
      classLevel: uploadClassLevel,
      examType: uploadExamType,
      year: Number(uploadYear),
      visibility: uploadVisibility,
      fileFormat: 'PDF',
      fileSize: '1.8 MB',
      downloadCount: 0,
      viewCount: 1,
      uploadedBy: uploadAuthor.trim() || 'Enseignant Titulaire',
      uploadedAt: new Date().toISOString().split('T')[0],
      tags: tagsArray.length > 0 ? tagsArray : ['Pédagogie', 'Document'],
      contentPreview: uploadContent.trim() || `${uploadTitle}\n\nDocument pédagogique officiel préparé par ${uploadAuthor} pour la classe de ${uploadClassLevel}.`
    };

    setTimeout(() => {
      setResources(prev => [newRes, ...prev]);
      setIsUploading(false);
      setUploadSuccess(true);
      addAuditLog('Dépôt Document Bibliothèque', activeSchool.id, `Dépôt du document "${newRes.title}" (${newRes.type}) par ${newRes.uploadedBy}.`);
      showToast(`Document "${newRes.title}" ajouté à la bibliothèque avec succès.`, 'success');

      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab('explore');
        setUploadTitle('');
        setUploadDescription('');
        setUploadContent('');
      }, 1200);
    }, 800);
  };

  // Filtered resources list
  const filteredResources = resources.filter(res => {
    if (selectedType !== 'ALL' && res.type !== selectedType) return false;
    if (selectedSubject !== 'ALL' && res.subjectId !== selectedSubject) return false;
    if (selectedLevel !== 'ALL' && res.classLevel !== selectedLevel) return false;
    if (selectedVisibility !== 'ALL' && res.visibility !== selectedVisibility) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = res.title.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchTags = res.tags.some(t => t.toLowerCase().includes(q));
      const matchSubject = res.subjectName.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTags || matchSubject;
    }
    return true;
  });

  // Top downloaded resources
  const topDownloaded = [...resources].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 4);

  return (
    <div className="space-y-6" id="digital-library-module">
      
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toastMessage.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2 flex-wrap">
              Bibliothèque Numérique — Épreuves & Cours
              <span className="text-xs bg-blue-50 text-blue-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                {resources.length} documents
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Annales d'examens nationaux (BAC, Probatoire, BEPC), cours magistraux, fiches et corrigés types
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch md:self-auto justify-center overflow-x-auto">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Catalogue ({filteredResources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Tendances & Top</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Déposer un Document</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXPLORATION DU CATALOGUE DE RESSOURCES */}
      {/* ========================================================================= */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une épreuve, un cours, un thème (ex: Intégrales, BAC C, Génétique...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800"
                />
              </div>

              {/* Quick Type Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                {['ALL', 'ÉPREUVE', 'CORRIGÉ', 'COURS', 'FICHE_RÉVISION'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap ${
                      selectedType === t
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Tout le catalogue' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Filters Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Matière :</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-medium cursor-pointer text-slate-800"
                >
                  <option value="ALL">Toutes les matières</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Niveau / Classe :</label>
                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-medium cursor-pointer text-slate-800"
                >
                  <option value="ALL">Tous les niveaux (6e à Tle)</option>
                  <option value="Terminale C">Terminale C</option>
                  <option value="Terminale D">Terminale D</option>
                  <option value="3ème Allemand">3ème Allemand / Espagnol</option>
                  <option value="Toutes classes">Toutes classes</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Visibilité d'Accès :</label>
                <select
                  value={selectedVisibility}
                  onChange={e => setSelectedVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-medium cursor-pointer text-slate-800"
                >
                  <option value="ALL">Tous les accès (Public & Privé)</option>
                  <option value="PUBLIC">Accès Public (Libre)</option>
                  <option value="PRIVATE">Accès Privé (Élèves & Profs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">Aucun document ne correspond à vos critères de recherche</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Modifiez vos filtres ci-dessus ou déposez la première ressource pédagogique pour votre établissement.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('ALL');
                    setSelectedSubject('ALL');
                    setSelectedLevel('ALL');
                    setSelectedVisibility('ALL');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Réinitialiser les filtres
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Déposer un document</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(res => (
                <div
                  key={res.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap ${
                        res.type === 'ÉPREUVE' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        res.type === 'CORRIGÉ' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                        res.type === 'COURS' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        {res.type}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold whitespace-nowrap">
                          {res.fileFormat} • {res.fileSize}
                        </span>
                        {res.visibility === 'PUBLIC' ? (
                          <span className="text-emerald-600" title="Accès Public Libre">
                            <Unlock className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-amber-600" title="Accès Privé Établissement">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Subject */}
                    <div>
                      <span className="text-[11px] font-mono font-bold text-blue-600 block truncate">
                        {res.subjectName} • {res.classLevel}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug font-display group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-2">
                        {res.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {res.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {res.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer actions & Stats */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="truncate max-w-[120px]">Par {res.uploadedBy.split(' ')[0]}</span>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>{res.viewCount}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-blue-600 font-bold">
                          <Download className="h-3 w-3" />
                          <span>{res.downloadCount}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDocument(res)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Consulter</span>
                      </button>
                      <button
                        onClick={() => handleDownload(res)}
                        disabled={downloadingId === res.id}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-75"
                      >
                        {downloadingId === res.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Export...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            <span>Télécharger</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TENDANCES & STATISTIQUES */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Ressources Déposées</span>
              <div className="text-3xl font-extrabold font-mono text-slate-900">{resources.length}</div>
              <span className="text-xs text-emerald-600 font-medium">100% conformes MINESEC</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Consultations Totales</span>
              <div className="text-3xl font-extrabold font-mono text-blue-600">
                {resources.reduce((acc, r) => acc + r.viewCount, 0).toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 font-medium">Vues par les élèves et enseignants</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Téléchargements Effectués</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-600">
                {resources.reduce((acc, r) => acc + r.downloadCount, 0).toLocaleString()}
              </div>
              <span className="text-xs text-emerald-600 font-medium">Fichiers & Annales exportés</span>
            </div>
          </div>

          {/* Top Downloaded Resources Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>Palmarès des Documents les Plus Téléchargés</span>
            </h3>

            {topDownloaded.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Aucun document enregistré pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {topDownloaded.map((res, index) => (
                  <div key={res.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{res.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {res.subjectName} • {res.classLevel} • Déposé par {res.uploadedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-auto shrink-0">
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 text-xs">{res.downloadCount} téléch.</span>
                        <span className="block text-[10px] text-slate-400">{res.viewCount} vues</span>
                      </div>
                      <button
                        onClick={() => handleDownload(res)}
                        disabled={downloadingId === res.id}
                        className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-75 transition-colors"
                      >
                        {downloadingId === res.id ? 'Export...' : 'Télécharger'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DÉPOSER UN DOCUMENT (ENSEIGNANTS & ADMIN) */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
              <UploadCloud className="h-4 w-4" />
              <span>Espace Enseignant / Administration</span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
              Mettre en Ligne une Ressource Pédagogique
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Partagez une épreuve d'examen, un cours ou un corrigé type avec votre communauté scolaire.
            </p>
          </div>

          {uploadSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-900 text-sm">Ressource publiée avec succès !</h3>
              <p className="text-xs text-emerald-700">Le document est maintenant accessible dans le catalogue.</p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Titre officiel du Document <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Épreuve de Physique-Chimie - Baccalauréat C 2025"
                  value={uploadTitle}
                  onChange={e => {
                    setUploadTitle(e.target.value);
                    if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:bg-white text-xs font-medium text-slate-800 transition-all ${
                    formErrors.title ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                />
                {formErrors.title && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{formErrors.title}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Type de Ressource <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={uploadType}
                    onChange={e => setUploadType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer font-bold text-slate-800"
                  >
                    <option value="ÉPREUVE">ÉPREUVE D'EXAMEN / DEVOIR</option>
                    <option value="CORRIGÉ">CORRIGÉ TYPE DÉTAILLÉ</option>
                    <option value="COURS">COURS MAGISTRAL / POLYCOPIÉ</option>
                    <option value="FICHE_RÉVISION">FICHE DE RÉVISION SYNTHÉTIQUE</option>
                    <option value="VIDÉO">VIDÉO PÉDAGOGIQUE</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Matière <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={uploadSubjectId}
                    onChange={e => setUploadSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer text-slate-800"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Niveau / Classe</label>
                  <select
                    value={uploadClassLevel}
                    onChange={e => setUploadClassLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer text-slate-800"
                  >
                    <option value="Terminale C">Terminale C</option>
                    <option value="Terminale D">Terminale D</option>
                    <option value="3ème Allemand">3ème</option>
                    <option value="Toutes classes">Toutes classes</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Année</label>
                  <input
                    type="number"
                    value={uploadYear}
                    onChange={e => setUploadYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Visibilité</label>
                  <select
                    value={uploadVisibility}
                    onChange={e => setUploadVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white cursor-pointer font-bold text-blue-600"
                  >
                    <option value="PUBLIC">Public (Accessible à tous)</option>
                    <option value="PRIVATE">Privé (Élèves & Profs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Description succincte <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Sujet complet avec exercices sur l'induction électromagnétique et l'optique ondulatoire..."
                  value={uploadDescription}
                  onChange={e => {
                    setUploadDescription(e.target.value);
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined }));
                  }}
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl focus:bg-white text-xs text-slate-800 transition-all ${
                    formErrors.description ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                />
                {formErrors.description && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{formErrors.description}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Contenu Pédagogique / Texte intégral du document
                </label>
                <textarea
                  rows={5}
                  placeholder="Collez ici le texte complet du devoir, les exercices ou le corrigé..."
                  value={uploadContent}
                  onChange={e => setUploadContent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono text-[11px] leading-relaxed text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tags (séparés par virgule)</label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auteur / Enseignant</label>
                  <input
                    type="text"
                    value={uploadAuthor}
                    onChange={e => setUploadAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Publication en cours...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Publier dans la Bibliothèque Numérique</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT VIEWER MODAL (CONSULTATION INTERACTIVE) */}
      {/* ========================================================================= */}
      {viewingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {viewingResource.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    {viewingResource.subjectName} • {viewingResource.classLevel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {viewingResource.title}
                </h3>
              </div>

              <button
                onClick={() => setViewingResource(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Viewer */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-[11px] text-blue-900 font-mono">
                <span>Déposé par : {viewingResource.uploadedBy} ({viewingResource.uploadedAt})</span>
                <span>{viewingResource.downloadCount} téléchargements</span>
              </div>

              <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed whitespace-pre-line shadow-inner border border-slate-800 select-text">
                {viewingResource.contentPreview || viewingResource.description}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingResource.contentPreview || viewingResource.description);
                  showToast('Texte du document copié dans le presse-papiers.', 'info');
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copier le texte</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewingResource(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingResource);
                    setViewingResource(null);
                  }}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger le Fichier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
