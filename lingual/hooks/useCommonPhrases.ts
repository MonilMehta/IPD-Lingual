import { useState, useEffect } from 'react';

export const useCommonPhrases = () => {
  const [phrases, setPhrases] = useState([
    { id: 1, phrase: "Where is...?", translation: "¿Dónde está...?", category: "Navigation" },
    { id: 2, phrase: "How much?", translation: "¿Cuánto cuesta?", category: "Shopping" },
    { id: 3, phrase: "Thank you", translation: "Gracias", category: "Basics" },
    { id: 4, phrase: "Can you help me?", translation: "¿Me puede ayudar?", category: "Help" },
    { id: 5, phrase: "I don't understand", translation: "No entiendo", category: "Help" },
    { id: 6, phrase: "The bill, please", translation: "La cuenta, por favor", category: "Dining" },
    { id: 7, phrase: "Good morning", translation: "Buenos días", category: "Greetings" },
    { id: 8, phrase: "Good night", translation: "Buenas noches", category: "Greetings" },
    { id: 9, phrase: "Excuse me", translation: "Perdón", category: "Basics" },
    { id: 10, phrase: "One moment please", translation: "Un momento por favor", category: "Basics" }
  ]);
  

  return { phrases };
};