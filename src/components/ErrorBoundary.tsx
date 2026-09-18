import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('adsp_logged_in');
      localStorage.removeItem('adsp_user');
    } catch {}
    window.location.reload();
  };

  public render() {
    const { hasError, error } = this.state || {};
    if (hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-white">
                Chargement de l'Application
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Une interruption temporaire a été détectée lors de l'initialisation des composants. Cliquez sur le bouton ci-dessous pour relancer l'application.
              </p>
            </div>

            {error?.message && (
              <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                {error.message}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recharger l'application</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <span>Réinitialiser la session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;

