import './styles/index.css';
import { ModuleConfig } from './config.js';
import TestEngine from './quiz.js';
import { initReference } from './reference.js';
import questionsData from './data/questions.json';

class App {
  constructor() {
    this.currentView = 'landing';
    this.selectedModules = [];
    this.moduleQueue = [];
    this.currentModuleIndex = -1;
    this.allResults = [];
    this.isFullTest = false;
    this.usedQuestionIds = new Set();
    this.testEngine = null;

    this.moduleConfig = new ModuleConfig(questionsData);
    
    this.initDOM();
    this.bindEvents();
    initReference();
  }

  initDOM() {
    this.views = {
      landing: document.getElementById('landing-view'),
      test: document.getElementById('test-view'),
      'module-review': document.getElementById('module-review-view'),
      break: document.getElementById('break-view'),
      results: document.getElementById('results-view')
    };
    
    // Landing DOM
    this.fullTestCb = document.querySelector('input[value="full"]');
    this.moduleCbs = Array.from(document.querySelectorAll('input[name="module"]:not([value="full"])'));
    this.startBtn = document.getElementById('start-test-btn');
    
    // Break DOM
    this.breakTimerDisplay = document.getElementById('break-timer-display');
    this.resumeTestBtn = document.getElementById('resume-test-btn');
    
    // Results DOM
    this.newTestBtn = document.getElementById('new-test-btn');
    
    // Review DOM
    this.reviewBackBtn = document.getElementById('review-back-btn');
    this.reviewSubmitBtn = document.getElementById('review-submit-btn');
    this.reviewGrid = document.getElementById('review-question-grid');
    
    // Modals
    this.exitModal = document.getElementById('exit-modal');
    this.submitModal = document.getElementById('submit-modal');
    this.detailModal = document.getElementById('question-detail-modal');
  }

  bindEvents() {
    // Landing events
    this.fullTestCb.addEventListener('change', (e) => {
      this.isFullTest = e.target.checked;
      this.moduleCbs.forEach(cb => {
        cb.disabled = this.isFullTest;
        if (this.isFullTest) cb.checked = true;
      });
      this.updateStartBtn();
    });
    
    this.moduleCbs.forEach(cb => {
      cb.addEventListener('change', () => this.updateStartBtn());
    });
    
    this.startBtn.addEventListener('click', () => this.startTest());
    
    // Break events
    this.resumeTestBtn.addEventListener('click', () => {
      this.stopBreakTimer();
      this.startNextModule();
    });
    
    // Results events
    this.newTestBtn.addEventListener('click', () => this.resetApp());
    
    // Exit Test
    document.getElementById('exit-test-btn').addEventListener('click', () => {
      this.exitModal.style.display = 'flex';
    });
    document.getElementById('cancel-exit').addEventListener('click', () => {
      this.exitModal.style.display = 'none';
    });
    document.getElementById('confirm-exit').addEventListener('click', () => {
      this.exitModal.style.display = 'none';
      if (this.testEngine) {
        this.testEngine.destroy();
        this.testEngine = null;
      }
      this.resetApp();
    });
    
    // Review events
    this.reviewBackBtn.addEventListener('click', () => {
      this.showView('test');
      if (this.testEngine) this.testEngine.resume();
    });
    
    this.reviewSubmitBtn.addEventListener('click', () => {
      this.submitModal.style.display = 'flex';
    });
    
    document.getElementById('cancel-submit').addEventListener('click', () => {
      this.submitModal.style.display = 'none';
    });
    
    document.getElementById('confirm-submit').addEventListener('click', () => {
      this.submitModal.style.display = 'none';
      if (this.testEngine) {
        this.testEngine.submitModule();
      }
    });

    // Detail Modal
    document.getElementById('close-detail-modal').addEventListener('click', () => {
      this.detailModal.style.display = 'none';
    });
  }

  updateStartBtn() {
    const anyChecked = this.fullTestCb.checked || this.moduleCbs.some(cb => cb.checked);
    this.startBtn.disabled = !anyChecked;
  }

  showView(viewName) {
    Object.values(this.views).forEach(v => v.classList.remove('active'));
    if (this.views[viewName]) {
      this.views[viewName].classList.add('active');
    }
    this.currentView = viewName;
  }

