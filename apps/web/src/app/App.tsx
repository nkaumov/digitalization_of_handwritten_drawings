import { ErrorBoundary } from '@/app/ErrorBoundary';
import { AppLayout } from '@/app/AppLayout';

export function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  );
}