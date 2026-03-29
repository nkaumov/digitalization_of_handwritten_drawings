import { type ReactNode } from 'react';
import { type AppConfig } from '@/config/env';
interface ConfigProviderProps {
    children: ReactNode;
}
export declare function ConfigProvider({ children }: ConfigProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAppConfig(): AppConfig;
export {};
