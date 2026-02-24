import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Final Language Type - restricted to your target languages
export type Language = 'en' | 'te';

// 2. Final Languages Array - only English and Telugu will appear in your UI
export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    // Default to 'en' if the saved language is no longer supported
    return (saved === 'te' ? 'te' : 'en');
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language] || translations.en;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 3. Complete Translations Object (English & Telugu only)
const translations: Record<Language, Record<string, any>> = {
  en: {
    nav: { home: 'Home', marketplace: 'Marketplace', rentals: 'Rentals', weather: 'Weather', prices: 'Prices', login: 'Login', getStarted: 'Get Started', experts: 'Experts', dashboard: 'Dashboard', logout: 'Logout', soil: 'Soil Sensor' },
    hero: { title: 'Smart Farming', subtitle: 'Starts Here', description: 'AI-powered crop analysis, real-time weather updates, and expert advice - all in one platform.', cta: 'Start Free Analysis', secondary: 'Watch Demo' },
    home: { 
      badge: 'AI-Powered Agriculture Support', heroTitle: 'The Right Advice.', heroSubtitle: 'At the Right Time.', heroDesc: 'Empowering farmers with AI crop analysis, expert consultation, marketplace access, and real-time insights — all in one platform.', scanCrop: 'Scan Your Crop',
      card: { aiAnalysis: 'AI Analysis', aiAnalysisDesc: 'Instant crop diagnosis', expertChat: 'Expert Chat', expertChatDesc: 'Connect with specialists', solutions: 'Smart Solutions', solutionsDesc: 'Buy recommended products' },
      problemsTitle: 'Problems Farmers Face Daily', problemsDesc: 'Traditional farming lacks access to technology and timely information. We\'re here to change that.',
      problems: { expertAdvice: 'Lack of timely expert advice', diseaseId: 'Difficulty identifying crop diseases', marketPrices: 'No access to fair market prices', equipment: 'Equipment rental challenges', weatherAlerts: 'Missing weather alerts', govSchemes: 'Unaware of government schemes' },
      howItWorksTitle: 'How It Works', howItWorksDesc: 'Simple 4-step process to solve your farming challenges',
      steps: { step1: 'Describe Your Problem', step1Desc: 'Text, voice, or image upload', step2: 'AI Analysis', step2Desc: 'Get instant diagnosis & report', step3: 'Expert Connection', step3Desc: 'Chat with specialists', step4: 'Take Action', step4Desc: 'Buy solutions or rent equipment' },
      featuresTitle: 'Everything You Need', featuresDesc: 'Comprehensive tools for modern farming',
      features: { aiAnalysis: 'AI Crop Analysis', aiAnalysisDesc: 'Upload images or describe issues for instant AI diagnosis', expertConnect: 'Expert Connect', expertConnectDesc: 'Chat with certified agricultural experts anytime', marketplace: 'Marketplace', marketplaceDesc: 'Buy seeds, fertilizers, and sell your produce', rentals: 'Equipment Rentals', rentalsDesc: 'Rent tractors and machinery near you', weather: 'Weather Alerts', weatherDesc: 'Real-time forecasts and crop recommendations', prices: 'Price Insights', pricesDesc: 'Track daily market prices by location' },
      trustTitle: 'Trusted by Farmers Across India', activeFarmers: 'Active Farmers', expertAdvisors: 'Expert Advisors', problemsSolved: 'Problems Solved', joinNow: 'Join Now',
      ctaTitle: 'Stay Updated with Government Schemes', ctaDesc: 'Get instant notifications about Rythu Bharosa, subsidies, and agricultural announcements directly in your dashboard.', viewNotifications: 'View Notifications'
    },
    marketplace: { title: 'Marketplace', subtitle: 'Buy quality products & sell your harvest', cart: 'Cart', search: 'Search products...', add: 'Add', checkout: 'Checkout', emptyCart: 'Your cart is empty', allProducts: 'All Products', perUnit: 'per unit' },
    rentals: { title: 'Equipment Rentals', subtitle: 'Rent machinery from nearby providers', search: 'Search equipment...', bookNow: 'Book Now', available: 'Available', booked: 'Booked', perDay: '/day', owner: 'Owner', rating: 'Rating' },
    addVehicle: { addButton: 'Add Vehicle', adding: 'Adding...', added: 'Vehicle added', missingFields: 'Please fill all fields', failed: 'Failed to add vehicle' },
    bookings: { activeTitle: 'Active Bookings', noActive: 'No active bookings', confirm: 'Confirm', confirmed: 'Confirmed', confirmSuccess: 'Booking confirmed' },
    prices: { dailyMarketPrices: 'Daily Market Prices', commodity: 'Commodity', unit: 'Unit' },
    checkout: { title: 'Checkout', orderSummary: 'Order Summary', subtotal: 'Subtotal', tax: 'Tax (5%)', delivery: 'Delivery Fee', total: 'Total', deliveryAddress: 'Delivery Address', fullName: 'Full Name', phone: 'Phone Number', address: 'Full Address', city: 'City', pincode: 'PIN Code', paymentMethod: 'Payment Method', cod: 'Cash on Delivery', upi: 'UPI Payment', card: 'Card Payment', placeOrder: 'Place Order', orderPlaced: 'Order Placed Successfully!', orderConfirm: 'Your order has been confirmed', continueShopping: 'Continue Shopping' },
    experts: { title: 'Connect with Experts', subtitle: 'Get personalized advice from agricultural specialists', available: 'Available', busy: 'Busy', startChat: 'Start Chat', startCall: 'Call', videoCall: 'Video Call', typeMessage: 'Type your message...', describeIssue: 'Describe Your Issue', issueCategory: 'Issue Category', selectCategory: 'Select category', describeProblem: 'Describe the Problem', problemPlaceholder: 'e.g., Leaves turning yellow on my tomato plants...', startConversation: 'Start Conversation', starting: 'Starting...', conversationStarted: 'Conversation started!', previousChats: 'Previous Chats', continueChat: 'Continue', newChat: 'New Chat', calling: 'Calling...', endCall: 'End Call', inCall: 'In Call', experience: 'experience', rating: 'Rating' },
    issueCategories: { pestInfestation: 'Pest Infestation', diseaseInfection: 'Disease/Infection', nutrientDeficiency: 'Nutrient Deficiency', soilProblems: 'Soil Problems', waterManagement: 'Water Management', weatherDamage: 'Weather Damage', other: 'Other' },
    notifications: { title: 'Notifications', all: 'All', unread: 'Unread', weather: 'Weather', schemes: 'Schemes', orders: 'Orders', markRead: 'Mark read', noNotifications: 'No notifications found' },
    problemInput: { 
      title: 'Describe Your Crop Problem', subtitle: 'Use text, voice, or upload an image for AI analysis',
      text: 'Text', voice: 'Voice', image: 'Image', commonIssues: 'Common Issues',
      placeholder: 'Describe your crop problem in detail... (e.g., My rice plants have brown spots on leaves)',
      recording: 'Recording... Tap to stop', tapToRecord: 'Tap to start recording', transcribed: 'Transcribed',
      uploadImage: 'Upload crop image', photoTip: 'Take a clear photo of the affected plant part',
      selectCommon: 'Select a common problem (for quick help)', analyzing: 'Analyzing with AI...',
      analyze: 'Analyze Problem', imageUploaded: 'Image uploaded', recordingStarted: 'Recording started',
      speakNow: 'Speak about your crop problem...', recordingComplete: 'Recording complete',
      voiceConverted: 'Voice converted to text', provideInput: 'Please provide input',
      analysisError: 'Failed to analyze. Please try again.',
      problems: { yellowLeaves: 'Yellow leaves on my crop', insects: 'Insects eating my plants', wilting: 'Plants are wilting', whitePowder: 'White powder on leaves', notGrowing: 'Crop not growing properly', notGerminating: 'Seeds not germinating' }
    },
    expertResults: {
      analysisComplete: 'AI Analysis Complete', severity: 'severity', diagnosis: 'Diagnosis',
      identifiedSymptoms: 'Identified Symptoms', recommendations: 'Quick Recommendations',
      available: 'Available', expertsReady: 'experts ready to help', online: 'online',
      clickToSelect: 'Click to select', selectExpert: 'Select an Expert to Continue',
      startChatWith: 'Start Chat with'
    },
    common: { loading: 'Loading...', error: 'Error', success: 'Success', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', close: 'Close', back: 'Back', send: 'Send', loginRequired: 'Please log in', farmer: 'Farmer' }
  },
  te: {
    nav: { home: 'హోమ్', marketplace: 'మార్కెట్', rentals: 'అద్దెలు', weather: 'వాతావరణం', prices: 'ధరలు', login: 'లాగిన్', getStarted: 'ప్రారంభించండి', logout: 'లాగ్ అవుట్', soil: 'మట్టిసెన్సార్' },
    hero: { title: 'స్మార్ట్ వ్యవసాయం', subtitle: 'ఇక్కడ మొదలు', description: 'AI-ఆధారిత పంట విశ్లేషణ, రియల్-టైమ్ వాతావరణ అప్‌డేట్‌లు మరియు నిపుణుల సలహా.', cta: 'ఉచిత విశ్లేషణ ప్రారంభించండి', secondary: 'డెమో చూడండి' },
    home: {
      badge: 'AI-శక్తివంతమైన కృషి సపోర్టు',
      heroTitle: 'సరైన సలహా.',
      heroSubtitle: 'సరైన సమయంలో.',
      heroDesc: 'AI పంట విశ్లేషణ, నిపుణ సలహా, మార్కెట్‌ప్లేస్ యాక్సెస్ మరియు రియల్-టైమ్ ఇన్‌సైట్‌లతో కৃషకులను సశక్తీకరించండి — అన్నీ ఒక ప్లాట్‌ఫారమ్‌లో.',
      scanCrop: 'మీ పంటను స్కాన్ చేయండి',
      card: { aiAnalysis: 'AI విశ్లేషణ', aiAnalysisDesc: 'తక్షణ పంట నిర్ధారణ', expertChat: 'నిపుణ చాట్', expertChatDesc: 'నిపుణులతో కనెక్ట్ చేయండి', solutions: 'స్మార్ట్ పరిష్కారాలు', solutionsDesc: 'సిఫారసు చేసిన ఉత్పత్తులను కొనండి' },
      problemsTitle: 'రోజూ కృషకులు ఎదుర్కొనే సమస్యలు',
      problemsDesc: 'ప్రపంచ వ్యవసాయానికి సాంకేతికత మరియు సమయానికి సంబంధించిన సమాచారం లేకపోయింది. మేము దానిని మార్చటానికి ఇక్కడ ఉన్నాము.',
      problems: { expertAdvice: 'సమయానికి సంబంధించిన నిపుణ సలహా లేకపోవడం', diseaseId: 'పంట వ్యాధులను గుర్తించడంలో ఇబ్బందులు', marketPrices: 'న్యాయమైన బాజార్ ధరలకు యాక్సెస్ లేదు', equipment: 'సరఞ్జామ అద్దె సవాళ్లు', weatherAlerts: 'వాతావరణ హెచ్చరికలు తప్పిపోయినవి', govSchemes: 'ప్రభుత్వ పథకాల గురించి తెలియనివారు' },
      howItWorksTitle: 'ఇది ఎలా పనిచేస్తుంది',
      howItWorksDesc: 'మీ వ్యవసాయ సవాళ్లను పరిష్కరించడానికి సాధారణ 4-దశా ప్రక్రియ',
      steps: { step1: 'మీ సమస్యను వివరించండి', step1Desc: 'టెక్స్ట్, వాయిస్ లేదా చిత్రం అప్లోడ్', step2: 'AI విశ్లేషణ', step2Desc: 'తక్షణ నిర్ధారణ & నివేదిక', step3: 'నిపుణ కనెక్షన్', step3Desc: 'నిపుణులతో చాట్ చేయండి', step4: 'చర్య తీసుకోండి', step4Desc: 'పరిష్కారాలను కొనండి లేదా సరఞ్జామాన్ని అద్దె తీసుకోండి' },
      featuresTitle: 'మీకు అవసరమైన ప్రతిదీ',
      featuresDesc: 'ఆధునిక కృషికి సమగ్ర సాధనాలు',
      features: { aiAnalysis: 'AI పంట విశ్లేషణ', aiAnalysisDesc: 'తక్షణ AI నిర్ధారణ కోసం చిత్రాలను అప్లోడ్ చేయండి లేదా సమస్యలను వివరించండి', expertConnect: 'నిపుణ కనెక్ట్', expertConnectDesc: 'ఏ సమయంలోనైనా ధృవీకృత వ్యవసాయ నిపుణులతో చాట్ చేయండి', marketplace: 'మార్కెట్‌ప్లేస్', marketplaceDesc: 'విత్తనాలు, ఎరువులను కొనండి మరియు మీ ఉత్పత్తిని విక్రయించండి', rentals: 'సరఞ్జామ అద్దెలు', rentalsDesc: 'మీ సమీపంలో ట్రాక్టర్లు మరియు యంత్రాలను అద్దె తీసుకోండి', weather: 'వాతావరణ హెచ్చరికలు', weatherDesc: 'పంట సిఫారసులతో రియల్-టైమ్ సూచనలు', prices: 'ధర ఇన్‌సైట్‌లు', pricesDesc: 'స్థానం ద్వారా రోజువారీ బాజార్ ధరలను ట్రాక్ చేయండి' },
      trustTitle: 'భారతीయ కృషకుల ద్వారా విశ్వసించబడింది',
      activeFarmers: 'క్రియాశీల కృషకులు',
      expertAdvisors: 'నిపుణ సలహాదాతలు',
      problemsSolved: 'సమస్యలు పరిష్కరించబడ్డాయి',
      joinNow: 'ఇప్పుడు చేరండి',
      ctaTitle: 'ప్రభుత్వ పథకాలతో నవీకరించబడి ఉండండి',
      ctaDesc: 'రైతు భరోసా, సబ్సిడీలు మరియు వ్యవసాయ ఘోషణల గురించి మీ డ్యాష్‌బోర్డ్‌కు నేరుగా తక్షణ నోటిఫికేషన్‌లు పొందండి.',
      viewNotifications: 'నోటిఫికేషన్‌లను చూడండి'
    },
    problemInput: {
      title: 'మీ పంట సమస్యను వివరించండి',
      subtitle: 'AI విశ్లేషణ కోసం టెక్స్ట్, వాయిస్ లేదా ఇమేజ్ అప్లోడ్ చేయండి',
      text: 'టెక్స్ట్', voice: 'వాయిస్', image: 'ఇమేజ్', commonIssues: 'సాధారణ సమస్యలు',
      placeholder: 'మీ పంట సమస్యను వివరణాత్మకంగా వర్ణించండి... (ఉదా., నా వరి ఆకు మీద గోధుమ పట్టలు...)',
      recording: 'రికార్డింగ్... స్టాప్ చేయడానికి టాప్ చేయండి', tapToRecord: 'రికార్డ్ ప్రారంభించడానికి టాప్ చేయండి', transcribed: 'ట్రాన్స్‌క్రైబ్డ్',
      uploadImage: 'పంట చిత్రం అప్లోడ్ చేయండి', photoTip: 'ప్రభావిత భాగానికి స్పష్టమైన ఫోటో తీసుకోండి',
      selectCommon: 'త్వరిత సహాయం కోసం ఒక సాధారణ సమస్యను ఎంచుకోండి', analyzing: 'AI ద్వారా విశ్లేషణ...',
      analyze: 'సమస్యను విలేషించు', imageUploaded: 'ఇమేజ్ అప్‌లోడ్ అయింది', recordingStarted: 'రికార్డింగ్ ప్రారంభమైంది',
      speakNow: 'మీ పంట సమస్య గురించి మాట్లాడండి...', recordingComplete: 'రికార్డింగ్ పూర్తైంది', voiceConverted: 'వాయిస్ టెక్స్ట్‌గా మార్చబడింది',
      provideInput: 'దయచేసి ఇన్‌పుట్ అందించండి', analysisError: 'విశ్లేషణ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      problems: { yellowLeaves: 'పసుపు ఆకులు', insects: 'కీటలు', wilting: 'ఓలకటం', whitePowder: 'తెల్ల పొడి', notGrowing: 'పెరగడం లేదు', notGerminating: 'ఆంకురణం లేదు' }
    },
    addVehicle: { addButton: 'వాహనం చేర్చండి', adding: 'చేర్చుతోంది...', added: 'వాహనం చేర్చబడింది', missingFields: 'దయచేసి అన్ని ఫీల్డ్‌లను నింపండి', failed: 'వాహనం చేర్చడంలో విఫలం' },
    bookings: { activeTitle: 'సక్రియ బుకింగ్లు', noActive: 'సక్రియ బుకింగ్లు లేదు', confirm: 'దృఢీకరించు', confirmed: 'దృఢీకృతం', confirmSuccess: 'బుకింగ్ దృఢీకరించబడింది' },
    marketplace: { title: 'బాజార్', subtitle: 'గుణమైన ఉత్పత్తులను కొనండి', cart: 'కార్ట్', search: 'ఉత్పత్తులను వెతకండి...', add: 'జోడించు', checkout: 'చెక్అవుట్', emptyCart: 'మీ కార్ట్ ఖాళీ', allProducts: 'అన్ని ఉత్పత్తులు', perUnit: 'యూనిట్ కోసం' },
    rentals: { title: 'పరికరాల అద్దెలు', subtitle: 'సమీపంలోని ప్రదాతల నుండి యంత్రాలను అద్దె తీసుకోండి', search: 'పరికరాలను వెతకండి...', bookNow: 'ఇప్పుడు బుక్ చేయండి', available: 'అందుబాటులో', booked: 'బుక్ చేయబడింది', perDay: '/రోజు', owner: 'యజమాని', rating: 'రేటింగ్' },
    prices: { dailyMarketPrices: 'రోజువారీ బాజార్ ధరలు', commodity: 'వస్తువు', unit: 'యూనిట్' },
    checkout: { title: 'చెక్అవుట్', orderSummary: 'ఆర్డర్ సారాంశం', subtotal: 'ఉప మొత్తం', tax: 'పన్ను (5%)', delivery: 'డెలివరీ ఫీజు', total: 'మొత్తం', deliveryAddress: 'డెలివరీ చిరునామా', fullName: 'పూర్తి పేరు', phone: 'ఫోన్ నంబర్', address: 'పూర్తి చిరునామా', city: 'నగరం', pincode: 'పిన్ కోడ్', paymentMethod: 'చెల్లింపు పద్ధతి', cod: 'క్యాష్ ఆన్ డెలివరీ', upi: 'UPI పేమెంట్', card: 'కార్డ్ పేమెంట్', placeOrder: 'ఆర్డర్ ఇవ్వండి', orderPlaced: 'ఆర్డర్ విజయవంతంగా ఇవ్వబడింది!', orderConfirm: 'మీ ఆర్డర్ నిర్ధారించబడింది', continueShopping: 'షాపింగ్ కొనసాగించండి' },
    experts: { title: 'నిపుణులతో కనెక్ట్ అవ్వండి', subtitle: 'వ్యవసాయ నిపుణుల నుండి వ్యక్తిగత సలహా పొందండి', available: 'అందుబాటులో', busy: 'బిజీ', startChat: 'చాట్ ప్రారంభించండి', typeMessage: 'మీ సందేశం టైప్ చేయండి...' },
    notifications: { title: 'నోటిఫికేషన్లు', all: 'అన్నీ', unread: 'చదవనివి', weather: 'వాతావరణం', schemes: 'పథకాలు', orders: 'ఆర్డర్లు', markRead: 'చదివినట్లు మార్కు', noNotifications: 'నోటిఫికేషన్లు కనుగొనబడలేదు' },
    common: { loading: 'లోడ్ అవుతోంది...', error: 'లోపం', success: 'విజయం', cancel: 'రద్దు చేయి', save: 'సేవ్ చేయి', delete: 'తొలగించు', edit: 'సవరించు', close: 'మూసివేయి' }
  }
};