  startTest() {
    this.allResults = [];
    this.usedQuestionIds.clear();
    this.moduleQueue = [];
    this.currentModuleIndex = -1;
    
    if (this.isFullTest) {
      this.moduleQueue = ['rw-1', 'rw-2', 'BREAK', 'math-1', 'math-2'];
    } else {
      const selected = this.moduleCbs.filter(cb => cb.checked).map(cb => cb.value);
      const rwSelected = selected.filter(v => v.startsWith('rw'));
      const mathSelected = selected.filter(v => v.startsWith('math'));
      
      this.moduleQueue.push(...rwSelected);
      if (rwSelected.length > 0 && mathSelected.length > 0) {
        this.moduleQueue.push('BREAK');
      }
      this.moduleQueue.push(...mathSelected);
    }
    
    this.startNextModule();
  }

  startNextModule() {
    this.currentModuleIndex++;
    if (this.currentModuleIndex >= this.moduleQueue.length) {
      this.showResults();
      return;
    }
    
    const nextItem = this.moduleQueue[this.currentModuleIndex];
    if (nextItem === 'BREAK') {
      this.showBreak();
      return;
    }
    
    this.launchModule(nextItem);
  }

  launchModule(moduleKey) {
    let difficulty = 'standard';
    if (moduleKey.endsWith('-2')) {
      difficulty = 'hard';
    }
    
    // Adaptive logic for Module 2
    if (moduleKey === 'rw-2' && this.moduleQueue.includes('rw-1')) {
      const m1Results = this.allResults.find(r => r.moduleKey === 'rw-1');
      if (m1Results) {
        const pct = m1Results.correct / m1Results.total;
        difficulty = pct >= 0.6 ? 'hard' : 'easy';
      }
    } else if (moduleKey === 'math-2' && this.moduleQueue.includes('math-1')) {
      const m1Results = this.allResults.find(r => r.moduleKey === 'math-1');
      if (m1Results) {
        const pct = m1Results.correct / m1Results.total;
        difficulty = pct >= 0.6 ? 'hard' : 'easy';
      }
    }

    const config = this.moduleConfig.assembleModule(moduleKey, {
      difficulty,
      excludeIds: this.usedQuestionIds
    });
    
    config.questions.forEach(q => this.usedQuestionIds.add(q.id));
    
    // Setup reference sheet visibility
    document.getElementById('reference-btn').style.display = config.isMath ? 'inline-flex' : 'none';
    
    this.showView('test');
    
    if (this.testEngine) {
      this.testEngine.destroy();
    }
    
    this.testEngine = new TestEngine(config, {
      onRequestReview: (data) => this.showReview(data),
      onModuleComplete: (results) => this.handleModuleComplete(results)
    });
    
    this.testEngine.startModule();
  }

  showReview(data) {
    if (this.testEngine) this.testEngine.pause();
    this.showView('module-review');
    
    document.getElementById('review-section-label').textContent = data.label;
    
    // Build grid
    this.reviewGrid.innerHTML = '';
    let answered = 0, flagged = 0;
    
    data.states.forEach((state, i) => {
      const btn = document.createElement('button');
      btn.className = 'grid-q';
      btn.textContent = i + 1;
      
      if (state.answered) {
        btn.classList.add('answered');
        answered++;
      } else {
        btn.classList.add('unanswered');
      }
      
      if (state.flagged) {
        btn.classList.add('flagged');
        flagged++;
      }
      
      btn.addEventListener('click', () => {
        this.showView('test');
        this.testEngine.resume();
        this.testEngine.goToQuestion(i);
      });
      
      this.reviewGrid.appendChild(btn);
    });
    
    const total = data.states.length;
    document.getElementById('review-answered-count').textContent = answered;
    document.getElementById('review-unanswered-count').textContent = total - answered;
    document.getElementById('review-flagged-count').textContent = flagged;
  }

  handleModuleComplete(results) {
    this.allResults.push(results);
    this.startNextModule();
  }

