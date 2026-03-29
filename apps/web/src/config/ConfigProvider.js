import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { appConfig } from '@/config/env';
const ConfigContext = createContext(appConfig);
export function ConfigProvider({ children }) {
    return _jsx(ConfigContext.Provider, { value: appConfig, children: children });
}
export function useAppConfig() {
    return useContext(ConfigContext);
}
