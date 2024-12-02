import { useMemo } from 'react';

interface Phrase {
  english: string;
  translation: string;
}

export const useGeneratedPhrases = () => {
  const getPhrasesForWord = (word: string): Phrase[] => {
    // This would ideally come from an API or database
    const phrasesMap: Record<string, Phrase[]> = {
      'Coffee Cup': [
        { english: "I'd like a cup of coffee", translation: "Quisiera una taza de café" },
        { english: "The coffee is hot", translation: "El café está caliente" },
        { english: "Can I have another cup?", translation: "¿Puedo tener otra taza?" },
      ],
      'Book': [
        { english: "I'm reading a book", translation: "Estoy leyendo un libro" },
        { english: "This is an interesting book", translation: "Este es un libro interesante" },
        { english: "Where is the bookstore?", translation: "¿Dónde está la librería?" },
      ],
      'Chair': [
        { english: "Please have a seat", translation: "Por favor, tome asiento" },
        { english: "The chair is comfortable", translation: "La silla es cómoda" },
        { english: "Can you move the chair?", translation: "¿Puede mover la silla?" },
      ],
      'Window': [
        { english: "Could you open the window?", translation: "¿Podría abrir la ventana?" },
        { english: "The window is closed", translation: "La ventana está cerrada" },
        { english: "Look through the window", translation: "Mira por la ventana" },
      ],
    };

    return phrasesMap[word] || [];
  };

  return { getPhrasesForWord };
};