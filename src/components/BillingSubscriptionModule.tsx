/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  Zap,
  ShieldCheck,
  Download,
  Phone,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Receipt,
  Clock,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Building2,
  Calendar,
  Loader2,
  X,
  FileCheck,
  ArrowLeft
} from 'lucide-react';
import { SchoolSubscription, SchoolTenant } from '../types';

interface BillingSubscriptionModuleProps {
  subscription?: SchoolSubscription;
  setSubscription: React.Dispatch<React.SetStateAction<SchoolSubscription>>;
  activeSchool?: SchoolTenant;
  addAuditLog: (action: string, schoolId: string, details: string) => void;
  onBack?: () => void;
}

export default function BillingSubscriptionModule({
  subscription = {
    schoolId: '',
    plan: 'STANDARD',
    planType: 'STANDARD',
    status: 'ACTIVE',
    priceMonthlyFcfa: 75000,
    validUntil: '2026-08-31',
    expiryDate: '2026-08-31',
    smsCreditsRemaining: 0,
    smsIncluded: 1000,
    smsUsed: 0,
    maxStudents: 2000,
    features: [
      'Gestion multi-classes et élèves illimitée',
      'Module de présences et d\'appel numérique avec export PDF',
      'Gestion des notes, séquences et calcul de moyennes',
      'Portail parents & élèves interactif',
      'Site public de l\'établissement & pré-inscriptions en ligne',
      'Bibliothèque numérique d\'épreuves et de cours',
      'Exportation des bulletins officiels MINESEC',
      'Passerelle SMS instantanée',
      'Support technique dédié 7j/7'
    ]
  },
  setSubscription,
  activeSchool,
  addAuditLog,
  onBack
}: BillingSubscriptionModuleProps) {
  // Mode tabs: 'overview' | 'sms_recharge' | 'plans' | 'invoices'
  const [activeTab, setActiveTab] = useState<'overview' | 'sms_recharge' | 'plans' | 'invoices'>('overview');

  // Derived properties with safe defaults
  const currentPlan = subscription.plan || (subscription.planType === 'PRO_EXCELLENCE' ? 'PREMIUM' : 'STANDARD');
  const validUntilDate = subscription.validUntil || subscription.expiryDate || '2026-08-31';
  const smsCredits = subscription.smsCreditsRemaining ?? 0;
  const maxStudentsCount = subscription.maxStudents ?? (subscription.studentCount ? subscription.studentCount + 500 : 2500);
  const activeFeatures = subscription.features && subscription.features.length > 0 ? subscription.features : [
    'Gestion multi-classes et élèves illimitée',
    'Module de présences et d\'appel numérique avec export PDF',
    'Gestion des notes, séquences et calcul de moyennes',
    'Portail parents & élèves interactif',
    'Site public de l\'établissement & pré-inscriptions en ligne',
    'Bibliothèque numérique d\'épreuves et de cours',
    'Exportation des bulletins officiels MINESEC',
    'Passerelle SMS instantanée',
    'Support technique dédié 7j/7'
  ];

  // SMS Recharge State
  const [selectedSmsPack, setSelectedSmsPack] = useState<{ count: number; price: number; label: string }>({
    count: 2500,
    price: 35000,
    label: 'Pack Trimestriel'
  });
  const [paymentMethod, setPaymentMethod] = useState<'OM' | 'MOMO' | 'VIREMENT'>('OM');
  const [phoneNumberPayer, setPhoneNumberPayer] = useState('+237 699 00 11 22');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'IDLE' | 'SENDING_USSD' | 'WAITING_PIN' | 'SUCCESS'>('IDLE');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Upgrade Confirmation Modal
  const [planToUpgrade, setPlanToUpgrade] = useState<{ id: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'; name: string; price: number } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // In-app Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Invoices List
  const [invoices, setInvoices] = useState([
    { id: 'INV-2025-001', date: '2025-09-01', label: 'Abonnement Annuel ADS Store - Forfait Excellence', amount: 350000, status: 'PAYÉ', receiptUrl: '#' },
    { id: 'INV-2025-002', date: '2025-11-15', label: 'Recharge 5 000 Crédits SMS Notification Parentale', amount: 65000, status: 'PAYÉ', receiptUrl: '#' },
    { id: 'INV-2026-003', date: '2026-01-10', label: 'Pack 2 500 SMS Bulletins Trimestre 2', amount: 35000, status: 'PAYÉ', receiptUrl: '#' },
  ]);

  // Handle SMS recharge execution with multi-step carrier simulation
  const handleExecuteSmsRecharge = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phoneNumberPayer.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setPhoneError('Veuillez saisir un numéro de téléphone valide au format +237 6xx xx xx xx.');
      return;
    }
    setPhoneError(null);
    setIsProcessingPayment(true);
    setPaymentStep('SENDING_USSD');

    // Step 1: Push USSD
    setTimeout(() => {
      setPaymentStep('WAITING_PIN');

      // Step 2: User approves with PIN code
      setTimeout(() => {
        setSubscription(prev => ({
          ...prev,
          smsCreditsRemaining: (prev.smsCreditsRemaining ?? 3450) + selectedSmsPack.count
        }));

        const newInv = {
          id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString().split('T')[0],
          label: `Recharge ${selectedSmsPack.count.toLocaleString()} SMS (${selectedSmsPack.label})`,
          amount: selectedSmsPack.price,
          status: 'PAYÉ',
          receiptUrl: '#'
        };

        setInvoices(prev => [newInv, ...prev]);
        setPaymentStep('SUCCESS');
        setIsProcessingPayment(false);
        addAuditLog('Recharge Crédits SMS', activeSchool.id, `Achat de ${selectedSmsPack.count} SMS (${selectedSmsPack.price} FCFA via ${paymentMethod} au ${phoneNumberPayer}).`);
        showToast(`${selectedSmsPack.count.toLocaleString()} crédits SMS ajoutés à votre solde.`, 'success');

        setTimeout(() => {
          setPaymentStep('IDLE');
          setActiveTab('overview');
        }, 2200);
      }, 1500);
    }, 1200);
  };

  // Execute Plan Upgrade
  const confirmPlanUpgrade = () => {
    if (!planToUpgrade) return;
    setIsUpgrading(true);

    setTimeout(() => {
      setSubscription(prev => ({
        ...prev,
        plan: planToUpgrade.id,
        maxStudents: planToUpgrade.id === 'PREMIUM' ? 3000 : planToUpgrade.id === 'ENTERPRISE' ? 10000 : 800,
        features: [
          'Gestion multi-classes et élèves illimitée',
          'Module de présences et d\'appel numérique',
          'Gestion des notes, séquences et calcul automatisé',
          'Portail parents & élèves interactif',
          'Site public de l\'établissement & pré-inscriptions',
          'Bibliothèque numérique & épreuves',
          'Exportation PDF et bulletins officiels MINESEC',
          'Passerelle SMS instantanée',
          'Support technique dédié 7j/7'
        ]
      }));

      const newInv = {
        id: `INV-UPG-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        label: `Mise à niveau vers le Forfait ${planToUpgrade.id} ADS Store`,
        amount: planToUpgrade.price,
        status: 'PAYÉ',
        receiptUrl: '#'
      };

      setInvoices(prev => [newInv, ...prev]);
      addAuditLog('Mise à niveau Abonnement', activeSchool.id, `Passage de l'école au forfait ${planToUpgrade.id}.`);
      setIsUpgrading(false);
      const upgradedPlanName = planToUpgrade.name;
      setPlanToUpgrade(null);
      showToast(`Votre établissement est désormais souscrit au forfait ${upgradedPlanName}.`, 'success');
      setActiveTab('overview');
    }, 1000);
  };

  // Download invoice helper
  const handleDownloadInvoice = (inv: typeof invoices[0]) => {
    const text = `========================================================================
ACADEMIC DATA STORE (ADS STORE) • FACTURE OFFICIELLE D'ABONNEMENT
ÉDITEUR : NHR DIGITAL AGENCY / ADS CLOUD SERVICES
CLIENT : ${activeSchool.name.toUpperCase()} (ID: ${activeSchool.id})
========================================================================

FACTURE N° : ${inv.id}
DATE D'ÉMISSION : ${inv.date}
OBJET : ${inv.label}
MONTANT TOTAL : ${inv.amount.toLocaleString()} FCFA
STATUT : ${inv.status}
MODE DE RÈGLEMENT : Mobile Money / Virement Bancaire Certifié

DÉTAILS DES SERVICES COUVERTS :
- Accès illimité à l'infrastructure SaaS Cloud
- Hébergement de la base de données scolaire
- Synchronisation multi-postes et sauvegarde quotidienne
- Certificat de conformité MINESEC

Merci de votre confiance.
Plateforme ADS Store Cameroun • contact@academic.cm
========================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.id}_${activeSchool.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Facture ${inv.id} téléchargée.`, 'info');
  };

  return (
    <div className="space-y-6" id="billing-subscription-module">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold transition-all border ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center space-x-1.5 text-xs font-bold shrink-0"
              title="Retour à la page précédente"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight flex items-center gap-2 flex-wrap">
              Facturation SaaS, Abonnements & Recharges SMS
              <span className="text-xs bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                Plan {currentPlan} ACTIF
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Gestion de la licence logicielle de l'école, passerelle d'alertes SMS et historique des factures
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-stretch md:self-auto justify-center overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'Ensemble', icon: ShieldCheck },
            { id: 'sms_recharge', label: 'Recharger SMS', icon: MessageSquare },
            { id: 'plans', label: 'Changer de Plan', icon: Zap },
            { id: 'invoices', label: `Factures (${invoices.length})`, icon: Receipt },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VUE D'ENSEMBLE DE LA LICENCE & CRÉDITS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Plan Hero Card */}
          <div className="bg-linear-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  LICENCE ACADEMIC DATA STORE
                </span>
                <h2 className="text-2xl font-bold font-display text-white mt-1">
                  Forfait Actuel : <span className="text-emerald-400 font-extrabold">{currentPlan}</span>
                </h2>
                <p className="text-xs text-slate-300 font-mono">
                  Échéance du contrat : <span className="text-white font-bold">{validUntilDate}</span> • Statut : <span className="text-emerald-400 font-bold">VALIDE & EN RÈGLE</span>
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('sms_recharge')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Acheter des SMS</span>
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  Mettre à niveau
                </button>
              </div>
            </div>

            {/* Quota gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-300">Solde Crédits SMS Alertes</span>
                <div className="text-2xl font-bold font-mono text-amber-300">
                  {smsCredits.toLocaleString()} SMS
                </div>
                <p className="text-[10px] text-slate-300">Passerelle Orange & MTN opérationnelle</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-300">Capacité Élèves Autorisée</span>
                <div className="text-2xl font-bold font-mono text-blue-300">
                  {maxStudentsCount.toLocaleString()} Élèves
                </div>
                <p className="text-[10px] text-slate-300">Quota extensible sur demande</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-300">Disponibilité du Serveur</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">99.98%</div>
                <p className="text-[10px] text-slate-300">Hébergement Cloud haute performance</p>
              </div>
            </div>
          </div>

          {/* Included Features List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Fonctionnalités Incluses dans votre Forfait</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECHARGE PACKS SMS PARENTS */}
      {/* ========================================================================= */}
      {activeTab === 'sms_recharge' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">
              <MessageSquare className="h-4 w-4" />
              <span>Passerelle d'Alertes Parentales</span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
              Recharger le Solde de SMS de l’Établissement
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Utilisé pour notifier immédiatement les parents lors d'une absence, retard ou publication de bulletin.
            </p>
          </div>

          {paymentStep === 'SENDING_USSD' && (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 animate-in fade-in">
              <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Envoi de la requête de paiement sécurisée...</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Connexion à la passerelle {paymentMethod === 'OM' ? 'Orange Money' : paymentMethod === 'MOMO' ? 'MTN Mobile Money' : 'Bancaire'}...
                </p>
              </div>
            </div>
          )}

          {paymentStep === 'WAITING_PIN' && (
            <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-amber-900 text-base">Validation sur votre téléphone requise</h3>
                <p className="text-xs text-amber-800 max-w-md mx-auto">
                  Un message USSD a été envoyé au <span className="font-mono font-bold">{phoneNumberPayer}</span>. Tapez votre code secret pour autoriser le débit de <span className="font-mono font-bold">{selectedSmsPack.price.toLocaleString()} FCFA</span>.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-amber-700 font-mono">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>En attente de confirmation opérateur...</span>
              </div>
            </div>
          )}

          {paymentStep === 'SUCCESS' && (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3 animate-in zoom-in-95">
              <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-900 text-base">Recharge SMS Validée avec Succès !</h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                {selectedSmsPack.count.toLocaleString()} crédits SMS ont été ajoutés à votre solde. La facture correspondante a été générée.
              </p>
            </div>
          )}

          {paymentStep === 'IDLE' && (
            <form onSubmit={handleExecuteSmsRecharge} className="space-y-6">
              {/* Select SMS Pack */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Choisissez un Pack de SMS :</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { count: 1000, price: 15000, label: 'Pack Découverte', unit: '15 FCFA / SMS' },
                    { count: 2500, price: 35000, label: 'Pack Trimestriel (Recommandé)', unit: '14 FCFA / SMS' },
                    { count: 10000, price: 120000, label: 'Pack Annuel Établissement', unit: '12 FCFA / SMS' },
                  ].map(pack => (
                    <div
                      key={pack.count}
                      onClick={() => setSelectedSmsPack(pack)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2 ${
                        selectedSmsPack.count === pack.count
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {pack.label}
                      </span>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {pack.count.toLocaleString()} SMS
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {pack.price.toLocaleString()} FCFA
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{pack.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Mode de Règlement Instantané :</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'OM', label: 'Orange Money Cameroun', icon: Smartphone },
                    { id: 'MOMO', label: 'MTN Mobile Money', icon: Smartphone },
                    { id: 'VIREMENT', label: 'Virement / Chèque', icon: Building2 },
                  ].map(method => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border text-left flex flex-col items-center text-center space-y-1 transition-all cursor-pointer ${
                          paymentMethod === method.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone payer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Numéro du compte payeur (Validation par code USSD)
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumberPayer}
                  onChange={e => {
                    setPhoneNumberPayer(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  className={`w-full px-3.5 py-2 text-xs bg-slate-50 border rounded-xl font-mono text-slate-800 transition-all ${
                    phoneError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                />
                {phoneError && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{phoneError}</span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                <span>Payer {selectedSmsPack.price.toLocaleString()} FCFA & Créditer Immédiatement</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GRILLE DES PLANS SAAS */}
      {/* ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl font-bold font-display text-slate-900">Grille Tarifaire Annuelle Academic Data Store</h2>
            <p className="text-xs text-slate-500 font-mono">
              Des tarifs adaptés à la taille et aux ambitions pédagogiques de chaque établissement scolaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'BASIC',
                name: 'Plan Collège Standard',
                price: 250000,
                students: 'Jusqu\'à 500 Élèves',
                desc: 'Idéal pour petits collèges privés et structures de proximité.',
                features: ['Gestion Présences & Notes', 'Bulletins de Séquence PDF', '1 000 SMS offerts', 'Support par email']
              },
              {
                id: 'PREMIUM',
                name: 'Plan Lycée Excellence (Recommandé)',
                price: 450000,
                students: 'Jusqu\'à 3 000 Élèves',
                desc: 'Pour grands lycées et collèges bilingues à forte réputation.',
                popular: true,
                features: ['Tout le Plan Collège', 'Site Public Officiel & Pré-inscriptions', 'Bibliothèque d\'épreuves et cours', 'Portail Parents & Élèves complet', '5 000 SMS offerts', 'Formation sur site']
              },
              {
                id: 'ENTERPRISE',
                name: 'Plan Groupe Scolaire / Réseau',
                price: 850000,
                students: 'Élèves Illimités',
                desc: 'Pour réseaux d\'écoles, diocèses et grands complexes éducatifs.',
                features: ['Multi-Campus & Multi-Établissements', 'Tableaux de bord consolidés', 'API et exports personnalisés', 'SMS illimités au tarif préférentiel', 'Chef de projet dédié']
              }
            ].map(plan => (
              <div
                key={plan.id}
                className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 relative ${
                  plan.popular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                    CHOIX POPULAIRE
                  </span>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-display">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">
                      {plan.price.toLocaleString()} FCFA
                    </span>
                    <span className="text-xs text-slate-400 font-mono"> / an</span>
                    <span className="block text-[11px] text-emerald-600 font-bold font-mono mt-0.5">{plan.students}</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 pt-2">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setPlanToUpgrade({ id: plan.id as any, name: plan.name, price: plan.price })}
                  disabled={currentPlan === plan.id}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    currentPlan === plan.id
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {currentPlan === plan.id ? 'Forfait Actuellement Souscrit' : 'Choisir ce Forfait'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HISTORIQUE DES FACTURES & QUITTANCES */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold font-display text-slate-900">Historique des Factures & Quittances de Paiement</h3>
              <p className="text-xs text-slate-500 font-mono">Téléchargez vos pièces comptables certifiées</p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Aucune facture émise pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <div key={inv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {inv.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{inv.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Émise le {inv.date} • Règlement Mobile Money Certifié
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-auto">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {inv.amount.toLocaleString()} FCFA
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {inv.status}
                    </span>
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Télécharger la facture"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Upgrade Confirmation Modal */}
      {planToUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">Mise à niveau Licence</span>
                <h3 className="text-base font-bold text-slate-900 font-display">Souscrire au {planToUpgrade.name}</h3>
              </div>
              <button
                onClick={() => setPlanToUpgrade(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-950 font-bold">
                <span>Tarif Annuel :</span>
                <span className="font-mono text-base">{planToUpgrade.price.toLocaleString()} FCFA</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Votre établissement {activeSchool.name} bénéficiera immédiatement de toutes les fonctionnalités avancées avec facture certifiée MINESEC.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanToUpgrade(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmPlanUpgrade}
                disabled={isUpgrading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-75"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Activation...</span>
                  </>
                ) : (
                  <span>Confirmer la souscription</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
