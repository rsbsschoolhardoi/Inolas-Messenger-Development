import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-300 max-w-lg mx-auto flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {this.props.fallbackTitle || 'Component Error Encountered'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred while rendering this module.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
