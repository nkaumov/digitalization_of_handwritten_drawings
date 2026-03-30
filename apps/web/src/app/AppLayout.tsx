import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { EditorShellPage } from '@/features/editor-shell';

export function AppLayout() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('app.title');
  }, [t, i18n.language]);

  return <EditorShellPage />;
}
