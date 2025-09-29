// Language constants for dubbing functionality
// Single source of truth for all language-related data

export interface LanguageInfo {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    isPopular?: boolean;
    sampleText?: string;
}

// Popular languages shown first in UI
export const POPULAR_LANGUAGE_CODES = ['es', 'fr', 'de', 'pt', 'hi', 'zh', 'ar', 'ru', 'ko', 'ja'];

export const SUPPORTED_DUBBING_LANGUAGES: LanguageInfo[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', sampleText: 'Hello, how are you?' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sampleText: 'नमस्ते, आप कैसे हैं?', isPopular: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', sampleText: 'Olá, como você está?', isPopular: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', sampleText: '你好，你怎么样？', isPopular: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', sampleText: 'Hola, ¿cómo estás?', isPopular: true },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', sampleText: 'Bonjour, comment allez-vous?', isPopular: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', sampleText: 'Hallo, wie geht es Ihnen?', isPopular: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', sampleText: 'こんにちは、お元気ですか？', isPopular: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', sampleText: 'مرحبا، كيف حالك؟', isPopular: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', sampleText: 'Привет, как дела?', isPopular: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', sampleText: '안녕하세요, 어떻게 지내세요?', isPopular: true },
    { code: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: '🇮🇩', sampleText: 'Halo, apa kabar?' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', sampleText: 'Ciao, come stai?' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', sampleText: 'Hallo, hoe gaat het?' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', sampleText: 'Merhaba, nasılsınız?' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', sampleText: 'Cześć, jak się masz?' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', sampleText: 'Hej, hur mår du?' },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', sampleText: 'Kumusta, kamusta ka?' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', sampleText: 'Hello, apa khabar?' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', sampleText: 'Bună, ce faci?' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', sampleText: 'Привіт, як справи?' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', sampleText: 'Γεια σας, τι κάνετε;' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', sampleText: 'Ahoj, jak se máš?' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', sampleText: 'Hej, hvordan har du det?' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', sampleText: 'Hei, mitä kuuluu?' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', sampleText: 'Здравей, как си?' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', sampleText: 'Bok, kako ste?' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', sampleText: 'Ahoj, ako sa máš?' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', sampleText: 'வணக்கம், எப்படி இருக்கிறீர்கள்?' }
];

// Utility functions for language operations
export function getSortedLanguages(languages: LanguageInfo[] = SUPPORTED_DUBBING_LANGUAGES): LanguageInfo[] {
    return [...languages].sort((a, b) => {
        const aIndex = POPULAR_LANGUAGE_CODES.indexOf(a.code);
        const bIndex = POPULAR_LANGUAGE_CODES.indexOf(b.code);

        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex; // Both popular: sort by popularity order
        }
        if (aIndex !== -1) return -1; // A is popular, B is not
        if (bIndex !== -1) return 1;  // B is popular, A is not
        return a.name.localeCompare(b.name); // Neither popular: alphabetical
    });
}

export function getLanguageByCode(code: string): LanguageInfo | undefined {
    return SUPPORTED_DUBBING_LANGUAGES.find(lang => lang.code === code);
}

export function getPopularLanguages(): LanguageInfo[] {
    return SUPPORTED_DUBBING_LANGUAGES.filter(lang => lang.isPopular);
}