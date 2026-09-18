/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DATABASE_SCHEMAS, API_ENDPOINTS, ApiEndpoint, TableSchema } from '../data/schemaDocs';
import { Database, FileCode, Check, Copy, Code, ListFilter, PlayCircle, Eye, CornerDownRight, ArrowLeft } from 'lucide-react';

interface ApiDocsProps {
  onBack?: () => void;
}

export default function ApiDocs({ onBack }: ApiDocsProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<'db' | 'api'>('db');
  const [selectedTable, setSelectedTable] = useState<string>('attendance_sheets');
  const [selectedApiCategory, setSelectedApiCategory] = useState<string>('All');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const tableCategories = DATABASE_SCHEMAS;
  const currentTable = DATABASE_SCHEMAS.find(t => t.tableName === selectedTable) || DATABASE_SCHEMAS[0];

  const apiCategories = ['All', 'Présences', 'Notes', 'Administration'];
  const filteredEndpoints = selectedApiCategory === 'All'
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter(e => e.category === selectedApiCategory);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-1 inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 shrink-0"
                title="Retour à la page précédente"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-mono font-bold tracking-widest uppercase mb-1">
                <Code className="h-4 w-4" />
                <span>Dev Specifications</span>
              </div>
              <h2 className="text-2xl font-display font-bold">Architecture & API REST</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Modèle de données relationnel normalisé et spécifications complètes des points d'accès API pour le développement de l'application ADS STORE.
              </p>
            </div>
          </div>
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl self-start md:self-auto border border-slate-800">
            <button
              onClick={() => setActiveSubTab('db')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'db'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Base de Données (SQL)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('api')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'api'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Endpoints API REST</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'db' ? (
        /* DATABASE TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List Selector */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm self-start">
            <h3 className="text-xs font-bold text-slate-400 font-display uppercase tracking-wider mb-3 px-1">
              Tables de la Base de Données
            </h3>
            <div className="space-y-1">
              {tableCategories.map((t) => (
                <button
                  key={t.tableName}
                  onClick={() => setSelectedTable(t.tableName)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition-all cursor-pointer ${
                    selectedTable === t.tableName
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent pl-3'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Database className={`h-4 w-4 shrink-0 ${selectedTable === t.tableName ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs">{t.tableName}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                    {t.fields.length} cols
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5 mb-2">
                <span>Régles de Gestion & Intégrité</span>
              </h4>
              <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Clés étrangères contraintes à <code className="text-rose-600 font-mono text-[10px]">ON DELETE CASCADE</code> pour propager l'effacement logique des fiches d'appel.</li>
                <li>Saisie des notes verrouillée après validation de la séquence par l'administration.</li>
                <li>Les notes sont exclusivement évaluées sur <code className="text-blue-700 font-bold font-mono">20</code>.</li>
              </ul>
            </div>
          </div>

          {/* Table Detail View */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold font-mono px-2.5 py-1 rounded">
                      TABLE
                    </span>
                    <h3 className="text-xl font-display font-bold text-slate-800 font-mono">
                      {currentTable.tableName}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {currentTable.description}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(currentTable.ddl, `ddl-${currentTable.tableName}`)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs rounded-lg transition-colors font-mono cursor-pointer"
                >
                  {copiedText === `ddl-${currentTable.tableName}` ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      <span className="text-emerald-700 font-bold">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copier DDL SQL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Schema Field Table */}
              <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-600 font-mono">
                      <th className="p-3">Champ</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Contraintes</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {currentTable.fields.map((f) => (
                      <tr key={f.name} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-800">{f.name}</td>
                        <td className="p-3 font-mono text-blue-700 font-medium">{f.type}</td>
                        <td className="p-3 font-mono text-amber-700">{f.constraints || '-'}</td>
                        <td className="p-3 text-slate-600 font-sans leading-relaxed">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Relations Block */}
              {currentTable.relations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                    Relations & Cardinalités
                  </h4>
                  <div className="space-y-1.5">
                    {currentTable.relations.map((rel, idx) => (
                      <div key={idx} className="flex items-start text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <CornerDownRight className="h-3.5 w-3.5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                        <span>{rel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DDL Code Box */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-md">
              <div className="bg-slate-950 px-6 py-3 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span className="ml-2">schema.sql</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">PostgreSQL</span>
              </div>
              <pre className="p-5 overflow-x-auto text-xs text-sky-300 font-mono leading-relaxed bg-slate-950/60 custom-scrollbar select-all">
                {currentTable.ddl}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* API ENDPOINTS TAB */
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <ListFilter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 font-display">Filtrer par module :</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {apiCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedApiCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedApiCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'Tous les endpoints' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-6">
            {filteredEndpoints.map((api, index) => {
              const badgeColors = {
                GET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                POST: 'bg-blue-50 text-blue-700 border-blue-200',
                PUT: 'bg-amber-50 text-amber-700 border-amber-200',
                DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
                PATCH: 'bg-purple-50 text-purple-700 border-purple-200'
              };

              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Endpoint Header */}
                  <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center space-x-3 min-w-0">
                      <span className={`px-3 py-1 font-mono font-bold text-xs border rounded-lg uppercase shrink-0 ${badgeColors[api.method]}`}>
                        {api.method}
                      </span>
                      <div className="min-w-0">
                        <code className="text-sm md:text-base font-mono font-bold text-slate-800 break-all">
                          {api.path}
                        </code>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          {api.description}
                        </p>
                      </div>
                    </div>
                    <span className="self-start md:self-auto text-[10px] font-semibold tracking-wider uppercase font-mono px-2.5 py-1 bg-slate-200 text-slate-600 rounded">
                      {api.category}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left details (Params / Body) */}
                    <div className="xl:col-span-5 space-y-4">
                      {api.queryParams && api.queryParams.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                            Paramètres de requête (Query params)
                          </h4>
                          <div className="space-y-2">
                            {api.queryParams.map((qp) => (
                              <div key={qp.name} className="flex flex-col p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-slate-700">{qp.name}</span>
                                  <div className="space-x-1.5 font-mono text-[10px]">
                                    <span className="text-slate-400">{qp.type}</span>
                                    {qp.required ? (
                                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">requis</span>
                                    ) : (
                                      <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">optionnel</span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-slate-500 mt-1 text-[11px]">{qp.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {api.requestBody && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-display">
                            Format du Corps (Request Body)
                          </h4>
                          <div className="relative">
                            <pre className="p-3 bg-slate-900 text-blue-200 font-mono text-xs rounded-xl overflow-x-auto custom-scrollbar max-h-56">
                              {api.requestBody}
                            </pre>
                            <button
                              onClick={() => handleCopy(api.requestBody || '', `body-${index}`)}
                              className="absolute top-2 right-2 p-1 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Copier le schéma"
                            >
                              {copiedText === `body-${index}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {!api.queryParams && !api.requestBody && (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl p-6 text-slate-400 text-xs">
                          Aucun paramètre ou corps requis pour cette requête.
                        </div>
                      )}
                    </div>

                    {/* Right detail (Response payload) */}
                    <div className="xl:col-span-7 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                          Exemple de Réponse (HTTP 200 OK)
                        </h4>
                        <button
                          onClick={() => handleCopy(api.responseExample, `resp-${index}`)}
                          className="flex items-center space-x-1 px-2 py-1 text-[11px] text-blue-600 hover:text-blue-800 font-mono transition-colors cursor-pointer"
                        >
                          {copiedText === `resp-${index}` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copier JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto custom-scrollbar max-h-72">
                          {api.responseExample}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
