/**
 * =========================================================================
 * Application Constants (constants.tsx)
 * -------------------------------------------------------------------------
 * Holds global application configurations, static lists (like languages), 
 * translations mappings, category layouts, unit formats, etc.
 * Keeps constant data separate from component rendering logic.
 * =========================================================================
 */

export const INDIAN_LANGUAGES = [
  { code: 'EN', name: 'English', native: 'English', region: 'All' },
  { code: 'HI', name: 'Hindi', native: 'हिन्दी', region: 'North' },
  { code: 'AS', name: 'Assamese', native: 'অসমীয়া', region: 'Assam' },
  { code: 'BN', name: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
  { code: 'GU', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'KN', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ML', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { code: 'MR', name: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { code: 'OR', name: 'Odia', native: 'ଓਡ଼ਿਆ', region: 'Odisha' },
  { code: 'PA', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab' },
  { code: 'TA', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'TE', name: 'Telugu', native: 'తెలుగు', region: 'Andhra/Telangana' },
  { code: 'UR', name: 'Urdu', native: 'اردو', region: 'All' },
  { code: 'KOK', name: 'Konkani', native: 'कोंकणी', region: 'Goa' },
  { code: 'MNI', name: 'Manipuri', native: 'ਮণিপুরী', region: 'Manipur' },
  { code: 'NE', name: 'Nepali', native: 'नेपाली', region: 'Sikkim' },
  { code: 'SA', name: 'Sanskrit', native: 'संस्कृतम्', region: 'All' },
  { code: 'SD', name: 'Sindhi', native: 'سنڌي', region: 'All' },
  { code: 'BRX', name: 'Bodo', native: 'बড়ो', region: 'Assam' },
  { code: 'DOI', name: 'Dogri', native: 'डोगरी', region: 'J&K' },
  { code: 'MAI', name: 'Maithili', native: 'मैथिली', region: 'Bihar' },
  { code: 'SAT', name: 'Santali', native: 'সাঁওতালি', region: 'East' }
];

export const TRANSLATIONS: Record<string, any> = {
  EN: {
    appName: 'Vyaparika',
    tagline: 'Smart inventory intelligence for Indian businesses',
    branding: 'Vyaparika — by Vinayak',
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    insights: 'Tips',
    settings: 'Settings',
    expenses: 'Expenses',
    connections: 'Network',
    payments: 'Payments',
    addStock: 'New Item',
    updateStock: 'Update Stock',
    lowStock: 'Low Stock',
    healthScore: 'Inventory Health',
    totalItems: 'Total Items',
    whyThis: 'Why this suggestion?',
    privacyMode: 'Cash Privacy Mode',
    scanBarcode: 'Scan Barcode',
    manualEntry: 'Manual Entry',
    recommendation: 'Recommended for you',
    onboardingStep1: 'Select Language',
    onboardingStep2: 'Confirm Location',
    onboardingStep3: 'Shop Details',
    onboardingStep4: 'Privacy Promise',
    getStarted: 'Get Started',
    continue: 'Continue',
    stockIn: 'Stock In',
    stockOut: 'Stock Out',
    saveChanges: 'Save Changes',
    theme: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    signup: 'Create Profile',
    phone: 'Phone Number',
    email: 'Email Address',
    password: 'Password',
    role: 'What is your role?',
    connect: 'Connect Business',
    nearestStore: 'Nearest Stores',
    addExpense: 'Add Expense',
    totalExpenses: 'Total Expenses'
  },
  HI: {
    appName: 'Vyaparika',
    tagline: 'भारतीय व्यवसायों के लिए स्मार्ट इन्वेंट्री इंटेलिजेंस',
    branding: 'Vyaparika — Vinayak द्वारा',
    dashboard: 'डैशबोर्ड',
    inventory: 'स्टॉक लिस्ट',
    insights: 'AI सुझाव',
    settings: 'सेटिंग्स',
    expenses: 'खर्च',
    connections: 'नेटवर्क',
    payments: 'भुगतान',
    addStock: 'नया आइटम',
    updateStock: 'स्टॉक बदलें',
    lowStock: 'कम स्टॉक',
    healthScore: 'स्टॉक स्कोर',
    totalItems: 'कुल सामान',
    whyThis: 'यह सुझाव क्यों?',
    privacyMode: 'कैश प्राइवेसी मोड',
    scanBarcode: 'स्कैन करें',
    manualEntry: 'मैन्युअल एंट्री',
    recommendation: 'आपके लिए सुझाव',
    onboardingStep1: 'भाषा चुनें',
    onboardingStep2: 'लोकेशन पुष्टि',
    onboardingStep3: 'दुकान की जानकारी',
    onboardingStep4: 'प्राइवेसी वादा',
    getStarted: 'शुरू करें',
    continue: 'आगे बढ़ें',
    stockIn: 'स्टॉक जोड़ें',
    stockOut: 'स्टॉक निकालें',
    saveChanges: 'सुरक्षित करें',
    theme: 'दिखावट',
    light: 'लाइट',
    dark: 'डार्क',
    system: 'सिस्टम',
    signup: 'प्रोफाइल बनाएं',
    phone: 'मोबाइल नंबर',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    role: 'आपकी भूमिका क्या है?',
    connect: 'व्यापार जोड़ें',
    nearestStore: 'नजदीकी स्टोर',
    addExpense: 'खर्च जोड़ें',
    totalExpenses: 'कुल खर्च'
  }
};

export const CATEGORIES = {
  GROCERY: ['Dairy', 'Grains', 'Snacks', 'Beverages', 'Personal Care', 'Cleaning', 'Spices', 'Oils'],
  ELECTRONICS: ['Mobile', 'Laptop', 'Accessories', 'Appliances', 'Audio', 'Wearables', 'Components'],
  PHARMACY: ['Medicines', 'Surgical', 'Wellness', 'Baby Care'],
  CLOTHING: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories']
};

export const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Salary', 'Transport', 'Maintenance', 'Marketing', 'Other'];

export const UNITS = ['Units', 'kg', 'Litre', 'Boxes', 'Packets'];
