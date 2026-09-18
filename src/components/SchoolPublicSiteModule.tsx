/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageSquare,
  Newspaper,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  School,
  AlertCircle,
  X,
  Info,
  ArrowLeft
} from 'lucide-react';
import {
  SchoolTenant,
  SchoolPublicSiteConfig,
  SchoolSection,
  SchoolAdmissionConfig,
  SchoolArticle,
  ExamResultPublication,
  PreRegistrationSubmission
} from '../types';
import { formatCycleLevel } from '../utils/cycleUtils';

interface SchoolPublicSiteModuleProps {
  activeSchool?: SchoolTenant;
  siteConfig: SchoolPublicSiteConfig;
  setSiteConfig: React.Dispatch<React.SetStateAction<SchoolPublicSiteConfig>>;
  sections: SchoolSection[];
  setSections: React.Dispatch<React.SetStateAction<SchoolSection[]>>;
  admissionConfig: SchoolAdmissionConfig;
  setAdmissionConfig: React.Dispatch<React.SetStateAction<SchoolAdmissionConfig>>;
  articles: SchoolArticle[];
  setArticles: React.Dispatch<React.SetStateAction<SchoolArticle[]>>;
  examResults: ExamResultPublication[];
  setExamResults: React.Dispatch<React.SetStateAction<ExamResultPublication[]>>;
  preRegistrations: PreRegistrationSubmission[];
  setPreRegistrations: React.Dispatch<React.SetStateAction<PreRegistrationSubmission[]>>;
  addAuditLog: (action: string, schoolId: string, details: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onBack?: () => void;
}

export default function SchoolPublicSiteModule({
  activeSchool,
  siteConfig,
  setSiteConfig,
  sections,
  setSections,
  admissionConfig,
  setAdmissionConfig,
  articles,
  setArticles,
  examResults,
  setExamResults,
  preRegistrations,
  setPreRegistrations,
  addAuditLog,
  onNavigateToTab,
  onBack
}: SchoolPublicSiteModuleProps) {
  // Mode switch: 'visitor' (Public Live Site) vs 'cms' (Content Management System)
  const [viewMode, setViewMode] = useState<'visitor' | 'cms'>('visitor');
  const [activeSiteSection, setActiveSiteSection] = useState<'presentation' | 'sections' | 'admission' | 'news' | 'results'>('presentation');

  // Visitor Pre-registration form state
  const [candidateFirstName, setCandidateFirstName] = useState('');
  const [candidateLastName, setCandidateLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [requestedClass, setRequestedClass] = useState('6ème Bilingue');
  const [previousSchool, setPreviousSchool] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<PreRegistrationSubmission | null>(null);

  // Exam search state
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [selectedExamType, setSelectedExamType] = useState<string>('ALL');

  // CMS Article creation state
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtCategory, setNewArtCategory] = useState<SchoolArticle['category']>('Actualité');
  const [newArtSummary, setNewArtSummary] = useState('');
  const [newArtContent, setNewArtContent] = useState('');
  const [newArtAuthor, setNewArtAuthor] = useState('Direction des Études');
  const [newArtImage, setNewArtImage] = useState('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop');

  // CMS Exam result creation state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamType, setNewExamType] = useState<ExamResultPublication['examType']>('BAC');
  const [newExamYear, setNewExamYear] = useState(new Date().getFullYear());
  const [newExamSession, setNewExamSession] = useState(`Session Juin ${new Date().getFullYear()}`);
  const [newExamSeries, setNewExamSeries] = useState('Générale');
  const [newExamCandidates, setNewExamCandidates] = useState(0);
  const [newExamAdmitted, setNewExamAdmitted] = useState(0);

  // Article Reader Modal state
  const [readingArticle, setReadingArticle] = useState<SchoolArticle | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePreRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateFirstName || !candidateLastName || !parentPhone || !parentName) {
      showToast('Veuillez remplir tous les champs obligatoires du dossier de pré-inscription (*).', 'error');
      return;
    }

