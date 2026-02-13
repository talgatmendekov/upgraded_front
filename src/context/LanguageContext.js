// src/context/LanguageContext.js

import React, { createContext, useContext, useState } from 'react';
import { translations } from '../data/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(
    localStorage.getItem('scheduleLanguage') || 'en'
  );

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('scheduleLanguage', newLang);
  };

  // t() translates a key, replacing {placeholders} with values
  const t = (key, replacements = {}) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
