// Internationalization translations
export const translations = {
      en: {
        welcome: "Welcome! Let's dive in",
    nameLabel: "What's your name?",
    communicationPreferences: "Communication Preferences",
    voiceResponse: "Voice Response",
    autoplayOn: "Auto-Play ON",
    autoplayOff: "Auto-Play OFF",
    startInterviewing: "Start Interviewing",
    goodQuestion: "Good question...",
    thinking: "Let me think about that for a moment...",
    typeQuestion: "Type your question...",
    williamAI: "William AI",
    virtualInterviewer: "Virtual Interviewer",
    english: "English",
    french: "Français",
    rateLimitMessage: "You're sending messages too quickly. Please wait a moment before trying again.",
    rateLimitMessageFr: "Vous envoyez des messages trop rapidement. Veuillez attendre un moment avant de réessayer.",
  },
  fr: {
    welcome: "Bienvenue ! C'est parti !",
    nameLabel: "Quel est votre nom ?",
    communicationPreferences: "Préférences de communication",
    voiceResponse: "Réponse vocale",
    autoplayOn: "Lecture automatique ON",
    autoplayOff: "Lecture automatique OFF",
    startInterviewing: "Commencer l'entretien",
    goodQuestion: "Bonne question...",
    thinking: "Laissez-moi réfléchir à cela un instant...",
    typeQuestion: "Tapez votre question...",
    williamAI: "William IA",
    virtualInterviewer: "Intervieweur virtuel",
    english: "English",
    french: "Français",
    rateLimitMessage: "Vous envoyez des messages trop rapidement. Veuillez attendre un moment avant de réessayer.",
    rateLimitMessageFr: "Vous envoyez des messages trop rapidement. Veuillez attendre un moment avant de réessayer.",
  }
};

export const getTranslation = (key, language = 'en') => {
  return translations[language]?.[key] || translations.en[key] || key;
};

