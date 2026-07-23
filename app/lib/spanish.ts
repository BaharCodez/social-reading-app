/* Tiny conversational Spanish, one scene a day. Absolute-beginner level:
   read the exchange, peek at the English, say your line out loud once.
   The point is showing up daily, not finishing a textbook. */

export interface SpanishLine {
  es: string;
  en: string;
}

export interface SpanishScene {
  scene: string;
  lines: SpanishLine[];
  yourTurn: SpanishLine; // the line to actually say out loud
}

export const SPANISH_SCENES: SpanishScene[] = [
  {
    scene: "saying hi",
    lines: [
      { es: "¡Hola! ¿Cómo estás?", en: "Hi! How are you?" },
      { es: "Bien, gracias. ¿Y tú?", en: "Good, thanks. And you?" },
      { es: "Muy bien.", en: "Very good." },
    ],
    yourTurn: { es: "Bien, gracias. ¿Y tú?", en: "Good, thanks. And you?" },
  },
  {
    scene: "your name",
    lines: [
      { es: "¿Cómo te llamas?", en: "What's your name?" },
      { es: "Me llamo Bahar. ¿Y tú?", en: "My name is Bahar. And you?" },
      {
        es: "Me llamo Ana. Mucho gusto.",
        en: "My name is Ana. Nice to meet you.",
      },
    ],
    yourTurn: { es: "Me llamo… ¿Y tú?", en: "My name is… And you?" },
  },
  {
    scene: "ordering coffee",
    lines: [
      { es: "Hola, ¿qué te pongo?", en: "Hi, what can I get you?" },
      {
        es: "Un café con leche, por favor.",
        en: "A coffee with milk, please.",
      },
      { es: "¿Algo más?", en: "Anything else?" },
      { es: "No, nada más. Gracias.", en: "No, nothing else. Thanks." },
    ],
    yourTurn: {
      es: "Un café con leche, por favor.",
      en: "A coffee with milk, please.",
    },
  },
  {
    scene: "where are you from?",
    lines: [
      { es: "¿De dónde eres?", en: "Where are you from?" },
      { es: "Soy de Turquía. ¿Y tú?", en: "I'm from Turkey. And you?" },
      { es: "Soy de México.", en: "I'm from Mexico." },
    ],
    yourTurn: { es: "Soy de… ¿Y tú?", en: "I'm from… And you?" },
  },
  {
    scene: "asking for the bathroom",
    lines: [
      {
        es: "Perdona, ¿dónde está el baño?",
        en: "Excuse me, where's the bathroom?",
      },
      { es: "Al fondo, a la derecha.", en: "At the back, on the right." },
      { es: "Gracias.", en: "Thanks." },
    ],
    yourTurn: {
      es: "Perdona, ¿dónde está el baño?",
      en: "Excuse me, where's the bathroom?",
    },
  },
  {
    scene: "the bill",
    lines: [
      { es: "La cuenta, por favor.", en: "The bill, please." },
      { es: "Claro, ahora mismo.", en: "Of course, right away." },
      { es: "¿Puedo pagar con tarjeta?", en: "Can I pay by card?" },
      { es: "Sí, sin problema.", en: "Yes, no problem." },
    ],
    yourTurn: { es: "¿Puedo pagar con tarjeta?", en: "Can I pay by card?" },
  },
  {
    scene: "small talk: the weather",
    lines: [
      { es: "¡Qué buen día hace hoy!", en: "What a nice day it is today!" },
      { es: "Sí, hace mucho sol.", en: "Yes, it's very sunny." },
      { es: "Ayer llovió todo el día.", en: "Yesterday it rained all day." },
    ],
    yourTurn: { es: "Sí, hace mucho sol.", en: "Yes, it's very sunny." },
  },
  {
    scene: "I don't understand",
    lines: [
      {
        es: "¿Puedes hablar más despacio, por favor?",
        en: "Can you speak more slowly, please?",
      },
      { es: "Claro, perdona.", en: "Sure, sorry." },
      { es: "No entiendo esa palabra.", en: "I don't understand that word." },
      { es: "No pasa nada.", en: "No worries." },
    ],
    yourTurn: {
      es: "¿Puedes hablar más despacio, por favor?",
      en: "Can you speak more slowly, please?",
    },
  },
  {
    scene: "buying bread",
    lines: [
      {
        es: "Buenos días, ¿qué quería?",
        en: "Good morning, what would you like?",
      },
      { es: "Una barra de pan, por favor.", en: "A loaf of bread, please." },
      { es: "Son dos euros.", en: "That's two euros." },
      { es: "Aquí tiene. Gracias.", en: "Here you go. Thanks." },
    ],
    yourTurn: {
      es: "Una barra de pan, por favor.",
      en: "A loaf of bread, please.",
    },
  },
  {
    scene: "what do you do?",
    lines: [
      { es: "¿En qué trabajas?", en: "What do you do for work?" },
      { es: "Trabajo con ordenadores.", en: "I work with computers." },
      { es: "¡Qué interesante!", en: "How interesting!" },
    ],
    yourTurn: { es: "Trabajo con ordenadores.", en: "I work with computers." },
  },
  {
    scene: "asking the time",
    lines: [
      { es: "Perdona, ¿qué hora es?", en: "Excuse me, what time is it?" },
      { es: "Son las tres y media.", en: "It's half past three." },
      { es: "Gracias, ¡voy tarde!", en: "Thanks, I'm running late!" },
    ],
    yourTurn: {
      es: "Perdona, ¿qué hora es?",
      en: "Excuse me, what time is it?",
    },
  },
  {
    scene: "in a taxi",
    lines: [
      { es: "¿A dónde vamos?", en: "Where are we going?" },
      { es: "Al centro, por favor.", en: "To the center, please." },
      { es: "¿Aquí está bien?", en: "Is here okay?" },
      { es: "Sí, perfecto. Gracias.", en: "Yes, perfect. Thanks." },
    ],
    yourTurn: { es: "Al centro, por favor.", en: "To the center, please." },
  },
  {
    scene: "do you speak English?",
    lines: [
      { es: "¿Hablas inglés?", en: "Do you speak English?" },
      {
        es: "Un poco. ¿Hablas español?",
        en: "A little. Do you speak Spanish?",
      },
      { es: "Estoy aprendiendo.", en: "I'm learning." },
      { es: "¡Muy bien!", en: "Very good!" },
    ],
    yourTurn: { es: "Estoy aprendiendo.", en: "I'm learning." },
  },
  {
    scene: "meeting a friend",
    lines: [
      {
        es: "¡Cuánto tiempo! ¿Qué tal todo?",
        en: "It's been so long! How's everything?",
      },
      { es: "Todo bien. ¿Y tu familia?", en: "All good. And your family?" },
      { es: "Muy bien, gracias.", en: "Very well, thanks." },
    ],
    yourTurn: {
      es: "Todo bien. ¿Y tu familia?",
      en: "All good. And your family?",
    },
  },
  {
    scene: "I like it",
    lines: [
      { es: "¿Te gusta la música?", en: "Do you like music?" },
      { es: "Sí, me gusta mucho.", en: "Yes, I like it a lot." },
      { es: "¿Qué tipo de música?", en: "What kind of music?" },
      { es: "Me gusta el rock.", en: "I like rock." },
    ],
    yourTurn: { es: "Sí, me gusta mucho.", en: "Yes, I like it a lot." },
  },
  {
    scene: "in a shop",
    lines: [
      { es: "¿Cuánto cuesta esto?", en: "How much does this cost?" },
      { es: "Diez euros.", en: "Ten euros." },
      { es: "Vale, me lo llevo.", en: "Okay, I'll take it." },
    ],
    yourTurn: { es: "¿Cuánto cuesta esto?", en: "How much does this cost?" },
  },
  {
    scene: "making plans",
    lines: [
      { es: "¿Quedamos mañana?", en: "Shall we meet up tomorrow?" },
      { es: "Sí, ¿a qué hora?", en: "Yes, what time?" },
      {
        es: "A las siete, ¿te va bien?",
        en: "At seven, does that work for you?",
      },
      { es: "Perfecto, hasta mañana.", en: "Perfect, see you tomorrow." },
    ],
    yourTurn: { es: "Sí, ¿a qué hora?", en: "Yes, what time?" },
  },
  {
    scene: "I'm hungry",
    lines: [
      { es: "Tengo hambre. ¿Y tú?", en: "I'm hungry. And you?" },
      {
        es: "Yo también. ¿Comemos algo?",
        en: "Me too. Shall we eat something?",
      },
      { es: "Sí, conozco un sitio bueno.", en: "Yes, I know a good place." },
    ],
    yourTurn: {
      es: "Yo también. ¿Comemos algo?",
      en: "Me too. Shall we eat something?",
    },
  },
  {
    scene: "on the phone",
    lines: [
      { es: "¿Dígame?", en: "Hello? (answering the phone)" },
      {
        es: "Hola, soy Bahar. ¿Está Marta?",
        en: "Hi, it's Bahar. Is Marta there?",
      },
      { es: "Sí, un momento, por favor.", en: "Yes, one moment, please." },
    ],
    yourTurn: {
      es: "Hola, soy… ¿Está Marta?",
      en: "Hi, it's… Is Marta there?",
    },
  },
  {
    scene: "getting directions",
    lines: [
      { es: "¿Cómo llego a la estación?", en: "How do I get to the station?" },
      {
        es: "Sigue todo recto y gira a la izquierda.",
        en: "Go straight ahead and turn left.",
      },
      { es: "¿Está lejos?", en: "Is it far?" },
      { es: "No, a cinco minutos.", en: "No, five minutes away." },
    ],
    yourTurn: {
      es: "¿Cómo llego a la estación?",
      en: "How do I get to the station?",
    },
  },
  {
    scene: "how was your day?",
    lines: [
      { es: "¿Qué tal el día?", en: "How was your day?" },
      {
        es: "Bastante bien, pero estoy cansada.",
        en: "Pretty good, but I'm tired.",
      },
      { es: "Descansa un poco.", en: "Rest a little." },
    ],
    yourTurn: {
      es: "Bastante bien, pero estoy cansada.",
      en: "Pretty good, but I'm tired.",
    },
  },
  {
    scene: "the menu",
    lines: [
      { es: "¿Qué me recomiendas?", en: "What do you recommend?" },
      { es: "La tortilla está muy buena.", en: "The tortilla is very good." },
      { es: "Vale, una tortilla entonces.", en: "Okay, a tortilla then." },
    ],
    yourTurn: { es: "¿Qué me recomiendas?", en: "What do you recommend?" },
  },
  {
    scene: "sorry I'm late",
    lines: [
      { es: "Perdón por llegar tarde.", en: "Sorry for arriving late." },
      {
        es: "No pasa nada. Acabo de llegar.",
        en: "No worries. I just got here.",
      },
      { es: "El tráfico estaba fatal.", en: "The traffic was terrible." },
    ],
    yourTurn: {
      es: "Perdón por llegar tarde.",
      en: "Sorry for arriving late.",
    },
  },
  {
    scene: "the weekend",
    lines: [
      {
        es: "¿Qué haces este fin de semana?",
        en: "What are you doing this weekend?",
      },
      { es: "Nada especial. ¿Y tú?", en: "Nothing special. And you?" },
      { es: "Voy a la playa.", en: "I'm going to the beach." },
      { es: "¡Qué envidia!", en: "I'm so jealous!" },
    ],
    yourTurn: { es: "Nada especial. ¿Y tú?", en: "Nothing special. And you?" },
  },
  {
    scene: "I need help",
    lines: [
      { es: "¿Me puedes ayudar?", en: "Can you help me?" },
      { es: "Claro, ¿qué necesitas?", en: "Of course, what do you need?" },
      { es: "Busco esta dirección.", en: "I'm looking for this address." },
    ],
    yourTurn: { es: "¿Me puedes ayudar?", en: "Can you help me?" },
  },
  {
    scene: "saying goodbye",
    lines: [
      { es: "Me tengo que ir.", en: "I have to go." },
      { es: "Vale, ¡nos vemos pronto!", en: "Okay, see you soon!" },
      { es: "¡Hasta luego! Cuídate.", en: "See you later! Take care." },
    ],
    yourTurn: { es: "Me tengo que ir.", en: "I have to go." },
  },
  {
    scene: "a compliment",
    lines: [
      { es: "Me encanta tu casa.", en: "I love your house." },
      {
        es: "¡Gracias! Es pequeña pero acogedora.",
        en: "Thanks! It's small but cozy.",
      },
      { es: "Tiene mucho encanto.", en: "It has a lot of charm." },
    ],
    yourTurn: { es: "Me encanta tu casa.", en: "I love your house." },
  },
  {
    scene: "what are you reading?",
    lines: [
      { es: "¿Qué estás leyendo?", en: "What are you reading?" },
      { es: "Una novela muy buena.", en: "A very good novel." },
      { es: "¿De qué trata?", en: "What's it about?" },
      {
        es: "De una casa con muchos libros.",
        en: "About a house with many books.",
      },
    ],
    yourTurn: { es: "¿Qué estás leyendo?", en: "What are you reading?" },
  },
];

