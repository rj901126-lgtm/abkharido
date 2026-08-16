// Smart Bilingual Hindi/Hinglish to English Search Mapping & Normalization Engine
export const hindiToEnglishMap = {
  // Devanagari Hindi words
  'मोबाइल': 'mobile',
  'फोन': 'phone',
  'स्मार्टफोन': 'smartphone',
  'आईफोन': 'iphone',
  'सैमसंग': 'samsung',
  'ऐप्पल': 'apple',
  'एप्पल': 'apple',
  'वनप्लस': 'oneplus',
  'जूते': 'shoes',
  'जूता': 'shoes',
  'स्नीकर्स': 'sneakers',
  'चप्पल': 'sandal',
  'सैंडल': 'sandal',
  'घड़ी': 'watch',
  'घडी': 'watch',
  'स्मार्टवॉच': 'smartwatch',
  'कपड़े': 'fashion',
  'कपड़ा': 'fashion',
  'टीशर्ट': 'tshirt',
  'शर्ट': 'shirt',
  'जींस': 'jeans',
  'लैपटॉप': 'laptop',
  'कंप्यूटर': 'computer',
  'टीवी': 'tv',
  'टेलीविजन': 'tv',
  'ईयरफोन': 'earphone',
  'ईयरबड्स': 'earbuds',
  'हेडफोन': 'headphones',
  'स्पीकर': 'speaker',
  'किचन': 'kitchen',
  'घर': 'home',
  'कुर्ता': 'kurta',
  'साड़ी': 'saree',
  'बैग': 'bag',
  'चश्मा': 'glasses',
  'कैमरा': 'camera',

  // Common Hinglish / colloquial Indian pronunciation & typo variations
  'juta': 'shoes',
  'joote': 'shoes',
  'joota': 'shoes',
  'ghadi': 'watch',
  'ghari': 'watch',
  'kapda': 'fashion',
  'kapde': 'fashion',
  'chappal': 'sandal',
  'fone': 'phone',
  'ifone': 'iphone',
  'mobic': 'mobile',
  'samung': 'samsung',
  'one plus': 'oneplus',
  'earbud': 'earbuds',
  'airpod': 'earbuds',
  'airpods': 'earbuds'
};

export const normalizeSearchQuery = (query) => {
  if (!query) return '';
  let clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Direct match if the entire input matches a known term
  if (hindiToEnglishMap[lower]) {
    return hindiToEnglishMap[lower];
  }
  if (hindiToEnglishMap[clean]) {
    return hindiToEnglishMap[clean];
  }

  // 2. Word-by-word replacement inside compound sentences (e.g. "samsung का फोन", "अच्छे जूते")
  Object.keys(hindiToEnglishMap).forEach(key => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'gi');
    if (regex.test(clean)) {
      clean = clean.replace(regex, hindiToEnglishMap[key]);
    }
  });

  return clean;
};
