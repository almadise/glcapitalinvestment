'use client';
import React from 'react';
import { captureError } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-navy mb-2">Une erreur est survenue</h3>
          <p className="text-slate-500 text-sm mb-4 max-w-sm">
            {this.state.error?.message || 'Erreur inattendue. Veuillez réessayer.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors"
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
