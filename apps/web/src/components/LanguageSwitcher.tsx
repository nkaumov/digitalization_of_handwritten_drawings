import { useTranslation } from 'react-i18next';

import { SUPPORTED_LOCALES, type Locale } from '@/config/env';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (locale: Locale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <div className="language-switcher">
      <span className="language-switcher__label">{t('language.label')}</span>
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={locale === i18n.language ? 'is-active' : ''}
          onClick={() => changeLanguage(locale)}
          aria-pressed={locale === i18n.language}
        >
          {t(`language.${locale}`)}
        </button>
      ))}
    </div>
  );
}