  showBreak() {
    this.showView('break');
    let timeLeft = 10 * 60; // 10 minutes
    
    const updateDisplay = () => {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      this.breakTimerDisplay.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    };
    
    updateDisplay();
    this.breakTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        this.stopBreakTimer();
        this.startNextModule();
      } else {
        updateDisplay();
      }
    }, 1000);
  }
  
  stopBreakTimer() {
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
      this.breakTimer = null;
    }
  }

  showResults() {
    this.showView('results');
    
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalIncorrect = 0;
    let totalOmitted = 0;
    
    const tableBody = document.getElementById('results-table-body');
    tableBody.innerHTML = '';
    
    this.allResults.forEach(moduleResult => {
      totalCorrect += moduleResult.correct;
      totalQuestions += moduleResult.total;
      totalIncorrect += moduleResult.incorrect;
      totalOmitted += moduleResult.omitted;
      
      moduleResult.questionResults.forEach((qr, i) => {
        const tr = document.createElement('tr');
        const qNum = i + 1;
        
        let resultClass = 'result-incorrect';
        let resultText = 'Incorrect';
        if (qr.isCorrect) {
          resultClass = 'result-correct';
          resultText = 'Correct';
        } else if (!qr.userAnswer) {
          resultClass = 'result-omitted';
          resultText = 'Omitted';
        }
        
        tr.dataset.filter = resultClass.replace('result-', '');
        
        tr.innerHTML = `
          <td>${qNum}</td>
          <td>${moduleResult.moduleKey}</td>
          <td><span class="${resultClass}">${resultText}</span></td>
          <td>${qr.userAnswer || '--'}</td>
          <td>${Array.isArray(qr.question.correctAnswer) ? qr.question.correctAnswer.join(' or ') : qr.question.correctAnswer}</td>
          <td style="text-transform: capitalize;">${qr.question.difficulty}</td>
          <td>${qr.question.skill || qr.question.domain}</td>
        `;
        
        tr.addEventListener('click', () => this.showQuestionDetail(qr, qNum, moduleResult.moduleKey));
        tableBody.appendChild(tr);
      });
    });
    
    const pct = Math.round((totalCorrect / totalQuestions) * 100) || 0;
    
    document.getElementById('result-correct-count').textContent = totalCorrect;
    document.getElementById('result-incorrect-count').textContent = totalIncorrect;
    document.getElementById('result-omitted-count').textContent = totalOmitted;
    document.getElementById('result-total-pct').textContent = `${pct}%`;
    
    // Filter tabs
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        
        Array.from(tableBody.children).forEach(row => {
          if (filter === 'all' || row.dataset.filter === filter) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    });
  }

  showQuestionDetail(qr, qNum, moduleKey) {
    const q = qr.question;
    document.getElementById('detail-modal-title').textContent = `Question ${qNum} (${moduleKey})`;
    
    const metaHtml = `
      <span class="detail-badge badge-${q.difficulty}">${q.difficulty}</span>
      <span class="detail-badge">${q.domain}</span>
      <span class="detail-badge">${q.skill}</span>
    `;
    document.getElementById('detail-meta').innerHTML = metaHtml;
    
    const passageEl = document.getElementById('detail-passage');
    if (q.stimulus) {
      passageEl.innerHTML = q.stimulus;
      passageEl.style.display = 'block';
    } else {
      passageEl.innerHTML = '';
      passageEl.style.display = 'none';
    }
    document.getElementById('detail-question-text').innerHTML = q.question || '';
    
    const choicesContainer = document.getElementById('detail-choices');
    const sprContainer = document.getElementById('detail-spr-answer');
    
    if (q.type === 'mcq') {
      choicesContainer.style.display = 'block';
      sprContainer.style.display = 'none';
      
      choicesContainer.innerHTML = '';
      q.choices.forEach(c => {
        const div = document.createElement('div');
        div.className = 'detail-choice';
        
        if (c.id === q.correctAnswer) {
          div.classList.add('choice-correct');
        } else if (c.id === qr.userAnswer) {
          div.classList.add('choice-incorrect');
        }
        
        div.innerHTML = `<span class="choice-letter">${c.id}</span> <div class="choice-content">${c.content}</div>`;
        choicesContainer.appendChild(div);
      });
    } else {
      choicesContainer.style.display = 'none';
      sprContainer.style.display = 'block';
      
      const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(' or ') : q.correctAnswer;
      sprContainer.innerHTML = `
        <div><strong>Your Answer:</strong> ${qr.userAnswer || '<em>None</em>'}</div>
        <div><strong>Correct Answer:</strong> ${correctAns}</div>
      `;
    }
    
    document.getElementById('detail-explanation').innerHTML = q.explanation || 'No explanation available.';
    
    this.detailModal.style.display = 'flex';
  }

  resetApp() {
    this.fullTestCb.checked = false;
    this.isFullTest = false;
    this.moduleCbs.forEach(cb => {
      cb.checked = false;
      cb.disabled = false;
    });
    this.updateStartBtn();
    this.showView('landing');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
