
import { SyllabusUnit } from '../types';

/**
 * COMPLETE CAMBRIDGE YLE SYLLABUS STRUCTURE
 * 
 * This file acts as the "Skeleton" of the app. 
 * We define the Levels, Units, and required Vocabulary here.
 * The AI will use these specific words to generate content.
 */

export const FULL_SYLLABUS: SyllabusUnit[] = [
  // ==========================================
  // LEVEL 1: STARTERS (Pre-A1)
  // Focus: Nouns, simple verbs, colors, numbers
  // ==========================================
  {
    id: 'starters-1',
    level: 'Starters',
    title: 'Friendly Animals',
    description: 'Pets and Farm Animals',
    icon: '🐶',
    color: 'bg-orange-100 border-orange-200 text-orange-700',
    words: ['cat', 'dog', 'duck', 'bird', 'horse', 'sheep', 'cow', 'mouse']
  },
  {
    id: 'starters-2',
    level: 'Starters',
    title: 'Yummy Fruit',
    description: 'Healthy Snacks',
    icon: '🍎',
    color: 'bg-red-100 border-red-200 text-red-700',
    words: ['apple', 'banana', 'pear', 'orange', 'lemon', 'grape', 'lime', 'mango']
  },
  {
    id: 'starters-3',
    level: 'Starters',
    title: 'My Family',
    description: 'People I Love',
    icon: '👨‍👩‍👧',
    color: 'bg-blue-100 border-blue-200 text-blue-700',
    words: ['mother', 'father', 'sister', 'brother', 'baby', 'grandma', 'grandpa', 'cousin']
  },
  {
    id: 'starters-4',
    level: 'Starters',
    title: 'My Body',
    description: 'Head, Shoulders, Knees',
    icon: '👀',
    color: 'bg-pink-100 border-pink-200 text-pink-700',
    words: ['eye', 'nose', 'mouth', 'ear', 'hand', 'foot', 'leg', 'arm', 'head']
  },
  {
    id: 'starters-5',
    level: 'Starters',
    title: 'At School',
    description: 'Classroom Objects',
    icon: '🎒',
    color: 'bg-yellow-100 border-yellow-200 text-yellow-700',
    words: ['pen', 'pencil', 'book', 'bag', 'rubber', 'desk', 'ruler', 'teacher']
  },
  {
    id: 'starters-6',
    level: 'Starters',
    title: 'Colors',
    description: 'Rainbow World',
    icon: '🎨',
    color: 'bg-purple-100 border-purple-200 text-purple-700',
    words: ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'brown']
  },

  // ==========================================
  // LEVEL 2: MOVERS (A1)
  // Focus: Places, Time, Weather, Daily Life
  // ==========================================
  {
    id: 'movers-1',
    level: 'Movers',
    title: 'In The Town',
    description: 'Places we go',
    icon: '🏙️',
    color: 'bg-indigo-100 border-indigo-200 text-indigo-700',
    words: ['library', 'hospital', 'market', 'cinema', 'park', 'supermarket', 'station', 'cafe']
  },
  {
    id: 'movers-2',
    level: 'Movers',
    title: 'Weather',
    description: 'Hot and Cold',
    icon: '⛅',
    color: 'bg-sky-100 border-sky-200 text-sky-700',
    words: ['sunny', 'cloudy', 'windy', 'raining', 'snowing', 'storm', 'foggy', 'temperature']
  },
  {
    id: 'movers-3',
    level: 'Movers',
    title: 'My Home',
    description: 'Rooms and Furniture',
    icon: '🏠',
    color: 'bg-teal-100 border-teal-200 text-teal-700',
    words: ['balcony', 'basement', 'stairs', 'shower', 'blanket', 'roof', 'lamp', 'towel']
  },
  {
    id: 'movers-4',
    level: 'Movers',
    title: 'Health',
    description: 'Feeling Good',
    icon: '🩺',
    color: 'bg-green-100 border-green-200 text-green-700',
    words: ['headache', 'toothache', 'cold', 'cough', 'doctor', 'nurse', 'medicine', 'stomach']
  },

  // ==========================================
  // LEVEL 3: FLYERS (A2)
  // Focus: Future/Past, Environment, Jobs, Materials
  // ==========================================
  {
    id: 'flyers-1',
    level: 'Flyers',
    title: 'Jobs',
    description: 'When I grow up',
    icon: '👷',
    color: 'bg-slate-100 border-slate-200 text-slate-700',
    words: ['journalist', 'mechanic', 'engineer', 'pilot', 'actor', 'artist', 'photographer', 'waiter']
  },
  {
    id: 'flyers-2',
    level: 'Flyers',
    title: 'World & Space',
    description: 'Our Planet',
    icon: '🌍',
    color: 'bg-blue-100 border-blue-200 text-blue-900',
    words: ['environment', 'planet', 'space', 'rocket', 'desert', 'ocean', 'cave', 'volcano']
  },
  {
    id: 'flyers-3',
    level: 'Flyers',
    title: 'Materials',
    description: 'What is it made of?',
    icon: '🧶',
    color: 'bg-stone-100 border-stone-200 text-stone-700',
    words: ['metal', 'plastic', 'glass', 'gold', 'silver', 'wood', 'wool', 'cardboard']
  }
];
