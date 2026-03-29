import { createContext, useContext, type ReactNode } from 'react';

import { appConfig, type AppConfig } from '@/config/env';

const ConfigContext = createContext<AppConfig>(appConfig);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  return <ConfigContext.Provider value={appConfig}>{children}</ConfigContext.Provider>;
}

export function useAppConfig() {
  return useContext(ConfigContext);
}