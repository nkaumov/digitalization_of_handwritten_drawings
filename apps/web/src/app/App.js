import { jsx as _jsx } from "react/jsx-runtime";
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { AppLayout } from '@/app/AppLayout';
export function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(AppLayout, {}) }));
}