    const newSubmission: PreRegistrationSubmission = {
      id: `pre-${Date.now()}`,
      schoolId: activeSchool.id,
      candidateFirstName,
      candidateLastName,
      birthDate,
      gender,
      requestedClass,
      previousSchool: previousSchool || 'Établissement précédent',
      parentName,
      parentPhone,
      parentEmail,
      status: 'EN_ATTENTE',
      submittedAt: new Date().toISOString(),
      notes: 'Demande soumise via le portail public de l\'établissement.'
    };

    setPreRegistrations(prev => [newSubmission, ...prev]);
    setSubmittedReceipt(newSubmission);
    setSubmissionSuccess(true);
    addAuditLog(
      'Nouvelle pré-inscription',
      activeSchool.id,
      `Dossier reçu pour le candidat ${candidateFirstName} ${candidateLastName} en ${requestedClass} (Parent: ${parentName} - ${parentPhone}).`
    );

    // Reset form fields
    setCandidateFirstName('');
    setCandidateLastName('');
    setPreviousSchool('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle || !newArtSummary) return;

    const newArt: SchoolArticle = {
      id: `art-${Date.now()}`,
      schoolId: activeSchool.id,
      title: newArtTitle,
      category: newArtCategory,
      date: new Date().toISOString().split('T')[0],
      author: newArtAuthor,
      summary: newArtSummary,
      content: newArtContent || newArtSummary,
      imageUrl: newArtImage,
      featured: articles.length === 0
    };

    setArticles(prev => [newArt, ...prev]);
    setIsArticleModalOpen(false);
    setNewArtTitle('');
    setNewArtSummary('');
    setNewArtContent('');
    addAuditLog('Publication Actualité', activeSchool.id, `Publication de l'article "${newArt.title}" sur le site public.`);
  };

  const handleCreateExamResult = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Math.round((newExamAdmitted / (newExamCandidates || 1)) * 10000) / 100;
    const newResult: ExamResultPublication = {
      id: `res-${Date.now()}`,
      schoolId: activeSchool.id,
      examType: newExamType,
      year: Number(newExamYear),
      session: newExamSession,
      series: newExamSeries,
      totalCandidates: Number(newExamCandidates),
      admittedCount: Number(newExamAdmitted),
      successRate: rate,
      honorRoll: [
        { studentName: 'Lauréat Majeur', mention: 'Très Bien', series: newExamSeries }
      ],
      publishDate: new Date().toISOString().split('T')[0]
    };

