'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}