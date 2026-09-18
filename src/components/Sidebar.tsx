/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Logo from './Logo';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldCheck,
  User,
  Database,
  GraduationCap,
  LogOut,
  Building2,
  HelpCircle,
  Globe,
  BookOpen,
  Users,
  CreditCard
} from 'lucide-react';
import { SchoolTenant } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userEmail: string;
  activeSchool?: SchoolTenant;
  schools: SchoolTenant[];
  setActiveSchoolId: (id: string) => void;
  onCloseMobile?: () => void;
  currentUserRole?: 'superadmin' | 'school_admin' | 'parent';
  onLogout?: () => void;
  onOpenGuide?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  userEmail,
  activeSchool,
  schools,
  setActiveSchoolId,
  onCloseMobile,
  currentUserRole = 'school_admin',
  onLogout,
  onOpenGuide
}: SidebarProps) {
  const parentModules = [
    { id: 'portal', name: 'Suivi de mon Enfant', icon: User, badge: 'PARENT' },
    { id: 'homework', name: 'Cahier de Textes & Devoirs', icon: BookOpen },
    { id: 'library', name: "Bibliothèque d'Épreuves", icon: BookOpen },
    { id: 'site', name: "Site de l'Établissement", icon: Globe },
  ];

  const superAdminModules = [
    { id: 'superadmin', name: 'Console Super Admin', icon: Building2, badge: 'SAAS' },
    { id: 'architecture', name: 'Architecture & API REST', icon: Database, badge: 'DEV' },
  ];

  const tenantSchoolModules = [
    { id: 'dashboard', name: 'Tableau de bord École', icon: LayoutDashboard },
    { id: 'classes', name: 'Classes & Élèves', icon: GraduationCap },
    { id: 'attendance', name: 'Gestion des Présences', icon: CalendarDays },
    { id: 'grades', name: 'Notes & Palmarès', icon: FileText },
    { id: 'homework', name: 'Devoirs de Maison (Cahier)', icon: BookOpen },
    { id: 'admin', name: 'Administration & Bulletins', icon: ShieldCheck },
    { id: 'portal', name: 'Espace Parents & Élèves', icon: User },
    { id: 'site', name: 'Site Public & Pré-inscriptions', icon: Globe },
    { id: 'library', name: 'Bibliothèque d\'Épreuves', icon: BookOpen },
    { id: 'deployment', name: 'Comptes & Déploiement', icon: Users },
    { id: 'billing', name: 'Abonnement SaaS & SMS', icon: CreditCard },
  ];

  // Dynamic color matching
  let activeClass = 'bg-blue-600/20 text-blue-400 font-semibold';
  let activeIconColor = 'text-blue-400';
  let indicatorColor = 'text-blue-500';
  let badgeColor = 'bg-blue-600';
  
  if (activeSchool?.primaryColor === 'emerald') {
    activeClass = 'bg-emerald-600/20 text-emerald-400 font-semibold';
    activeIconColor = 'text-emerald-400';
    indicatorColor = 'text-emerald-500';
    badgeColor = 'bg-emerald-600';
  } else if (activeSchool?.primaryColor === 'indigo') {
    activeClass = 'bg-indigo-600/20 text-indigo-400 font-semibold';
    activeIconColor = 'text-indigo-400';
    indicatorColor = 'text-indigo-500';
    badgeColor = 'bg-indigo-600';
  } else if (activeSchool?.primaryColor === 'rose') {
    activeClass = 'bg-rose-600/20 text-rose-400 font-semibold';
    activeIconColor = 'text-rose-400';
    indicatorColor = 'text-rose-500';
    badgeColor = 'bg-rose-600';
  } else if (activeSchool?.primaryColor === 'amber') {
    activeClass = 'bg-amber-600/20 text-amber-400 font-semibold';
    activeIconColor = 'text-amber-400';
    indicatorColor = 'text-amber-500';
    badgeColor = 'bg-amber-600';
  } else if (activeSchool?.primaryColor === 'violet') {
    activeClass = 'bg-violet-600/20 text-violet-400 font-semibold';
    activeIconColor = 'text-violet-400';
    indicatorColor = 'text-violet-500';
    badgeColor = 'bg-violet-600';
  }

  return (
    <aside id="sidebar-nav" className={`${onCloseMobile ? 'flex w-full h-full' : 'hidden lg:flex w-72'} bg-[#0F172A] text-white flex flex-col border-r border-slate-800 shrink-0`}>
      {/* Platform Brand Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Logo size="sm" withContainer={true} />
          <div className="flex flex-col">
            <span className="text-xs font-display font-black tracking-tight text-white flex items-center gap-1">
              <span className="text-emerald-400">ADSP</span> PLATFORM
            </span>
            <span className="text-[8px] text-emerald-400/80 font-mono uppercase tracking-widest font-semibold">
              MINESEC SaaS
            </span>
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold border border-emerald-500/20">
          v2.5
        </span>
      </div>

      {/* School Brand Context */}
      <div className="p-4 border-b border-slate-800 flex flex-col items-center text-center space-y-2 bg-slate-900/20">
        {activeSchool?.logoUrl ? (
          <div className="h-12 w-full flex items-center justify-center p-1 bg-slate-900/50 rounded-lg border border-slate-800 shadow-inner">
            <img 
              src={activeSchool.logoUrl} 
              alt={activeSchool.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex items-center space-x-2.5 w-full justify-center">
            <div className={`w-9 h-9 ${badgeColor} rounded-lg flex items-center justify-center font-bold text-lg shrink-0 shadow-md`}>
              <span className="text-base select-none">{activeSchool?.logoEmoji || '🏫'}</span>
            </div>
            <h1 className="font-display font-bold text-sm leading-tight text-white truncate max-w-[160px]">
              {activeSchool?.name || 'Academic Platform'}
            </h1>
          </div>
        )}
        
        {/* Active Slogan */}
        <p className="text-[10px] text-slate-400 font-medium italic tracking-wide truncate w-full px-2" title={activeSchool?.slogan}>
          {activeSchool?.slogan || 'Discipline - Travail - Succès'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        {currentUserRole === 'parent' ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-display">
                Espace Famille & Élève
              </p>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded font-bold">
                PARENT
              </span>
            </div>
            {parentModules.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 text-left group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                    }`} />
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : currentUserRole === 'superadmin' ? (
          <>
            {/* Super Admin Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-display">
                  Supervision SaaS
                </p>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.2 rounded font-bold">
                  SUPERADMIN
                </span>
              </div>
              {superAdminModules.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-left group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`h-4 w-4 transition-transform duration-200 ${
                        isActive ? 'text-white' : 'text-blue-400 group-hover:scale-105'
                      }`} />
                      <span className="text-xs sm:text-sm">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* School Modules Section */}
            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display truncate">
                  Pilotage : {activeSchool.name}
                </p>
              </div>
              {tenantSchoolModules.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      setCurrentTab(item.id);
                      onCloseMobile?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-left group ${
                      isActive
                        ? activeClass
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-200 ${
                      isActive ? activeIconColor : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                    }`} />
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">
              Modules principaux
            </p>
            {tenantSchoolModules.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group ${
                    isActive
                      ? activeClass
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                    isActive ? activeIconColor : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                  }`} />
                  <span className="text-xs sm:text-sm">{item.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Help Guide Action */}
        {onOpenGuide && (
          <button
            id="nav-item-guide"
            onClick={onOpenGuide}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-blue-400 hover:bg-slate-800 hover:text-blue-300 border border-blue-500/15 bg-blue-500/5 transition-all duration-200 text-left group mt-3 cursor-pointer"
          >
            <HelpCircle className="h-4.5 w-4.5 text-blue-400 group-hover:scale-110 shrink-0 transition-transform" />
            <span className="text-xs sm:text-sm font-semibold">Guide d'utilisation</span>
          </button>
        )}
      </nav>

      {/* School Name Indicator & Dropdown Swapper */}
      {currentUserRole === 'superadmin' ? (
        <div className="px-4 py-3 bg-slate-950/20 border-t border-b border-slate-800/60 flex flex-col space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-400">
            <Building2 className={`h-3.5 w-3.5 ${indicatorColor} shrink-0`} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Sélectionner un Établissement</span>
          </div>
          <select
            value={activeSchool?.id || ''}
            onChange={(e) => setActiveSchoolId(e.target.value)}
            className="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium w-full"
          >
            {schools.length > 0 ? (
              schools.map(s => (
                <option key={s.id} value={s.id}>{s.logoEmoji} {s.name}</option>
              ))
            ) : (
              <option value="">Aucun établissement</option>
            )}
          </select>
        </div>
      ) : (
        <div className="px-4 py-3 bg-slate-950/20 border-t border-b border-slate-800/60 flex flex-col space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-400">
            <Building2 className={`h-3.5 w-3.5 ${indicatorColor} shrink-0`} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Établissement Verrouillé</span>
          </div>
          <div className="bg-slate-900/50 text-xs text-slate-300 border border-slate-800/50 rounded-lg p-2 flex items-center space-x-2">
            <span className="text-sm shrink-0">{activeSchool?.logoEmoji || '🏫'}</span>
            <span className="font-semibold truncate text-[11px]">{activeSchool?.name || 'Aucun établissement sélectionné'}</span>
          </div>
        </div>
      )}

      {/* User Information Profile */}
      <div className="p-4 border-t border-slate-800 flex items-center space-x-3 bg-slate-950/40">
        <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-display text-blue-400 font-bold shadow-inner">
          {currentUserRole === 'superadmin' ? 'SA' : 'AD'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {userEmail ? userEmail.split('@')[0] : 'Censeur / Admin'}
          </p>
          <p className="text-[10px] text-slate-500 truncate uppercase font-semibold tracking-wider">
            {currentUserRole === 'superadmin' ? 'Super Administrateur' : 'Administrateur École'}
          </p>
        </div>
        <button 
          title="Se déconnecter"
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
