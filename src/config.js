export class ModuleConfig {
  constructor(allQuestions) {
    this.allQuestions = allQuestions;
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getDifficultyDistribution(moduleKey, difficulty) {
    const isMath = moduleKey.startsWith('math');
    if (isMath) {
      if (difficulty === 'hard') return { easy: 0, medium: 8, hard: 14 };
      if (difficulty === 'easy') return { easy: 10, medium: 9, hard: 3 };
      return { easy: 7, medium: 11, hard: 4 }; // standard
    } else {
      if (difficulty === 'hard') return { easy: 1, medium: 9, hard: 17 };
      if (difficulty === 'easy') return { easy: 12, medium: 11, hard: 4 };
      return { easy: 8, medium: 13, hard: 6 }; // standard
    }
  }

  getModuleInfo(moduleKey) {
    const info = {
      'rw-1': { section: 'rw', label: 'Section 1, Module 1: Reading and Writing', timeMinutes: 32 },
      'rw-2': { section: 'rw', label: 'Section 1, Module 2: Reading and Writing', timeMinutes: 32 },
      'math-1': { section: 'math', label: 'Section 2, Module 1: Math', timeMinutes: 35 },
      'math-2': { section: 'math', label: 'Section 2, Module 2: Math', timeMinutes: 35 }
    };
    return info[moduleKey];
  }

  assembleModule(moduleKey, options = {}) {
    const { difficulty = 'standard', excludeIds = new Set() } = options;
    const info = this.getModuleInfo(moduleKey);
    const isMath = info.section === 'math';
    
    // 1. Filter by section
    let available = this.allQuestions.filter(q => q.section === info.section);
    
    // 2. Exclude IDs
    available = available.filter(q => !excludeIds.has(q.id));
    
    // 3. Group by difficulty
    const byDifficulty = { easy: [], medium: [], hard: [] };
    available.forEach(q => {
      if (byDifficulty[q.difficulty]) {
        byDifficulty[q.difficulty].push(q);
      } else {
        byDifficulty.medium.push(q); // fallback
      }
    });
    
    // 4. Shuffle each
    byDifficulty.easy = this.shuffleArray(byDifficulty.easy);
    byDifficulty.medium = this.shuffleArray(byDifficulty.medium);
    byDifficulty.hard = this.shuffleArray(byDifficulty.hard);
    
    const dist = this.getDifficultyDistribution(moduleKey, difficulty);
    const selected = [];
    
    if (isMath) {
      // Helper to pick questions while trying to balance domains and (for math) types
      const pickQuestions = (pool, count, currentSprCount, maxSpr) => {
        const picked = [];
        for (const q of pool) {
          if (picked.length >= count) break;
          if (q.type === 'spr' && currentSprCount >= maxSpr) continue;
          picked.push(q);
          if (q.type === 'spr') currentSprCount++;
        }
        picked.forEach(p => {
          const idx = pool.findIndex(q => q.id === p.id);
          if (idx !== -1) pool.splice(idx, 1);
        });
        return picked;
      };
      
      let sprCount = 0;
      const maxSpr = 6;
      
      const pickForLevel = (level, targetCount) => {
        let pool = byDifficulty[level];
        let picked = pickQuestions(pool, targetCount, sprCount, maxSpr);
        sprCount += picked.filter(q => q.type === 'spr').length;
        
        if (picked.length < targetCount && level !== 'medium') {
          const needed = targetCount - picked.length;
          const fallback = pickQuestions(byDifficulty.medium, needed, sprCount, maxSpr);
          sprCount += fallback.filter(q => q.type === 'spr').length;
          picked = picked.concat(fallback);
        }
        return picked;
      };
      
      const easySelected = pickForLevel('easy', dist.easy);
      const hardSelected = pickForLevel('hard', dist.hard);
      const mediumSelected = pickForLevel('medium', dist.medium);
      
      selected.push(...easySelected, ...mediumSelected, ...hardSelected);
    } else {
      // Reading & Writing strict quota logic
      const targetCounts = {
        'Words in Context': 5,
        'Text Structure and Purpose': 5,
        'Cross-Text Connections': 3,
        'Information and Ideas': 4,
        'Standard English Conventions': 5,
        'Transitions': 3,
        'Rhetorical Synthesis': 2
      };
      
      const getCategory = (q) => {
        if (q.skill === 'Words in Context') return 'Words in Context';
        if (q.skill === 'Text Structure and Purpose') return 'Text Structure and Purpose';
        if (q.skill === 'Cross-Text Connections' || q.skill === 'Cross-text Connections') return 'Cross-Text Connections';
        if (q.domain === 'Information and Ideas') return 'Information and Ideas';
        if (q.domain === 'Standard English Conventions') return 'Standard English Conventions';
        if (q.skill === 'Transitions') return 'Transitions';
        if (q.skill === 'Rhetorical Synthesis') return 'Rhetorical Synthesis';
        return 'Unknown';
      };
      
      const counts = { ...targetCounts };
      const pool = {
        easy: [...byDifficulty.easy],
        medium: [...byDifficulty.medium],
        hard: [...byDifficulty.hard]
      };
      
      const pickFromPool = (level, targetLevelCount) => {
        let pickedCount = 0;
        for (let i = 0; i < pool[level].length && pickedCount < targetLevelCount; i++) {
          const q = pool[level][i];
          const cat = getCategory(q);
          if (counts[cat] > 0) {
            selected.push(q);
            counts[cat]--;
            pickedCount++;
            pool[level].splice(i, 1);
            i--;
          }
        }
      };
      
      pickFromPool('easy', dist.easy);
      pickFromPool('medium', dist.medium);
      pickFromPool('hard', dist.hard);
      
      for (const cat in counts) {
        while (counts[cat] > 0) {
          let found = null;
          for (const level of ['medium', 'easy', 'hard']) {
            const idx = pool[level].findIndex(q => getCategory(q) === cat);
            if (idx !== -1) {
              found = pool[level].splice(idx, 1)[0];
              break;
            }
          }
          if (found) {
            selected.push(found);
            counts[cat]--;
          } else {
            break; 
          }
        }
      }
    }
    
    // 8. Shuffle final array for random order (Math is random, R&W is ordered)
    let finalQuestions = this.shuffleArray(selected);
    
    if (!isMath) {
      const getCategory = (q) => {
        if (q.skill === 'Words in Context') return 'Words in Context';
        if (q.skill === 'Text Structure and Purpose') return 'Text Structure and Purpose';
        if (q.skill === 'Cross-Text Connections' || q.skill === 'Cross-text Connections') return 'Cross-Text Connections';
        if (q.domain === 'Information and Ideas') return 'Information and Ideas';
        if (q.domain === 'Standard English Conventions') return 'Standard English Conventions';
        if (q.skill === 'Transitions') return 'Transitions';
        if (q.skill === 'Rhetorical Synthesis') return 'Rhetorical Synthesis';
        return 'Unknown';
      };
      const orderMap = {
        'Words in Context': 1,
        'Text Structure and Purpose': 2,
        'Cross-Text Connections': 3,
        'Information and Ideas': 4,
        'Standard English Conventions': 5,
        'Transitions': 6,
        'Rhetorical Synthesis': 7
      };
      finalQuestions.sort((a, b) => {
        const oA = orderMap[getCategory(a)] || 99;
        const oB = orderMap[getCategory(b)] || 99;
        if (oA !== oB) return oA - oB;
        
        const skillA = a.skill || '';
        const skillB = b.skill || '';
        if (skillA !== skillB) return skillA.localeCompare(skillB);
        
        const qA = a.question || '';
        const qB = b.question || '';
        return qA.localeCompare(qB);
      });
    }
    
    // 9. Return config
    return {
      questions: finalQuestions,
      timeMinutes: info.timeMinutes,
      label: info.label,
      moduleKey: moduleKey,
      isMath: isMath
    };
  }
}
