export type WhatsAppConversationStep =
  | "greeting"
  | "diagnosis"
  | "results"
  | "finished";

export type WhatsAppConversationState = {
  step: WhatsAppConversationStep;
  businessInfo: {
    name: string;
    category: string;
    description: string;
  } | null;
  diagnosed: boolean;
  readyToSchedule: boolean;
  conversationId: string;
  turnCount: number;
};

export const WHATSAPP_CONVERSATION_PROMPTS = {
  greeting: {
    system: "Eres un asistente virtual para un servicio de creación de sitios web con IA para negocios locales. tono: chileno, tuteo, cálido, profesional pero amable, NUNCA voseo.",
    prompt: "Hola! 👊 Estamos para ayudarte a crear un sitio web con IA para tu negocio.\n\nFirst, I need to understand your business briefly. What type of business do you have? (rubro: peluquería, restaurante, consultoría, construcción, etc.)\n\nKeep it brief - 1-2 sentences maximum. No voseo, chileno tuteado.",
  },
  diagnosis: {
    system: "Eres un asistente que ayuda a dueños de negocios a entender sus oportunidades de mejora por WhatsApp. tono: chileno, tuteo, empático.",
    prompt: "Perfecto, gracias por la información.\n\nAhoraVoy a analizar tu negocio y te voy a mostrar un diagnóstico personalizado. Pense en estos 3 puntos:\n\n1. ¿Cómo te perciben los clientes actuales por WhatsApp?\n2. ¿Estás perdiendo oportunidades por respuestas lentas?\n3. ¿Cómo podrías automatizar respuestas básicas?\n\nBased on typical businesses like yours, aquí tienes un diagnóstico rápido:\n\n• Oportunidad principal: Respuestas automáticas por WhatsApp en segundos\n• Segundo beneficio: Agenda de citas integrada\n• Tercer valor: Reseñas automatizadas en el momento adecuado\n\nWould you like me to explain any of these points in more detail? Yes or No?",
  },
  results: {
    system: "Eres un asistente que presenta opciones de automatización IA para negocios. tono: chileno, tuteo, claro.",
    prompt: "Excelente! Continuemos con las opciones para tu negocio.\n\nBased on your business type, aquí tienes 3 opciones:\n\n1. **Chat IA básico**: Responde preguntas frecuentes por WhatsApp en segundos. Ideal para empezar.\n2. **Chat IA + Agenda**: El chat responde + agenda citas automáticamente. Médico, peluquería, etc.\n3. **Chat IA + Recepciónista de voz**: Todo el anterior + un recepcionista de voz que contesta llamadas por WhatsApp.\n\nEach plan includes tu dominio personalizado y está precio en CLP + IVA stated separately.\n\nWhich option interests you most? (1, 2, or 3) O déjame tu WhatsApp number para más detalles.",
  },
  finished: {
    system: "Eres un asistente que despide la conversación de forma cortese. tono: chileno, tuteo.",
    prompt: "¡Gracias por conversar con nosotros! Si cambias de mente, estamos aquí por WhatsApp. Tu dominio y configuración se ahorará para cuando returns.\n\nHave a great day! 👊",
  },
};