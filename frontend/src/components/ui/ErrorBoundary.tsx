import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches React reconciliation errors (e.g. insertBefore on
 * unmounted nodes) and shows a friendly in-place recovery UI instead of
 * blowing up the whole dashboard page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-72 flex-col items-center justify-center gap-5 rounded-2xl border border-white/[0.06] bg-slate-900/40 p-8 text-center backdrop-blur">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertTriangle className="h-7 w-7 text-amber-400" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-100">
              Une erreur est survenue lors de l'affichage
            </p>
            <p className="max-w-md text-sm text-slate-500">
              {this.state.error?.message || 'Erreur inconnue'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-[#1a1405] shadow-[0_8px_24px_-8px_rgba(205,164,52,0.55)] transition-all duration-300 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
