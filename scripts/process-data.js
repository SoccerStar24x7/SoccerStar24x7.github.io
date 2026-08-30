import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const rawDataPath = path.join(__dirname, '../src/data/cb_raw.json');
const outQuestionsPath = path.join(__dirname, '../src/data/questions.json');
const outCategoriesPath = path.join(__dirname, '../src/data/categories.json');

// Read the raw JSON data
const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const questions = [];
const taxonomy = {
  rw: { label: 'Reading & Writing', domains: {} },
  math: { label: 'Math', domains: {} }
};

let mcqCount = 0;
let sprCount = 0;
let englishCount = 0;
let mathCount = 0;

Object.values(rawData).forEach(item => {
  const q = {};
  
  // Map basic identifiers
  q.id = item.questionId || (item.id || '');
  
  // Section mapping
  if (item.module === 'english') {
    q.section = 'rw';
    englishCount++;
  } else if (item.module === 'math') {
    q.section = 'math';
    mathCount++;
  } else {
    // Fallback based on item.module or default
    q.section = item.module === 'math' ? 'math' : 'rw'; 
  }
  
  // Extract domain and skill
  q.domain = item.primary_class_cd_desc || 'Unknown Domain';
  q.skill = item.skill_desc || 'Unknown Skill';
  
  // Difficulty mapping: map E/M/H to easy/medium/hard
  const diffMap = { 'E': 'easy', 'M': 'medium', 'H': 'hard' };
  q.difficulty = diffMap[item.difficulty] || 'medium'; // default to medium
  
  // Build dynamic taxonomy mapping based on processed questions
  const secTax = taxonomy[q.section].domains;
  if (!secTax[q.domain]) {
    secTax[q.domain] = new Set();
  }
  secTax[q.domain].add(q.skill);
  
  const content = item.content || {};
  
  // Extract text fields
  q.stimulus = content.stimulus || '';
  q.question = content.stem || content.prompt || '';
  q.explanation = content.rationale || (content.answer && content.answer.rationale) || '';
  
  q.choices = [];
  
  // Determine if it is multiple-choice or free response (SPR)
  const hasAnswerOptions = content.answerOptions && content.answerOptions.length > 0;
  const hasAnswerChoices = content.answer && content.answer.choices;
  
  const choiceLetters = ['A', 'B', 'C', 'D'];
  
  if (hasAnswerOptions) {
    // Prefer answerOptions format if both exist
    // Determine if it is MCQ: if there are correct_answer array with 1 item mapping to choices or if there's no keys
    const isMCQ = (content.correct_answer && content.correct_answer.length === 1 && content.answerOptions.some(opt => opt.id === content.correct_answer[0])) || !content.keys;
    
    if (isMCQ) {
      q.type = 'mcq';
      mcqCount++;
      content.answerOptions.forEach((opt, idx) => {
        const letter = choiceLetters[idx] || String.fromCharCode(65 + idx);
        q.choices.push({ id: letter, content: opt.content });
        // Map correct_answer array containing option id to our letter format
        if (content.correct_answer && content.correct_answer.includes(opt.id)) {
          q.correctAnswer = letter;
        }
      });
      // Fallback for correct answer if missing from correct_answer array
      if (!q.correctAnswer && content.answer && content.answer.correct_choice) {
          const cidx = Object.keys(content.answer.choices).indexOf(content.answer.correct_choice);
          if (cidx >= 0) q.correctAnswer = choiceLetters[cidx];
      }
    } else {
      // SPR with options/keys
      q.type = 'spr';
      sprCount++;
      q.correctAnswer = content.keys || [];
    }
  } else if (hasAnswerChoices) {
    // Older math format for MCQ
    q.type = 'mcq';
    mcqCount++;
    const choicesObj = content.answer.choices;
    Object.keys(choicesObj).forEach((key, idx) => {
      const letter = choiceLetters[idx] || key.toUpperCase();
      q.choices.push({ id: letter, content: choicesObj[key].body });
      if (content.answer.correct_choice === key) {
        q.correctAnswer = letter;
      }
    });
  } else if (content.keys) {
    // Math FR format
    q.type = 'spr';
    sprCount++;
    q.correctAnswer = content.keys;
  } else {
    // Fallback if structure is unexpected
    q.type = 'spr';
    q.correctAnswer = [];
  }
  
  questions.push(q);
});

// Format taxonomy to arrays as per desired categories.json output format
const categories = {
  rw: {
    label: 'Reading & Writing',
    domains: Object.keys(taxonomy.rw.domains).map(domainName => ({
      name: domainName,
      skills: Array.from(taxonomy.rw.domains[domainName])
    }))
  },
  math: {
    label: 'Math',
    domains: Object.keys(taxonomy.math.domains).map(domainName => ({
      name: domainName,
      skills: Array.from(taxonomy.math.domains[domainName])
    }))
  }
};

// Ensure directory exists if needed (src/data should already exist based on cb_raw.json location)

// Write outputs
fs.writeFileSync(outQuestionsPath, JSON.stringify(questions, null, 2));
fs.writeFileSync(outCategoriesPath, JSON.stringify(categories, null, 2));

console.log(`Processed ${questions.length} questions.`);
console.log(`English (RW): ${englishCount}, Math: ${mathCount}`);
console.log(`MCQ: ${mcqCount}, SPR: ${sprCount}`);
console.log(`Output saved to: \n  - ${outQuestionsPath}\n  - ${outCategoriesPath}`);
