"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import React from "react";

import { AdminButton } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AdminErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-12 text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-red-700">Algo deu errado</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            {this.state.error.message || "Ocorreu um erro inesperado."}
          </p>
          <AdminButton onClick={this.handleReset} variant="primary" className="mt-6">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            <span>Tentar novamente</span>
          </AdminButton>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for convenience
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, reset: () => void) => React.ReactNode,
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <AdminErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AdminErrorBoundary>
    );
  };
}