    setExamResults(prev => [newResult, ...prev]);
    setIsExamModalOpen(false);
    addAuditLog('Publication Résultats Examen', activeSchool.id, `Publication officielle des résultats ${newExamType} ${newExamYear} (${rate}% de réussite).`);
  };

  const filteredExamResults = examResults.filter(r => {
    if (selectedExamType !== 'ALL' && r.examType !== selectedExamType) return false;
    if (examSearchQuery) {
      const q = examSearchQuery.toLowerCase();
      const matchType = r.examType.toLowerCase().includes(q);
      const matchSeries = r.series.toLowerCase().includes(q);
      const matchSession = r.session.toLowerCase().includes(q);
      const matchStudents = r.honorRoll?.some(h => h.studentName.toLowerCase().includes(q));
      return matchType || matchSeries || matchSession || matchStudents;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar & Mode Switch */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
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
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                Site Public de l’Établissement
                <span className="text-xs bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  En Ligne & Indexé
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Vitrine officielle, filières, pré-inscriptions en ligne et résultats d'examens • MINESEC Cameroun
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setViewMode('visitor')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'visitor'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Vue Visiteur (Mini-Site Live)</span>
          </button>
          <button
            onClick={() => setViewMode('cms')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Console CMS & Administration</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VISITOR EXPERIENCE (MINI-SITE PUBLIC LIVE) */}
      {/* ========================================================================= */}
      {viewMode === 'visitor' && (
        <div className="space-y-6">
          {/* Hero Banner with Official Identity */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 md:p-12 shadow-xl border border-slate-800">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            
            <div className="relative z-10 max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  RÉPUBLIQUE DU CAMEROUN • MINESEC
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] font-mono font-bold px-3 py-1 rounded-full">
                  Année Scolaire {activeSchool.activeSchoolYear}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner shrink-0">
                  {activeSchool.logoEmoji || '🏫'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                    {activeSchool.name}
                  </h1>
                  <p className="text-base text-blue-200 italic font-serif mt-1">
                    « {activeSchool.slogan || 'Discipline - Travail - Succès'} »
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-2 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" />
                    <span>{activeSchool.address}</span>
                    <span>•</span>
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{activeSchool.phone}</span>
                  </p>
                </div>
              </div>

              {/* Quick KPI stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-emerald-400">{siteConfig.stats.bacSuccessRate}%</div>
                  <div className="text-[10px] text-slate-300 uppercase font-mono mt-0.5">Réussite Examens</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-blue-300">{siteConfig.stats.studentCount}</div>
                  <div className="text-[10px] text-slate-300 uppercase font-mono mt-0.5">Élèves Inscrits</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-amber-300">{siteConfig.stats.teacherCount}</div>
                  <div className="text-[10px] text-slate-300 uppercase font-mono mt-0.5">Professeurs Titulaires</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold font-mono text-violet-300">100% Bilingue</div>
                  <div className="text-[10px] text-slate-300 uppercase font-mono mt-0.5">Français & English</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setActiveSiteSection('admission')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Dossier de Pré-inscription en Ligne</span>
                </button>
                <button
                  onClick={() => setActiveSiteSection('results')}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>Consulter les Résultats Officiels</span>
                </button>
                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab('library')}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-blue-300" />
                    <span>Bibliothèque d’Épreuves & Cours</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Bar for Site Sections */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'presentation', label: 'Présentation & Mot du Proviseur', icon: School },
              { id: 'sections', label: 'Filières & Niveaux d\'Études', icon: Layers },
              { id: 'admission', label: 'Modalités d\'Inscription & Tarifs', icon: FileCheck },
              { id: 'news', label: 'Actualités & Vie Scolaire', icon: Newspaper },
              { id: 'results', label: 'Publication des Examens (BAC/BEPC)', icon: Trophy },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSiteSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSiteSection(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* SECTION 1: PRÉSENTATION & MOT DU CHEF D'ÉTABLISSEMENT */}
          {/* ================================================================= */}
          {activeSiteSection === 'presentation' && (
            <div className="space-y-6">
              {/* Mot du Proviseur */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-64 shrink-0 flex flex-col items-center text-center space-y-3">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-md border-4 border-white ring-1 ring-slate-200 bg-slate-100">
                      <img
                        src={siteConfig.principalPhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'}
                        alt={siteConfig.principalName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{siteConfig.principalName}</h3>
                      <p className="text-[11px] text-blue-600 font-mono mt-0.5">{siteConfig.principalTitle}</p>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2.5 py-1 rounded-full border border-blue-100">
                      MINESEC Officiel
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                      <MessageSquare className="h-4 w-4" />
                      <span>Message du Chef d’Établissement</span>
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 leading-snug">
                      Former avec passion, rigueur et excellence les bâtisseurs de demain
                    </h2>
                    <div className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-3 font-normal">
                      {siteConfig.principalMessage}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique, Mission & Vision */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <School className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Historique & Patrimoine</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{siteConfig.historyText}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Notre Mission Éducative</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{siteConfig.missionText}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Notre Vision 2030</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{siteConfig.visionText}</p>
                </div>
              </div>

              {/* Galerie d'infrastructures */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>Nos Infrastructures Pédagogiques & Cadre de Vie</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {siteConfig.gallery.map(img => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 h-48">
                      <img
                        src={img.imageUrl}
                        alt={img.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <span className="text-[9px] bg-blue-600 text-white font-mono px-2 py-0.5 rounded-full w-fit mb-1 font-bold">
                          {img.category}
                        </span>
                        <p className="text-xs font-bold text-white leading-tight drop-shadow-sm">{img.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 2: FILIÈRES & NIVEAUX D'ÉTUDES DISPONIBLES */}
          {/* ================================================================= */}
          {activeSiteSection === 'sections' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-5 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold font-display">Offre Pédagogique et Filières d’Excellence</h3>
                  <p className="text-xs text-blue-700 font-mono mt-0.5">
                    Programmes conformes aux référentiels officiels du MINESEC et de l'Office du Baccalauréat du Cameroun (OBC).
                  </p>
                </div>
                <button
                  onClick={() => setActiveSiteSection('admission')}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
                >
                  Postuler à une Filière
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(section => (
                  <div key={section.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 hover:border-blue-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-bold px-2 py-0.5 rounded-md">
                            {section.code}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base font-display mt-1">{section.title}</h4>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2.5 py-1 rounded-full font-bold">
                        {formatCycleLevel(section.level)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{section.description}</p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">Matières phares & Coefficients :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {section.keySubjects.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded-md border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="font-bold text-slate-700 block">Conditions d'accès :</span>
                        <p className="text-slate-600 italic text-[11px] mt-0.5">{section.requirements}</p>
                      </div>

                      <div className="pt-1">
                        <span className="font-bold text-slate-700 block">Débouchés & Écoles supérieures :</span>
                        <p className="text-emerald-700 text-[11px] mt-0.5">{section.careerOpportunities}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 3: MODALITÉS D'INSCRIPTION & PRÉ-INSCRIPTION EN LIGNE */}
          {/* ================================================================= */}
          {activeSiteSection === 'admission' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Informations & Barème des Frais (Left 5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Calendrier de la Rentrée */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Calendar className="h-5 w-5" />
                    <h3 className="font-bold text-slate-900 text-sm font-display">Calendrier d'Inscription {admissionConfig.academicYear}</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Ouverture des candidatures</span>
                      <span className="font-bold font-mono text-slate-900">{admissionConfig.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-100">
                      <span className="font-medium">Date limite de dépôt</span>
                      <span className="font-bold font-mono">{admissionConfig.deadlineDate}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-600 font-medium">Rentrée scolaire officielle</span>
                      <span className="font-bold font-mono text-blue-600">01 Septembre 2025</span>
                    </div>
                  </div>
                </div>

                {/* Pièces à Fournir */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>Dossier & Pièces Officielles à Fournir</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {admissionConfig.requiredDocuments.map((doc, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grille des Frais de Scolarité & APE */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Grille des Frais de Scolarité & APEE</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    {admissionConfig.fees.map((fee, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <span className="font-bold text-slate-800">{fee.label}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{fee.period}</span>
                        </div>
                        <span className="font-bold font-mono text-slate-900 text-sm">
                          {fee.amount.toLocaleString()} {fee.currency}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between items-center text-sm font-bold bg-blue-50 p-3 rounded-xl text-blue-950 border border-blue-100">
                      <span>Total approximatif annuel :</span>
                      <span className="font-mono text-base text-blue-700">
                        {admissionConfig.fees.reduce((acc, f) => acc + f.amount, 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire de Pré-Inscription en Ligne (Right 7 Cols) */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4" />
                      <span>Guichet Numérique Candidats</span>
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
                      Formulaire de Pré-Inscription en Ligne
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Remplissez ce formulaire pour réserver une place et générer votre accusé de réception officiel.
                    </p>
                  </div>

                  {submissionSuccess && submittedReceipt && (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center space-x-3 text-emerald-800">
                        <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">Pré-inscription Enregistrée avec Succès !</h4>
                          <p className="text-xs text-emerald-700 font-mono mt-0.5">
                            Réf. Dossier : <span className="font-bold">{submittedReceipt.id.toUpperCase()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Candidat :</span>
                          <span className="font-bold">{submittedReceipt.candidateFirstName} {submittedReceipt.candidateLastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Classe sollicitée :</span>
                          <span className="font-bold text-blue-600">{submittedReceipt.requestedClass}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Parent tuteur :</span>
                          <span className="font-bold">{submittedReceipt.parentName} ({submittedReceipt.parentPhone})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Statut :</span>
                          <span className="bg-amber-100 text-amber-800 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                            EN ATTENTE DE VALIDATION
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          <span>Imprimer le Récépissé de Pré-inscription</span>
                        </button>
                        <button
                          onClick={() => setSubmissionSuccess(false)}
                          className="px-4 py-2 bg-white text-slate-600 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                        >
                          Nouveau dossier
                        </button>
                      </div>
                    </div>
                  )}

                  {!submissionSuccess && (
                    <form onSubmit={handlePreRegistrationSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nom de l'élève <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="ex: NDONGO"
                            value={candidateLastName}
                            onChange={e => setCandidateLastName(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Prénom(s) de l'élève <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="ex: Jean-Baptiste"
                            value={candidateFirstName}
                            onChange={e => setCandidateFirstName(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Date de naissance <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={birthDate}
                            onChange={e => setBirthDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Genre <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={gender}
                            onChange={e => setGender(e.target.value as 'M' | 'F')}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                          >
                            <option value="M">Masculin (M)</option>
                            <option value="F">Féminin (F)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Classe Sollicitée <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={requestedClass}
                            onChange={e => setRequestedClass(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer font-bold text-blue-600"
                          >
                            <option value="Terminale C">Terminale C (Scientifique)</option>
                            <option value="Terminale D">Terminale D (SVT)</option>
                            <option value="Terminale A4">Terminale A4 (Littéraire)</option>
                            <option value="Terminale TI">Terminale TI (Informatique)</option>
                            <option value="1ère C">Première C</option>
                            <option value="1ère D">Première D</option>
                            <option value="3ème Allemand">3ème Allemand / Espagnol</option>
                            <option value="6ème Bilingue">6ème Cycle Bilingue</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Établissement de provenance
                        </label>
                        <input
                          type="text"
                          placeholder="ex: Collège Vogt / Lycée Général Leclerc"
                          value={previousSchool}
                          onChange={e => setPreviousSchool(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Parent details */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <span className="text-xs font-bold text-slate-800 font-display block">
                          Informations du Parent / Tuteur Légal
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Nom complet du Parent <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ex: M. NDONGO Pierre"
                              value={parentName}
                              onChange={e => setParentName(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Téléphone (WhatsApp SMS) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="+237 6XX XX XX XX"
                              value={parentPhone}
                              onChange={e => setParentPhone(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Email du Parent
                            </label>
                            <input
                              type="email"
                              placeholder="parent@gmail.com"
                              value={parentEmail}
                              onChange={e => setParentEmail(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          type="submit"
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                          <span>Soumettre ma Pré-Inscription & Générer le Récépissé</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 4: ACTUALITÉS & VIE SCOLAIRE */}
          {/* ================================================================= */}
          {activeSiteSection === 'news' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">Actualités, Vie Scolaire & Événements</h3>
                  <p className="text-xs text-slate-500 font-mono">Dernières publications officielles de l'établissement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map(art => (
                  <div key={art.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                    {art.imageUrl && (
                      <div className="h-48 overflow-hidden bg-slate-100 relative">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-xs">
                          {art.category}
                        </span>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>{art.date}</span>
                          <span>•</span>
                          <span>{art.author}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug font-display">{art.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{art.summary}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          onClick={() => setReadingArticle(art)}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Lire l'article complet</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 5: PUBLICATION OFFICIELLE DES RÉSULTATS D'EXAMENS */}
          {/* ================================================================= */}
          {activeSiteSection === 'results' && (
            <div className="space-y-6">
              {/* Filter bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-600 font-mono uppercase">Examen :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['ALL', 'BAC', 'PROBATOIRE', 'BEPC'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedExamType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          selectedExamType === t
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'ALL' ? 'Tous les Examens' : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par élève, série..."
                    value={examSearchQuery}
                    onChange={e => setExamSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Exam Results Cards */}
              <div className="space-y-4">
                {filteredExamResults.map(res => (
                  <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-100 text-amber-900 font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-md">
                            {res.examType} {res.year}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base font-display">
                            {res.series}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {res.session} • Publié le {res.publishDate}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-xl font-bold font-mono text-emerald-600">{res.successRate}%</span>
                          <span className="block text-[10px] text-slate-400 font-mono uppercase">Taux de Réussite</span>
                        </div>
                        {res.nationalRank && (
                          <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <span className="text-xs font-bold text-amber-800 font-mono">#{res.nationalRank}</span>
                            <span className="block text-[9px] text-amber-600 font-mono">Rang National</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs font-mono text-center">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Candidats Inscrits</span>
                        <span className="font-bold text-slate-900 text-sm">{res.totalCandidates}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Admis Définitifs</span>
                        <span className="font-bold text-emerald-600 text-sm">{res.admittedCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Échecs / Ajournés</span>
                        <span className="font-bold text-rose-500 text-sm">{res.totalCandidates - res.admittedCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Certifié par</span>
                        <span className="font-bold text-blue-600 text-[11px]">OBC / MINESEC</span>
                      </div>
                    </div>

                    {/* Tableau d'honneur / Major roll */}
                    {res.honorRoll && res.honorRoll.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-slate-700 font-display flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <span>Tableau d’Honneur & Mentions Spéciales :</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {res.honorRoll.map((h, idx) => (
                            <div key={idx} className="p-2.5 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 block truncate">{h.studentName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{h.series}</span>
                              </div>
                              <span className="text-[10px] bg-amber-200/60 text-amber-900 font-mono font-bold px-2 py-0.5 rounded">
                                {h.mention}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CMS ADMINISTRATION (GESTION DES CONTENUS PAR L'ÉCOLE) */}
      {/* ========================================================================= */}
      {viewMode === 'cms' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-xs font-bold">
              <Edit3 className="h-4 w-4 text-amber-600" />
              <span>Console d’Édition & Mise à Jour du Site Public (Accessible uniquement par l'Administration)</span>
            </div>
            <button
              onClick={() => setViewMode('visitor')}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg shadow-2xs hover:bg-amber-100 cursor-pointer"
            >
              Voir le Site Live
            </button>
          </div>

          {/* CMS Sub-panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel 1: Configuration Identité & Mot du Proviseur */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <School className="h-4 w-4 text-blue-600" />
                <span>Mot du Proviseur & Identité</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom du Chef d'Établissement</label>
                  <input
                    type="text"
                    value={siteConfig.principalName}
                    onChange={e => setSiteConfig({ ...siteConfig, principalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Titre Officiel</label>
                  <input
                    type="text"
                    value={siteConfig.principalTitle}
                    onChange={e => setSiteConfig({ ...siteConfig, principalTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Texte du Discours d'Accueil</label>
                  <textarea
                    rows={6}
                    value={siteConfig.principalMessage}
                    onChange={e => setSiteConfig({ ...siteConfig, principalMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
                  />
                </div>

                <button
                  onClick={() => {
                    addAuditLog('Mise à jour CMS', activeSchool.id, 'Mise à jour du mot du proviseur et de la présentation.');
                    showToast('Modifications enregistrées avec succès dans le profil public de l\'établissement.', 'success');
                  }}
                  className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </div>

            {/* Panel 2: Gestion des Demandes de Pré-Inscription (Inbound Leads) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Dossiers Pré-Inscriptions ({preRegistrations.length})</span>
                </h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {preRegistrations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Aucun dossier reçu</p>
                ) : (
                  preRegistrations.map(sub => (
                    <div key={sub.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-900 block">{sub.candidateFirstName} {sub.candidateLastName}</span>
                          <span className="text-[10px] text-blue-600 font-mono font-bold">{sub.requestedClass}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          sub.status === 'APPROUVE' ? 'bg-emerald-100 text-emerald-800' :
                          sub.status === 'REJETE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600">
                        <div>Parent : <span className="font-medium">{sub.parentName}</span> ({sub.parentPhone})</div>
                        {sub.previousSchool && <div className="italic text-slate-400">Origine: {sub.previousSchool}</div>}
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setPreRegistrations(prev => prev.map(p => p.id === sub.id ? { ...p, status: 'APPROUVE' } : p));
                            addAuditLog('Approbation Pré-inscription', activeSchool.id, `Dossier de ${sub.candidateLastName} validé pour la classe ${sub.requestedClass}.`);
                          }}
                          className="flex-1 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 cursor-pointer"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            setPreRegistrations(prev => prev.map(p => p.id === sub.id ? { ...p, status: 'REJETE' } : p));
                            addAuditLog('Rejet Pré-inscription', activeSchool.id, `Dossier de ${sub.candidateLastName} rejeté.`);
                          }}
                          className="px-3 py-1 bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg hover:bg-slate-300 cursor-pointer"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel 3: Actions Rapides de Publication (Articles & Résultats) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Publications & Mises à Jour</span>
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => setIsArticleModalOpen(true)}
                  className="w-full p-4 bg-blue-50 border border-blue-200 rounded-2xl text-left hover:bg-blue-100/60 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Newspaper className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Rédiger une Actualité</span>
                      <span className="text-[10px] text-slate-500 font-mono">Article, cérémonie, sport, remise de prix</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={() => setIsExamModalOpen(true)}
                  className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100/60 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Publier Résultats Examens</span>
                      <span className="text-[10px] text-slate-500 font-mono">Session BAC, Probatoire, BEPC officiel</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rédiger Article */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Publier une Nouvelle Actualité Scolaire</h3>
            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre de l'Article</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Célébration des majors au Baccalauréat 2025"
                  value={newArtTitle}
                  onChange={e => setNewArtTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={newArtCategory}
                    onChange={e => setNewArtCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Actualité">Actualité</option>
                    <option value="Excellence">Excellence & Prix</option>
                    <option value="Sport">Sport FENASCO</option>
                    <option value="Vie Scolaire">Vie Scolaire</option>
                    <option value="Culture">Journée Culturelle</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auteur</label>
                  <input
                    type="text"
                    value={newArtAuthor}
                    onChange={e => setNewArtAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Résumé court</label>
                <textarea
                  rows={2}
                  required
                  value={newArtSummary}
                  onChange={e => setNewArtSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Publier l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Publier Résultats Examens */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Publier une Session de Résultats d'Examen</h3>
            <form onSubmit={handleCreateExamResult} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type d'Examen</label>
                  <select
                    value={newExamType}
                    onChange={e => setNewExamType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="BAC">BACCALAURÉAT (BAC)</option>
                    <option value="PROBATOIRE">PROBATOIRE</option>
                    <option value="BEPC">BEPC</option>
                    <option value="CAP">CAP</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Année</label>
                  <input
                    type="number"
                    value={newExamYear}
                    onChange={e => setNewExamYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Série / Filière</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Série C (Mathématiques)"
                  value={newExamSeries}
                  onChange={e => setNewExamSeries(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Candidats</label>
                  <input
                    type="number"
                    value={newExamCandidates}
                    onChange={e => setNewExamCandidates(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admis Déclarés</label>
                  <input
                    type="number"
                    value={newExamAdmitted}
                    onChange={e => setNewExamAdmitted(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Publier Officiellement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {readingArticle.imageUrl && (
              <div className="relative h-64 w-full overflow-hidden bg-slate-900 rounded-t-3xl">
                <img
                  src={readingArticle.imageUrl}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                  <span className="bg-blue-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-full shadow-md">
                    {readingArticle.category}
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    <span>{readingArticle.date}</span>
                  </span>
                  <span>•</span>
                  <span>Par {readingArticle.author}</span>
                </div>
                <button
                  onClick={() => setReadingArticle(null)}
                  className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold font-display text-slate-900 leading-snug">
                  {readingArticle.title}
                </h3>
                <p className="text-sm font-semibold text-blue-800 bg-blue-50/70 p-4 rounded-xl border border-blue-100/60 leading-relaxed">
                  {readingArticle.summary}
                </p>
                <div className="text-slate-700 text-sm leading-relaxed space-y-3 whitespace-pre-line font-normal">
                  {readingArticle.content}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setReadingArticle(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fermer la lecture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST ALERT BANNER */}
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
    </div>
  );
}
