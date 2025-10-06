import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center space-x-2">
      <label className="text-xs text-gray-500">Language</label>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm"
        aria-label="Language selector"
      >
        <option value="en">English</option>
        <option value="te">తెలుగు</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
