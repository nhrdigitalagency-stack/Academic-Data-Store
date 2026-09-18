/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SchoolTenant } from '../types';
import { DEFAULT_PALETTES, PREDEFINED_PALETTES } from '../utils/colorUtils';
import { Paintbrush, RotateCcw, Save, Sparkles, Check, Layout, AlertCircle } from 'lucide-react';

interface ThemeCustomizerProps {
  schools: SchoolTenant[];
  setSchools: React.Dispatch<React.SetStateAction<SchoolTenant[]>>;
  addAuditLog?: (action: string, schoolId: string, details: string) => void;
}

export default function ThemeCustomizer({
  schools,
  setSchools,
  addAuditLog
}: ThemeCustomizerProps) {
  // Current school selected for customization
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const activeSchool = schools.find(s => s.id === selectedSchoolId) || schools[0];

  // Hex preview states
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1e293b');
  const [accentColor, setAccentColor] = useState('#f59e0b');

  // Success state feedback
  const [successMsg, setSuccessMsg] = useState('');

  // Synchronize pickers with selected school
  useEffect(() => {
    if (activeSchool) {
      const colorKey = activeSchool.primaryColor || 'blue';
      const defaultPalette = DEFAULT_PALETTES[colorKey as keyof typeof DEFAULT_PALETTES] || DEFAULT_PALETTES.blue;
      setPrimaryColor(activeSchool.themePrimary || defaultPalette.primary);
      setSecondaryColor(activeSchool.themeSecondary || defaultPalette.secondary);
      setAccentColor(activeSchool.themeAccent || defaultPalette.accent);
    }
  }, [selectedSchoolId, activeSchool]);

  const handleResetToDefault = () => {
    if (!activeSchool) return;
    const colorKey = activeSchool.primaryColor || 'blue';
    const defaultPalette = DEFAULT_PALETTES[colorKey as keyof typeof DEFAULT_PALETTES] || DEFAULT_PALETTES.blue;
    
    setPrimaryColor(defaultPalette.primary);
    setSecondaryColor(defaultPalette.secondary);
    setAccentColor(defaultPalette.accent);

    setSchools(prev => prev.map(s => {
      if (s.id === selectedSchoolId) {
        return {
          ...s,
          themePrimary: undefined,
          themeSecondary: undefined,
          themeAccent: undefined
        };
      }
      return s;
    }));

    addAuditLog?.(
      "Réinitialisation thème",
      selectedSchoolId,
      `Réinitialisation de la charte graphique aux couleurs d'origine pour l'établissement "${activeSchool.name}".`
    );

    setSuccessMsg("Couleurs réinitialisées par défaut avec succès !");
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleApplyPalette = (palette: typeof PREDEFINED_PALETTES[0]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setAccentColor(palette.accent);
  };

  const handleSaveTheme = () => {
    if (!activeSchool) return;

    setSchools(prev => prev.map(s => {
      if (s.id === selectedSchoolId) {
        return {
          ...s,
          themePrimary: primaryColor,
          themeSecondary: secondaryColor,
          themeAccent: accentColor
        };
      }
      return s;
    }));

    addAuditLog?.(
      "Mise à jour thème",
      selectedSchoolId,
      `Modification de la charte graphique par le Super Administrateur : Primaire (${primaryColor}), Secondaire (${secondaryColor}), Accent (${accentColor}) pour l'établissement "${activeSchool.name}".`
    );

    setSuccessMsg(`Charte graphique de "${activeSchool.name}" enregistrée et appliquée !`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-base font-display font-bold text-slate-800 flex items-center space-x-2">
            <Paintbrush className="h-5 w-5 text-indigo-500" />
            <span>Sélecteur d'Établissement à Customiser</span>
          </h3>
          <p className="text-xs text-slate-400">
            Choisissez l'établissement dont vous souhaitez modifier ou réinitialiser la charte de couleurs de marque.
          </p>
        </div>

        <div className="w-full md:w-80 shrink-0">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">
            Sélectionner un Locataire
          </label>
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.logoEmoji || '🏫'} {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-xs">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Colors Selection & Palette Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              <span>Palette de Couleurs Personnalisée</span>
            </h4>

            {/* Individual Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary Color Picker */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                  Couleur Primaire
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <p className="text-[9px] text-slate-400">Boutons, onglets actifs, en-têtes</p>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                  Couleur Secondaire
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <p className="text-[9px] text-slate-400">Arrière-plan du menu latéral</p>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                  Couleur d'Accent
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <p className="text-[9px] text-slate-400">Alertes, badges, boutons d'accent</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Réinitialiser aux défauts</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTheme}
                className="inline-flex items-center space-x-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Save className="h-4 w-4" />
                <span>Appliquer & Enregistrer</span>
              </button>
            </div>
          </div>

          {/* Preset templates library */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Charger un Thème Prédéfini Académique</span>
            </h4>
            <p className="text-xs text-slate-400 leading-normal">
              Utilisez l'une des palettes soigneusement conçues par nos designers pour donner instantanément un style élégant et lisible.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {PREDEFINED_PALETTES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPalette(p)}
                  className="p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] font-mono text-slate-400 mr-1.5 font-bold">Aperçu :</span>
                    <span className="w-5 h-3.5 rounded" style={{ backgroundColor: p.primary }} title="Primaire"></span>
                    <span className="w-5 h-3.5 rounded" style={{ backgroundColor: p.secondary }} title="Secondaire"></span>
                    <span className="w-5 h-3.5 rounded" style={{ backgroundColor: p.accent }} title="Accent"></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Theme Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 sticky top-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Layout className="h-4 w-4 text-indigo-500" />
              <span>Aperçu en Temps Réel du Dashboard</span>
            </h4>
            
            <p className="text-xs text-slate-400 leading-normal">
              Observez comment le thème de l'école réagit instantanément à vos sélections de couleurs ci-contre.
            </p>

            {/* Mini Dashboard Widget Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs text-[11px] bg-slate-50 flex flex-col h-72">
              
              {/* Header mockup */}
              <div className="h-10 bg-white border-b border-slate-200 px-3 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                  <span className="font-bold text-slate-800 text-[10px] truncate max-w-[120px]">
                    {activeSchool?.name || 'Lycée Privé'}
                  </span>
                </div>
                <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                  Séquence 5
                </span>
              </div>

              {/* Content body layout mockup */}
              <div className="flex-1 flex overflow-hidden">
                {/* Simulated Sidebar */}
                <div className="w-20 text-white py-2 px-1 flex flex-col space-y-1 justify-between shrink-0" style={{ backgroundColor: secondaryColor }}>
                  <div className="space-y-1">
                    <div className="h-5 rounded px-1.5 flex items-center space-x-1" style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                      <span className="text-[8px] font-bold">Acceuil</span>
                    </div>
                    <div className="h-5 rounded px-1.5 flex items-center text-slate-400">
                      <span className="text-[8px]">Présences</span>
                    </div>
                    <div className="h-5 rounded px-1.5 flex items-center text-slate-400">
                      <span className="text-[8px]">Bulletins</span>
                    </div>
                  </div>
                  
                  <div className="text-[7px] text-slate-400 p-1 bg-black/20 rounded text-center">
                    Cameroun
                  </div>
                </div>

                {/* Simulated Dashboard Content */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto custom-scrollbar">
                  {/* Warning Badge Card with Accent Color */}
                  <div className="p-2 rounded-lg border flex items-center space-x-1.5 text-[9px] bg-white" style={{ borderColor: `${accentColor}40` }}>
                    <AlertCircle className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold" style={{ color: accentColor }}>Alerte absences :</span>
                      <p className="text-slate-500 text-[8px] truncate">3 élèves absents non justifiés</p>
                    </div>
                  </div>

                  {/* Stat Card with Primary Color */}
                  <div className="bg-white border border-slate-100 p-2.5 rounded-lg shadow-2xs space-y-1">
                    <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wide">Moyenne Générale</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-extrabold text-slate-800">14.25 / 20</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                        + 0.5pt
                      </span>
                    </div>
                  </div>

                  {/* Primary Mock Button */}
                  <button
                    type="button"
                    className="w-full text-white font-extrabold text-[9px] py-1.5 rounded-md shadow-xs transition-opacity text-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Valider le bulletin scolaire
                  </button>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-[11px] leading-relaxed text-slate-500 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Note :</strong> Les modifications effectuées sont enregistrées localement en mémoire et appliquées immédiatement à tous les modules utilisant la charte graphique de l'école active.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
