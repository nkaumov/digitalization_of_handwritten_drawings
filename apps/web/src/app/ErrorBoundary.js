import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import i18n from 'i18next';
export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('UI_ERROR_BOUNDARY', { error, info });
    }
    reset = () => {
        this.setState({ hasError: false });
    };
    render() {
        if (this.state.hasError) {
            return (_jsxs("main", { className: "error-view", role: "alert", "aria-live": "polite", children: [_jsx("h1", { children: i18n.t('errors.title') }), _jsx("p", { children: i18n.t('errors.description') }), _jsx("button", { type: "button", onClick: this.reset, children: i18n.t('errors.action') })] }));
        }
        return this.props.children;
    }
}
