import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from 'i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI_ERROR_BOUNDARY', { error, info });
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="error-view" role="alert" aria-live="polite">
          <h1>{i18n.t('errors.title')}</h1>
          <p>{i18n.t('errors.description')}</p>
          <button type="button" onClick={this.reset}>
            {i18n.t('errors.action')}
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}