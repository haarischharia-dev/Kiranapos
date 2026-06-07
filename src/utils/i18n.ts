import { storage } from '../db/seedImporter';

const dictionaries: Record<string, Record<string, string>> = {
  en: {
    "Welcome": "Welcome",
    "Scan Items": "Scan Items",
    "Total": "Total",
    "Checkout": "Checkout",
    "Cash": "Cash",
    "UPI": "UPI",
    "Khata": "Khata",
    "Pair Printer": "Pair Printer",
    "Skip for Now": "Skip for Now",
    "Day Close": "Day Close",
  },
  hi: {
    "Welcome": "स्वागत है",
    "Scan Items": "आइटम स्कैन करें",
    "Total": "कुल",
    "Checkout": "चेकआउट",
    "Cash": "नकद",
    "UPI": "यूपीआई",
    "Khata": "खाता",
    "Pair Printer": "प्रिंटर कनेक्ट करें",
    "Skip for Now": "अभी छोड़ें",
    "Day Close": "दिन बंद करें",
  }
};

export const useTranslation = () => {
  // Defaults to English
  const lang = storage.getString('app_language') || 'en';
  
  const t = (key: string): string => {
    const dictionary = dictionaries[lang] || dictionaries['en'];
    return dictionary[key] || key;
  };

  return { t, lang };
};
