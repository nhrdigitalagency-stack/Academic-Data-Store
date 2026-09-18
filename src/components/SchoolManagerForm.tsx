/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SchoolTenant, SchoolClass, Student } from '../types';
import { DEFAULT_PALETTES, PREDEFINED_PALETTES } from '../utils/colorUtils';
import { 
  Building2, 
  Plus, 
  Sparkles, 
  Paintbrush, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  X, 
  CalendarDays, 
  UploadCloud, 
  RotateCcw, 
  Wrench,
  Activity,
  AlertCircle
} from 'lucide-react';

interface SchoolManagerFormProps {
  schools: SchoolTenant[];
  setSchools: React.Dispatch<React.SetStateAction<SchoolTenant[]>>;
  editingSchoolId: string | null;
  onCancel: () => void;
  activeSchoolId: string;
  setActiveSchoolId: (id: string) => void;
  setClasses?: React.Dispatch<React.SetStateAction<SchoolClass[]>>;
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  addAuditLog?: (action: string, schoolId: string, details: string, user?: string) => void;
}

export default function SchoolManagerForm({
  schools,
  setSchools,
  editingSchoolId,
  onCancel,
  activeSchoolId,
  setActiveSchoolId,
  setClasses,
  setStudents,
  addAuditLog
}: SchoolManagerFormProps) {
  const editingSchool = schools.find(s => s.id === editingSchoolId);

  // Form states
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('🏫');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState<'blue' | 'emerald' | 'indigo' | 'rose' | 'amber' | 'violet'>('blue');
  
  // Custom color pickers
  const [themePrimary, setThemePrimary] = useState('#3b82f6');
  const [themeSecondary, setThemeSecondary] = useState('#1e293b');
  const [themeAccent, setThemeAccent] = useState('#f59e0b');
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [activeSchoolYear, setActiveSchoolYear] = useState('2025-2026');
  const [systemVersionInput, setSystemVersionInput] = useState('v2.5.0');
  const [licenseStatusInput, setLicenseStatusInput] = useState<'Active' | 'Expired' | 'Pending' | 'Suspended'>('Active');

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const emojiOptions = ['🏫', '⛪', '🔬', '🚢', '📚', '🏛️', '🌟', '🎨', '🦁', '🦉', '🎓'];
  
  const colorOptions: { value: typeof primaryColor; label: string; class: string }[] = [
    { value: 'blue', label: 'Bleu Royal', class: 'bg-blue-500' },
    { value: 'emerald', label: 'Émeraude', class: 'bg-emerald-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'rose', label: 'Rose Intense', class: 'bg-rose-500' },
    { value: 'amber', label: 'Ambre Doré', class: 'bg-amber-500' },
    { value: 'violet', label: 'Violet Mystique', class: 'bg-violet-500' }
  ];

  // Load editing school state or set defaults
  useEffect(() => {
    if (editingSchool) {
      setName(editingSchool.name);
      setSlogan(editingSchool.slogan);
      setLogoEmoji(editingSchool.logoEmoji || '🏫');
      setLogoUrl(editingSchool.logoUrl || '');
      setPrimaryColor(editingSchool.primaryColor || 'blue');
      
      const defaultPalette = DEFAULT_PALETTES[editingSchool.primaryColor || 'blue'] || DEFAULT_PALETTES.blue;
      setThemePrimary(editingSchool.themePrimary || defaultPalette.primary);
      setThemeSecondary(editingSchool.themeSecondary || defaultPalette.secondary);
      setThemeAccent(editingSchool.themeAccent || defaultPalette.accent);
      
      setAddress(editingSchool.address || '');
      setPhone(editingSchool.phone || '');
      setEmail(editingSchool.email || '');
      setActiveSchoolYear(editingSchool.activeSchoolYear || '2025-2026');
      setSystemVersionInput(editingSchool.systemVersion || 'v2.5.0');
      setLicenseStatusInput(editingSchool.licenseStatus || 'Active');
    } else {
      // Create mode defaults
      setName('');
      setSlogan('');
      setLogoEmoji('🏫');
      setLogoUrl('');
      setPrimaryColor('blue');
      setThemePrimary(DEFAULT_PALETTES.blue.primary);
      setThemeSecondary(DEFAULT_PALETTES.blue.secondary);
      setThemeAccent(DEFAULT_PALETTES.blue.accent);
      setAddress('');
      setPhone('');
      setEmail('');
      setActiveSchoolYear('2025-2026');
      setSystemVersionInput('v2.5.0');
      setLicenseStatusInput('Active');
    }
    setErrorMsg('');
    setFeedbackMsg('');
  }, [editingSchoolId, editingSchool]);

  // Handle color preset selection
  const handlePrimaryColorChange = (color: typeof primaryColor) => {
    setPrimaryColor(color);
    const defaults = DEFAULT_PALETTES[color] || DEFAULT_PALETTES.blue;
    setThemePrimary(defaults.primary);
    setThemeSecondary(defaults.secondary);
    setThemeAccent(defaults.accent);
  };

  // Reset to default colors for active selection
  const handleResetColors = () => {
    const defaults = DEFAULT_PALETTES[primaryColor] || DEFAULT_PALETTES.blue;
    setThemePrimary(defaults.primary);
    setThemeSecondary(defaults.secondary);
    setThemeAccent(defaults.accent);
    setFeedbackMsg('Couleurs réinitialisées au modèle par défaut.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Logo process
  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez uploader uniquement des fichiers image (PNG, JPG, SVG).');
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoUrl(e.target.result as string);
        setFeedbackMsg('Logo chargé avec succès !');
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slogan || !address) {
      setErrorMsg('Veuillez remplir au moins le nom, le slogan et l\'adresse.');
      return;
    }

    if (editingSchoolId) {
      // Update School
      setSchools(prev => prev.map(s => {
        if (s.id === editingSchoolId) {
          return {
            ...s,
            name,
            slogan,
            logoEmoji,
            logoUrl: logoUrl || undefined,
            primaryColor,
            themePrimary,
            themeSecondary,
            themeAccent,
            address,
            phone: phone || '+237 600 00 00 00',
            email: email || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.cm`,
            activeSchoolYear,
            systemVersion: systemVersionInput,
            licenseStatus: licenseStatusInput
          };
        }
        return s;
      }));

      addAuditLog?.(
        "Mise à jour d'établissement",
        editingSchoolId,
        `Mise à jour globale de la configuration du locataire "${name}" par le SuperAdmin.`
      );

      setFeedbackMsg(`Succès! L'établissement "${name}" a été mis à jour.`);
      setTimeout(() => {
        onCancel();
      }, 1500);
    } else {
      // Create new School
      const newSchoolId = `school-${Date.now()}`;
      const newSchool: SchoolTenant = {
        id: newSchoolId,
        name,
        slogan,
        logoEmoji,
        logoUrl: logoUrl || undefined,
        primaryColor,
        themePrimary,
        themeSecondary,
        themeAccent,
        address,
        phone: phone || '+237 600 00 00 00',
        email: email || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.cm`,
        activeSchoolYear: activeSchoolYear || '2025-2026',
        systemVersion: systemVersionInput || 'v2.5.0',
        licenseStatus: licenseStatusInput || 'Active'
      };

      setSchools(prev => [...prev, newSchool]);
      setActiveSchoolId(newSchool.id);

      addAuditLog?.(
        "Création d'établissement",
        newSchoolId,
        `Création du locataire "${newSchool.name}" (${address || 'Non renseignée'}).`
      );

      setFeedbackMsg(`Succès! L'établissement "${newSchool.name}" a été créé.`);
      setTimeout(() => {
        onCancel();
      }, 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="school-manager-form-container">
      {/* Dynamic CSS Injection to style the form itself with currently selected brand colors */}
      <style>{`
        #school-manager-form-container .dynamic-primary-text {
          color: ${themePrimary} !important;
        }
        #school-manager-form-container .dynamic-secondary-text {
          color: ${themeSecondary} !important;
        }
        #school-manager-form-container .dynamic-accent-text {
          color: ${themeAccent} !important;
        }
        #school-manager-form-container .dynamic-primary-btn {
          background-color: ${themePrimary} !important;
          color: #ffffff !important;
          border-color: ${themePrimary} !important;
          transition: all 0.2s ease-in-out;
        }
        #school-manager-form-container .dynamic-primary-btn:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px ${themePrimary}30, 0 4px 6px -4px ${themePrimary}30 !important;
        }
        #school-manager-form-container .dynamic-border-primary {
          border-color: ${themePrimary}30 !important;
          transition: all 0.2s ease-in-out;
        }
        #school-manager-form-container .dynamic-border-primary:hover {
          border-color: ${themePrimary}70 !important;
        }
        #school-manager-form-container .dynamic-focus:focus {
          border-color: ${themePrimary} !important;
          box-shadow: 0 0 0 3px ${themePrimary}20 !important;
        }
        #school-manager-form-container .dynamic-accent-bg {
          background-color: ${themeAccent} !important;
        }
        #school-manager-form-container .dynamic-secondary-bg {
          background-color: ${themeSecondary} !important;
        }
        #school-manager-form-container .dynamic-accent-border {
          border-color: ${themeAccent}40 !important;
        }
        #school-manager-form-container .dynamic-accent-focus:focus {
          border-color: ${themeAccent} !important;
          box-shadow: 0 0 0 3px ${themeAccent}20 !important;
        }
      `}</style>

      {/* Form Panel */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 self-start transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
              {editingSchoolId ? (
                <>
                  <Wrench className="h-5 w-5 animate-spin dynamic-primary-text" style={{ animationDuration: '3s' }} />
                  <span className="dynamic-primary-text">Modifier l'Établissement</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 dynamic-primary-text" />
                  <span className="dynamic-primary-text">Créer un Nouvel Établissement</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {editingSchoolId 
                ? 'Modifiez les chartes graphiques et paramètres administratifs de ce locataire.' 
                : 'Ajoutez un nouveau locataire indépendant à la plateforme ADS STORE.'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="text-xs font-bold flex items-center space-x-1 p-1 px-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-slate-200 transition-all text-slate-500 hover:text-slate-800 dynamic-border-primary"
            title="Annuler et retourner au tableau de bord"
          >
            <X className="h-3.5 w-3.5" />
            <span>Fermer</span>
          </button>
        </div>

        {/* Local Feedback / Errors */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-xs">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Nom de l'établissement *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ex: Collège Vogt de Yaoundé"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none transition-all font-medium dynamic-border-primary dynamic-focus"
              />
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Slogan *
              </label>
              <input
                type="text"
                required
                value={slogan}
                onChange={e => setSlogan(e.target.value)}
                placeholder="ex: Rigueur, Excellence, Succès"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none transition-all font-medium dynamic-border-primary dynamic-focus"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active School Year */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Année Scolaire *
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={activeSchoolYear}
                  onChange={e => setActiveSchoolYear(e.target.value)}
                  placeholder="ex: 2025-2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none transition-all font-medium font-mono dynamic-border-primary dynamic-focus"
                />
              </div>
            </div>

            {/* System Version */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Version Système *
              </label>
              <div className="relative">
                <Wrench className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={systemVersionInput}
                  onChange={e => setSystemVersionInput(e.target.value)}
                  placeholder="v2.5.0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none transition-all font-mono dynamic-border-primary dynamic-focus"
                />
              </div>
            </div>

            {/* Licence Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Statut Licence *
              </label>
              <select
                value={licenseStatusInput}
                onChange={e => setLicenseStatusInput(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none transition-all font-medium cursor-pointer dynamic-border-primary dynamic-focus"
              >
                <option value="Active">Active / Validée</option>
                <option value="Expired">Expirée / Suspendue</option>
                <option value="Pending">En attente / Test</option>
                <option value="Suspended">Bloquée d'accès</option>
              </select>
            </div>
          </div>

          {/* Logo configuration section */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 dynamic-border-primary">
            <span className="block text-xs font-bold uppercase tracking-wider dynamic-primary-text">
              Logo & Image de l'Établissement
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  Emoji de secours (Fallback Emoji)
                </label>
                <select
                  value={logoEmoji}
                  onChange={e => setLogoEmoji(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none cursor-pointer dynamic-border-primary dynamic-focus"
                >
                  {emojiOptions.map(em => (
                    <option key={em} value={em}>{em} Emoji</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  Preset de couleur global
                </label>
                <select
                  value={primaryColor}
                  onChange={e => handlePrimaryColorChange(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none cursor-pointer dynamic-border-primary dynamic-focus"
                >
                  {colorOptions.map(col => (
                    <option key={col.value} value={col.value}>{col.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop Logo */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-500 font-bold">
                Fichier Image du Logo
              </label>
              
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all dynamic-border-primary ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : logoUrl 
                      ? 'border-emerald-300 bg-emerald-50/20' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {logoUrl ? (
                  <div className="flex items-center space-x-3 text-left w-full">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 p-1 flex items-center justify-center shadow-sm shrink-0 dynamic-border-primary">
                      <img 
                        src={logoUrl} 
                        alt="Logo preview" 
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-700 truncate">Image personnalisée chargée</p>
                      <p className="text-[9px] text-slate-400">Cliquez ou déposez pour la remplacer</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogoUrl('');
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer bg-transparent border-0"
                      title="Supprimer le logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5 py-1">
                    <UploadCloud className="h-6 w-6 text-slate-400 mx-auto" />
                    <p className="text-[10px] font-medium text-slate-600">
                      Glissez-déposez le logo de l'école ici, ou <span className="text-blue-600 font-semibold underline">parcourez</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">PNG, JPG ou SVG (Max. 2 Mo)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 font-bold mb-1">
                  Ou saisissez l'URL d'une image web directe :
                </label>
                <input
                  type="url"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none dynamic-border-primary dynamic-focus"
                />
              </div>
            </div>
          </div>

          {/* Color pickers with real-time variables & Reset */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 dynamic-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 dynamic-primary-text">
                <Paintbrush className="h-4 w-4" />
                <span>Sélection fine des Couleurs CSS (Real-Time Pickers)</span>
              </span>
              
              <button
                type="button"
                onClick={handleResetColors}
                className="text-[10px] font-bold flex items-center space-x-1 hover:underline cursor-pointer bg-slate-100 px-2 py-1 rounded border transition-all text-slate-500 hover:text-slate-800 dynamic-border-primary"
                title="Rétablir les couleurs d'origine du preset de marque"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Rétablir par défaut</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Couleur Primaire
                </label>
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-200 dynamic-border-primary">
                  <input
                    type="color"
                    value={themePrimary}
                    onChange={e => setThemePrimary(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-200 shrink-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={themePrimary}
                    onChange={e => setThemePrimary(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-mono font-bold text-slate-700 focus:outline-none p-0"
                  />
                </div>
              </div>

              {/* Secondary */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Couleur Secondaire
                </label>
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-200 dynamic-border-primary">
                  <input
                    type="color"
                    value={themeSecondary}
                    onChange={e => setThemeSecondary(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-200 shrink-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={themeSecondary}
                    onChange={e => setThemeSecondary(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-mono font-bold text-slate-700 focus:outline-none p-0"
                  />
                </div>
              </div>

              {/* Accent */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Couleur d'Accent
                </label>
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-200 dynamic-border-primary">
                  <input
                    type="color"
                    value={themeAccent}
                    onChange={e => setThemeAccent(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border border-slate-200 shrink-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={themeAccent}
                    onChange={e => setThemeAccent(e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-mono font-bold text-slate-700 focus:outline-none p-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Adresse Géographique *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="ex: Essos, Yaoundé, Cameroun"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none transition-all font-medium dynamic-border-primary dynamic-focus"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
                Numéro de Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="ex: +237 677 88 99 00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none transition-all font-medium dynamic-border-primary dynamic-focus"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 dynamic-secondary-text">
              Adresse E-mail administrative
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ex: info@ecole-vogt.cm"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none transition-all font-medium dynamic-border-primary dynamic-focus"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer mt-6 dynamic-primary-btn"
          >
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span>{editingSchoolId ? 'Enregistrer les Modifications' : 'Créer & Activer l\'Établissement'}</span>
          </button>
        </form>
      </div>

      {/* Live Preview Panel */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 sticky top-6 dynamic-border-primary">
          <div className="pb-3 border-b border-slate-100 dynamic-border-primary">
            <h4 className="text-sm font-bold flex items-center space-x-2 dynamic-primary-text">
              <Activity className="h-4 w-4 text-indigo-500 dynamic-primary-text" />
              <span>Aperçu en Temps Réel du Dashboard</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Observez comment le thème de l'école réagit en direct à votre configuration de couleurs.
            </p>
          </div>

          {/* Miniature Simulator */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs text-[11px] bg-slate-50 flex flex-col h-72 dynamic-border-primary">
            
            {/* Header mockup */}
            <div className="h-10 bg-white border-b border-slate-200 px-3 flex items-center justify-between shrink-0 dynamic-border-primary">
              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                {logoUrl ? (
                  <div className="h-5 w-5 rounded border border-slate-200 p-0.5 bg-white shrink-0 dynamic-border-primary">
                    <img src={logoUrl} alt="logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <span className="text-xs shrink-0">{logoEmoji}</span>
                )}
                <span className="font-bold text-slate-800 text-[10px] truncate">
                  {name || 'Nom de l\'établissement'}
                </span>
              </div>
              <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                {activeSchoolYear}
              </span>
            </div>

            {/* Content body layout mockup */}
            <div className="flex-1 flex overflow-hidden">
              {/* Simulated Sidebar */}
              <div className="w-20 text-white py-2 px-1 flex flex-col space-y-1 justify-between shrink-0 transition-all duration-300" style={{ backgroundColor: themeSecondary }}>
                <div className="space-y-1">
                  <div className="h-5 rounded px-1.5 flex items-center space-x-1" style={{ backgroundColor: `${themePrimary}20`, color: themePrimary }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themePrimary }}></span>
                    <span className="text-[8px] font-bold">Acceuil</span>
                  </div>
                  <div className="h-5 rounded px-1.5 flex items-center text-slate-400/80">
                    <span className="text-[8px]">Données</span>
                  </div>
                  <div className="h-5 rounded px-1.5 flex items-center text-slate-400/80">
                    <span className="text-[8px]">Bulletins</span>
                  </div>
                </div>
                
                <div className="text-[7px] text-slate-300/60 p-1 bg-black/20 rounded text-center">
                  Cameroun
                </div>
              </div>

              {/* Simulated Dashboard Content */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {/* Warning Badge Card with Accent Color */}
                <div className="p-2 rounded-lg border flex items-center space-x-1.5 text-[9px] bg-white transition-all duration-300 dynamic-accent-border" style={{ borderColor: `${themeAccent}40` }}>
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: themeAccent }} />
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold" style={{ color: themeAccent }}>Mise à jour :</span>
                    <p className="text-slate-500 text-[8px] truncate">Système configuré en {systemVersionInput}</p>
                  </div>
                </div>

                {/* Slogan card */}
                <div className="bg-white border border-slate-100 p-2 rounded-lg shadow-2xs text-center">
                  <p className="text-slate-400 text-[7px] font-bold uppercase tracking-wide">Slogan</p>
                  <p className="text-[9px] text-slate-600 italic font-medium truncate">« {slogan || 'Excellence et Rigueur'} »</p>
                </div>

                {/* Primary Mock Button */}
                <button
                  type="button"
                  className="w-full text-white font-extrabold text-[9px] py-1.5 rounded-md shadow-xs text-center transition-all duration-300"
                  style={{ backgroundColor: themePrimary }}
                >
                  Bouton Primaire
                </button>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-[10px] leading-relaxed text-slate-500 flex items-start space-x-2 dynamic-border-primary">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5 dynamic-primary-text" />
            <span>
              Les couleurs modifiées sont appliquées en direct. Vous devez enregistrer pour appliquer définitivement la charte à l'établissement.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
