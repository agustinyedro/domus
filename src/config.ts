// DOMUS Configuration
// Centralize all environment-specific values here

export const config = {
  // WhatsApp Configuration
  whatsapp: {
    // Replace with your real WhatsApp number (format: country code + number, no spaces or dashes)
    phoneNumber: '5491112345678',
    // Default greeting message
    defaultMessage: 'Hola! Me interesa Domus',
  },

  // Social Media Links
  social: {
    instagram: 'https://instagram.com/domus', // Replace with real profile
    tiktok: 'https://tiktok.com/@domus', // Replace with real profile
    whatsapp: 'https://wa.me/5491112345678', // Generated from phone number
  },

  // Site Info
  site: {
    name: 'DOMUS',
    tagline: 'Sentí tu hogar en cada detalle',
    description: 'Aromas, momentos y sensaciones diseñadas para que cada espacio se sienta verdaderamente tuyo.',
  },
} as const;

// Helper to generate WhatsApp link
export function getWhatsAppLink(message?: string): string {
  const msg = message || config.whatsapp.defaultMessage;
  const encodedMessage = encodeURIComponent(msg);
  return `https://wa.me/${config.whatsapp.phoneNumber}?text=${encodedMessage}`;
}