/* Listening practice: sentences you HAVEN'T just read above, so the ear
   does the work. The browser reads them aloud; reveal to check yourself. */
export const LISTENING_LINES: SpanishLine[] = [
  {
    es: "Mañana voy al mercado con mi hermana.",
    en: "Tomorrow I'm going to the market with my sister.",
  },
  {
    es: "¿Quieres un poco más de café?",
    en: "Do you want a little more coffee?",
  },
  {
    es: "El tren sale a las nueve de la mañana.",
    en: "The train leaves at nine in the morning.",
  },
  {
    es: "Hoy no tengo ganas de cocinar.",
    en: "Today I don't feel like cooking.",
  },
  { es: "Mi casa está cerca del parque.", en: "My house is near the park." },
  { es: "¿Puedes repetir eso, por favor?", en: "Can you repeat that, please?" },
  {
    es: "Este libro es muy interesante.",
    en: "This book is very interesting.",
  },
  {
    es: "Vamos a la playa este sábado.",
    en: "We're going to the beach this Saturday.",
  },
  {
    es: "No sé dónde están mis llaves.",
    en: "I don't know where my keys are.",
  },
  {
    es: "Me gusta caminar por la ciudad.",
    en: "I like walking around the city.",
  },
  { es: "¿A qué hora cierra la tienda?", en: "What time does the shop close?" },
  { es: "Hace mucho frío esta noche.", en: "It's very cold tonight." },
  { es: "Mi comida favorita es la pasta.", en: "My favorite food is pasta." },
  { es: "¿Dónde puedo comprar agua?", en: "Where can I buy water?" },
  { es: "Ella habla tres idiomas.", en: "She speaks three languages." },
  { es: "Estoy un poco cansado hoy.", en: "I'm a little tired today." },
  { es: "El museo abre a las diez.", en: "The museum opens at ten." },
  { es: "¿Cuántos años tienes?", en: "How old are you?" },
  { es: "Necesito descansar un momento.", en: "I need to rest for a moment." },
  {
    es: "La película empieza en media hora.",
    en: "The movie starts in half an hour.",
  },
  { es: "¿Te gusta vivir aquí?", en: "Do you like living here?" },
  {
    es: "Voy a estudiar español todos los días.",
    en: "I'm going to study Spanish every day.",
  },
  { es: "Mi teléfono no tiene batería.", en: "My phone has no battery." },
  { es: "¿Hay una farmacia por aquí?", en: "Is there a pharmacy around here?" },
  {
    es: "El desayuno es mi comida favorita del día.",
    en: "Breakfast is my favorite meal of the day.",
  },
  {
    es: "Perdona, creo que este es mi asiento.",
    en: "Excuse me, I think this is my seat.",
  },
];

function dayHash(day: string, salt: string) {
  let h = 0;
  for (const c of day + salt) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/* Same day → same scene; the list loops so there's always one waiting. */
export function sceneOfTheDay(day: string): SpanishScene {
  return SPANISH_SCENES[dayHash(day, "") % SPANISH_SCENES.length];
}

/* Salted so the listening line never tracks the scene's rotation. */
export function listeningOfTheDay(day: string): SpanishLine {
  return LISTENING_LINES[dayHash(day, "escucha") % LISTENING_LINES.length];
}
