/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  ShieldAlert, 
  Building2, 
  ShieldCheck, 
  User, 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  CalendarDays, 
  FileText, 
  Database, 
  Clock, 
  Users, 
  Compass,
  ArrowRight,
  ClipboardCheck,
  Award,
  Bell,
  GraduationCap,
  Globe,
  CreditCard,
  QrCode,
  HeartHandshake,
  BookMarked,
  FileSpreadsheet
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole?: 'superadmin' | 'school_admin';
}

interface FeatureGuide {
  id: string;
  name: string;
  desc: string;
  targetTab: string;
  icon: React.ComponentType<any>;
}

interface RoleGuide {
  id: 'superadmin' | 'admin' | 'enseignant' | 'parent';
  title: string;
  roleBadge: string;
  badgeClass: string;
  description: string;
  icon: React.ComponentType<any>;
  features: FeatureGuide[];
}

export default function UserGuideModal({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  currentUserRole = 'school_admin'
}: UserGuideModalProps) {
  const [activeRole, setActiveRole] = useState<'superadmin' | 'admin' | 'enseignant' | 'parent'>('admin');
  const [searchQuery, setSearchQuery] = useState('');

  const guides: RoleGuide[] = useMemo(() => [
    {
      id: 'superadmin',
      title: 'Super Administrateur Plateforme',
      roleBadge: 'Contrôle Global',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Supervision multi-établissements en temps réel de tous les lycées et collèges connectés sur la plateforme nationale MINESEC.',
      icon: Building2,
      features: [
        {
          id: 'sa-kpis',
          name: 'Statistiques Globales & KPIs',
          desc: 'Agrégation en direct : nombre d’écoles actives, effectif global d’élèves, volume d’opérations et licences.',
          targetTab: 'superadmin',
          icon: Compass
        },
        {
          id: 'sa-schools',
          name: 'Gestion Multitenant des Écoles',
          desc: 'Création et configuration de nouveaux établissements scolaires, personnalisation des thèmes, logos, devises et années.',
          targetTab: 'superadmin',
          icon: Building2
        },
        {
          id: 'sa-architecture',
          name: 'Moniteur d’Architecture & API',
          desc: 'Visualisation des flux de données Firebase, logs d’audit, sécurité et documentation OpenAPI REST.',
          targetTab: 'architecture',
          icon: Database
        }
      ]
    },
    {
      id: 'admin',
      title: 'Administration & Direction de l’École',
      roleBadge: 'Direction & Censeur',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Pilotage complet de l’établissement : supervision des enseignants, validation académique des bulletins, cycles et rentrée scolaire.',
      icon: ShieldCheck,
      features: [
        {
          id: 'admin-dashboard',
          name: 'Tableau de Bord de Direction',
          desc: 'Vue d’ensemble des effectifs actifs, taux d’assiduité moyen journalier et alertes de notes en attente de visa.',
          targetTab: 'dashboard',
          icon: BookOpen
        },
        {
          id: 'admin-classes',
          name: 'Gestion des Cycles & Classes',
          desc: 'Organisation académique structurée : Premier Cycle (6e, 5e, 4e, 3e) et Second Cycle (2nde, 1ère, Tle) avec affectation des professeurs principaux.',
          targetTab: 'classes',
          icon: Users
        },
        {
          id: 'admin-approvals',
          name: 'Workflow d’Approbation des Notes',
          desc: 'Contrôle de conformité académique, visa et verrouillage des notes saisies par les professeurs avant publication.',
          targetTab: 'admin',
          icon: ClipboardCheck
        },
        {
          id: 'admin-bulletins',
          name: 'Calcul des Moyennes & Bulletins PDF',
          desc: 'Génération instantanée des bulletins scolaires trimestriels MINESEC avec calcul automatique des rangs, mentions et visa officiel.',
          targetTab: 'admin',
          icon: Award
        },
        {
          id: 'admin-deliberations',
          name: 'Conseils de Classe & Délibérations',
          desc: 'Traitement des décisions de fin de trimestre ou d’année : tableau d’honneur, encouragements, avertissements et décisions de passage.',
          targetTab: 'admin',
          icon: FileSpreadsheet
        },
        {
          id: 'admin-attendance',
          name: 'Analyses d’Assiduité & Discipline',
          desc: 'Surveillance statistique de l’absentéisme par classe, traçabilité des motifs et détection précoce du décrochage.',
          targetTab: 'admin',
          icon: Clock
        },
        {
          id: 'admin-deployment',
          name: 'Comptes & Cartes Scolaires QR',
          desc: 'Checklist de rentrée, import/export Excel des effectifs et impression des cartes d’identité scolaires avec QR Code.',
          targetTab: 'deployment',
          icon: QrCode
        },
        {
          id: 'admin-site',
          name: 'Site Public & Préinscriptions Web',
          desc: 'Gestion du portail vitrine public de l’école et traitement des demandes d’admission déposées en ligne par les familles.',
          targetTab: 'site',
          icon: Globe
        },
        {
          id: 'admin-billing',
          name: 'Abonnement & Crédits SMS Alerte',
          desc: 'Suivi du forfait SaaS de l’école et rechargement des packs SMS pour notification instantanée des parents via Mobile Money.',
          targetTab: 'billing',
          icon: CreditCard
        }
      ]
    },
    {
      id: 'enseignant',
      title: 'Enseignants & Vie Scolaire',
      roleBadge: 'Pédagogie & Assiduité',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      description: 'Activités quotidiennes en classe : appel numérique, création et notation des évaluations séquentielles, cahier de texte et devoirs.',
      icon: User,
      features: [
        {
          id: 'teacher-attendance',
          name: 'Feuille de Présence & Appel Numérique',
          desc: 'Pointage rapide par cours (Présent, Retard, Absent justifié/injustifié) avec déclenchement automatique d’alertes SMS aux parents.',
          targetTab: 'attendance',
          icon: CalendarDays
        },
        {
          id: 'teacher-grades',
          name: 'Saisie des Évaluations & Notes',
          desc: 'Création d’épreuves séquentielles, application des coefficients et barèmes officiels, et verrouillage sécurisé des notes.',
          targetTab: 'grades',
          icon: FileText
        },
        {
          id: 'teacher-homework',
          name: 'Cahier de Texte & Devoirs à la Maison',
          desc: 'Attribution des devoirs de maison avec date limite, suivi du statut de réalisation des élèves (Fait / Non fait).',
          targetTab: 'homework',
          icon: BookMarked
        },
        {
          id: 'teacher-library',
          name: 'Médiathèque Numérique (E-Learning)',
          desc: 'Partage de cours en PDF, polycopiés, devoirs corrigés et annales d’examens nationaux (BEPC, Probatoire, Baccalauréat).',
          targetTab: 'library',
          icon: BookOpen
        }
      ]
    },
    {
      id: 'parent',
      title: 'Espace Parents & Familles',
      roleBadge: 'Suivi Familial',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Suivi en temps réel de la scolarité de vos enfants : notes, bulletins certifiés, devoirs, retards et alertes directes de l’école.',
      icon: HeartHandshake,
      features: [
        {
          id: 'parent-portal-grades',
          name: 'Relevé des Notes & Moyennes en Direct',
          desc: 'Consultez les notes des séquences dès leur validation, avec coefficients, rangs de classe et appréciations des enseignants.',
          targetTab: 'portal',
          icon: Award
        },
        {
          id: 'parent-portal-bulletin',
          name: 'Téléchargement du Bulletin Officiel PDF',
          desc: 'Téléchargez et imprimez à domicile le bulletin scolaire trimestriel officiel muni du visa de l’établissement et du QR Code de sécurité.',
          targetTab: 'portal',
          icon: FileText
        },
        {
          id: 'parent-portal-attendance',
          name: 'Historique d’Assiduité & Absences',
          desc: 'Suivi transparent des retards et absences par matière, statut de justification et notification par SMS en cas d’absence.',
          targetTab: 'portal',
          icon: Clock
        },
        {
          id: 'parent-portal-homework',
          name: 'Cahier de Devoirs à la Maison',
          desc: 'Vérifiez le travail à domicile assigné à votre enfant, les dates limites de rendu et le statut de réalisation (Fait / Non fait).',
          targetTab: 'portal',
          icon: BookMarked
        },
        {
          id: 'parent-portal-profile',
          name: 'Mise à Jour du Contact d’Urgence',
          desc: 'Vérifiez et modifiez votre numéro de téléphone WhatsApp/SMS pour recevoir toutes les alertes de sécurité et d’assiduité.',
          targetTab: 'portal',
          icon: Users
        },
        {
          id: 'parent-portal-library',
          name: 'Accès aux Manuels & Annales E-Learning',
          desc: 'Votre enfant peut consulter les supports de cours, polycopiés et annales d’examens mis à disposition par ses professeurs.',
          targetTab: 'library',
          icon: BookOpen
        },
        {
          id: 'parent-portal-site',
          name: 'Préinscriptions & Actualités de l’École',
          desc: 'Déposez une demande de réinscription ou préinscription pour un nouveau frère/sœur directement via le site officiel.',
          targetTab: 'site',
          icon: Globe
        }
      ]
    }
  ], []);

  // Filter features based on search query
  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides;
    const query = searchQuery.toLowerCase();
    return guides.map(g => {
      const matchedFeatures = g.features.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.desc.toLowerCase().includes(query)
      );
      const isRoleMatch = g.title.toLowerCase().includes(query) || g.description.toLowerCase().includes(query);
      
      if (isRoleMatch || matchedFeatures.length > 0) {
        return {
          ...g,
          features: matchedFeatures.length > 0 ? matchedFeatures : g.features
        };
      }
      return null;
    }).filter(Boolean) as RoleGuide[];
  }, [searchQuery, guides]);

  // Handle fast navigation click
  const handleNavigate = (targetTab: string) => {
    setCurrentTab(targetTab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glass blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal panel container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative bg-white w-full max-w-4xl h-[90vh] md:h-[680px] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-slate-800 text-sm md:text-base leading-tight">
                  Guide d’Utilisation Interactif
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">
                  Découvrez l’organisation des rôles & accédez rapidement aux modules de l’application.
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar Wrapper */}
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center space-x-3 bg-white shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une fonctionnalité (ex: bulletins, présence, notes, API...)"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 pl-9 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Main content body with dual panes */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50/40">
            {/* Sidebar with roles list */}
            <div className="w-52 md:w-64 border-r border-slate-150 p-4 space-y-1.5 shrink-0 overflow-y-auto hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 font-mono">
                Rôles & Niveaux d'accès
              </p>
              {guides.map((guide) => {
                const Icon = guide.icon;
                const isSelected = activeRole === guide.id;
                // If user is not superadmin, add a visual visual lock or indicator for restricted area, but let them read
                const hasAccess = currentUserRole === 'superadmin' || guide.id !== 'superadmin';
                
                return (
                  <button
                    key={guide.id}
                    onClick={() => {
                      setActiveRole(guide.id);
                      setSearchQuery(''); // clear query when toggling to show all features
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-left group ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${
                      isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight truncate">
                        {guide.id === 'superadmin' ? 'Super Admin' : guide.id === 'admin' ? 'Direction École' : guide.id === 'enseignant' ? 'Enseignants' : 'Parents & Élèves'}
                      </p>
                      <p className={`text-[9px] font-mono leading-none mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {!hasAccess ? '🔒 Lecture seule' : '✓ Accès direct'}
                      </p>
                    </div>
                    <ChevronRight className={`h-3 w-3 shrink-0 opacity-40 ${isSelected ? 'opacity-100 transform translate-x-0.5' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* Detailed guide section content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
              {searchQuery.trim() ? (
                // Search Results View
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-slate-400 pb-2 border-b border-slate-100">
                    <Search className="h-4.5 w-4.5 text-blue-500" />
                    <p className="text-xs font-bold text-slate-600">
                      Résultats de recherche pour "{searchQuery}" ({filteredGuides.reduce((acc, curr) => acc + curr.features.length, 0)} correspondances)
                    </p>
                  </div>
                  {filteredGuides.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <p className="text-sm text-slate-400 italic">Aucune fonctionnalité correspondante trouvée.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    filteredGuides.map((guide) => (
                      <div key={guide.id} className="space-y-3">
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-md border ${guide.badgeClass}`}>
                            {guide.title}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guide.features.map((feat) => {
                            const FeatIcon = feat.icon;
                            // check if user has access to this tab based on role restriction
                            const isTabAllowed = currentUserRole === 'superadmin' || feat.targetTab !== 'superadmin';
                            
                            return (
                              <div key={feat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between hover:border-blue-300 transition-colors">
                                <div className="space-y-1.5">
                                  <div className="flex items-center space-x-2">
                                    <div className="p-1.5 bg-white text-slate-700 rounded-lg border border-slate-200">
                                      <FeatIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h5 className="text-xs font-bold text-slate-800">{feat.name}</h5>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-slate-500">{feat.desc}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Onglet: {feat.targetTab}</span>
                                  {isTabAllowed ? (
                                    <button
                                      onClick={() => handleNavigate(feat.targetTab)}
                                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                                    >
                                      <span>Accéder</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic flex items-center space-x-1">
                                      <span>🔒 Accès restreint</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Normal Role-by-Role tab view
                <div className="space-y-6">
                  {/* Mobile header (as the sidebar is hidden on small viewports) */}
                  <div className="sm:hidden flex space-x-1 bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto">
                    {guides.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setActiveRole(g.id)}
                        className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg text-center transition-all whitespace-nowrap ${
                          activeRole === g.id 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'text-slate-600'
                        }`}
                      >
                        {g.id === 'superadmin' ? 'SuperAdmin' : g.id === 'admin' ? 'Direction' : g.id === 'enseignant' ? 'Enseignants' : 'Parents'}
                      </button>
                    ))}
                  </div>

                  {/* Active role summary card */}
                  {guides.filter(g => g.id === activeRole).map((guide) => {
                    const RoleIcon = guide.icon;
                    return (
                      <div key={guide.id} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-start space-x-3.5">
                          <div className="p-2 bg-white text-slate-800 rounded-xl border border-slate-200 shrink-0">
                            <RoleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-black text-slate-800 leading-tight">
                                {guide.title}
                              </h4>
                              <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-md border ${guide.badgeClass}`}>
                                {guide.roleBadge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                              {guide.description}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">
                            Fonctionnalités principales & Liens directs
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {guide.features.map((feat) => {
                              const FeatIcon = feat.icon;
                              // check restriction
                              const isTabAllowed = currentUserRole === 'superadmin' || feat.targetTab !== 'superadmin';
                              
                              return (
                                <div key={feat.id} className="p-4 bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-200/80 hover:border-blue-400/50 transition-all flex flex-col justify-between shadow-xs">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200/50 shrink-0">
                                        <FeatIcon className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-800">{feat.name}</h5>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-500">{feat.desc}</p>
                                  </div>
                                  
                                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wide">Onglet: {feat.targetTab}</span>
                                    {isTabAllowed ? (
                                      <button
                                        onClick={() => handleNavigate(feat.targetTab)}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                                      >
                                        <span>Accéder maintenant</span>
                                        <ArrowRight className="h-3 w-3" />
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-slate-400 italic flex items-center space-x-1">
                                        <span>🔒 Zone réservée SuperAdmin</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer with role warning and helper text */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 text-slate-500">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-[10px] md:text-xs font-medium leading-tight">
                Votre rôle actif est <strong className="text-slate-700 uppercase">{currentUserRole === 'superadmin' ? 'Super Administrateur' : 'Admin École'}</strong>. L'accès aux fonctionnalités et aux données est strictement restreint selon vos prérogatives.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shrink-0 w-full sm:w-auto cursor-pointer"
            >
              Fermer le guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
