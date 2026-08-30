export default class TestEngine {
  constructor(moduleConfig, callbacks) {
    this.moduleConfig = moduleConfig;
    this.callbacks = callbacks || {};
    this.questions = [];
    this.answers = {};
    this.flagged = new Set();
    this.eliminatedAnswers = {};
    this.isAnswerEliminatorOn = false;
    this.currentIndex = 0;
    this.secondsRemaining = 0;
    this.timerInterval = null;
    this.timerVisible = true;
    this.fiveMinuteWarningShown = false;
    this.isReviewing = false;

    this.elements = {
      testView: document.getElementById('test-view'),
      testBody: document.getElementById('test-body'),
      passageContent: document.getElementById('passage-content'),
      questionText: document.getElementById('question-text'),
      choicesContainer: document.getElementById('choices-container'),
      sprContainer: document.getElementById('spr-container'),
      sprInput: document.getElementById('spr-input'),
      qNumBadge: document.getElementById('question-number-badge'),
      markReviewCb: document.getElementById('mark-review-cb'),
      currentQNum: document.getElementById('current-q-num'),
      totalQNum: document.getElementById('total-q-num'),
      backBtn: document.getElementById('back-btn'),
      nextBtn: document.getElementById('next-btn'),
      qNavPill: document.getElementById('question-nav-pill'),
      qGridPopup: document.getElementById('question-grid-popup'),
      qGrid: document.getElementById('question-grid'),
      closeGridBtn: document.getElementById('close-grid-btn'),
      timerDisplay: document.getElementById('timer-display'),
      timerToggle: document.getElementById('timer-toggle'),
      timerContainer: document.getElementById('timer-container'),
      fiveMinModal: document.getElementById('five-min-modal'),
      dismissFiveMin: document.getElementById('dismiss-five-min'),
      timesupModal: document.getElementById('timesup-modal'),
      dismissTimesup: document.getElementById('dismiss-timesup'),
      sectionLabel: document.getElementById('section-label'),
      referenceBtn: document.getElementById('reference-btn')
    };

    // Bind event handlers
    this.handleNext = this.handleNext.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.handleMarkReview = this.handleMarkReview.bind(this);
    this.handleSprInput = this.handleSprInput.bind(this);
    this.toggleGridPopup = this.toggleGridPopup.bind(this);
    this.closeGridPopup = this.closeGridPopup.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.toggleTimer = this.toggleTimer.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    this.handleDismissFiveMin = this.handleDismissFiveMin.bind(this);
    this.handleDismissTimesup = this.handleDismissTimesup.bind(this);
  }

  startModule() {
    if (!this.moduleConfig) return;
    this.questions = this.moduleConfig.questions;
    this.timeMinutes = this.moduleConfig.timeMinutes;
    this.label = this.moduleConfig.label;
    this.moduleKey = this.moduleConfig.moduleKey;
    this.isMath = this.moduleConfig.isMath;

    this.answers = {};
    this.flagged = new Set();
    this.eliminatedAnswers = {};
    this.isAnswerEliminatorOn = false;
    this.currentIndex = 0;
    this.secondsRemaining = this.timeMinutes * 60;
    this.fiveMinuteWarningShown = false;
    this.isReviewing = false;

    // UI Setup
    this.elements.sectionLabel.textContent = this.label;
    this.elements.totalQNum.textContent = this.questions.length;
    this.elements.referenceBtn.style.display = this.isMath ? 'flex' : 'none';

    this.timerVisible = true;
    this.elements.timerToggle.textContent = 'Hide';
    this.elements.timerDisplay.style.visibility = 'visible';
    this.elements.timerContainer.classList.remove('timer-warning');
    this.elements.timerToggle.disabled = false;

    this.attachListeners();
    this.startTimer();
    this.renderQuestion(this.currentIndex);
  }

  attachListeners() {
    this.elements.nextBtn.addEventListener('click', this.handleNext);
    this.elements.backBtn.addEventListener('click', this.handleBack);
    this.elements.markReviewCb.addEventListener('change', this.handleMarkReview);
    this.elements.sprInput.addEventListener('input', this.handleSprInput);
    
    this.elements.qNavPill.addEventListener('click', this.toggleGridPopup);
    this.elements.closeGridBtn.addEventListener('click', this.closeGridPopup);
    document.addEventListener('click', this.handleOutsideClick);
    
    this.elements.timerToggle.addEventListener('click', this.toggleTimer);
    document.addEventListener('keydown', this.handleKeyDown);

    this.elements.dismissFiveMin.addEventListener('click', this.handleDismissFiveMin);
    this.elements.dismissTimesup.addEventListener('click', this.handleDismissTimesup);
  }

  removeListeners() {
    this.elements.nextBtn.removeEventListener('click', this.handleNext);
    this.elements.backBtn.removeEventListener('click', this.handleBack);
    this.elements.markReviewCb.removeEventListener('change', this.handleMarkReview);
    this.elements.sprInput.removeEventListener('input', this.handleSprInput);
    
    this.elements.qNavPill.removeEventListener('click', this.toggleGridPopup);
    this.elements.closeGridBtn.removeEventListener('click', this.closeGridPopup);
    document.removeEventListener('click', this.handleOutsideClick);
    
    this.elements.timerToggle.removeEventListener('click', this.toggleTimer);
    document.removeEventListener('keydown', this.handleKeyDown);

    this.elements.dismissFiveMin.removeEventListener('click', this.handleDismissFiveMin);
    this.elements.dismissTimesup.removeEventListener('click', this.handleDismissTimesup);
  }

  processMath(htmlString) {
    if (!htmlString) return '';
    // KaTeX fallback for inline \( ... \) and block \[ ... \]
    let processed = htmlString;
    try {
      processed = processed.replace(/\\\((.*?)\\\)/g, (match, math) => {
        return window.katex ? katex.renderToString(math, { throwOnError: false }) : match;
      });
      processed = processed.replace(/\\\[(.*?)\\\]/g, (match, math) => {
        return window.katex ? katex.renderToString(math, { displayMode: true, throwOnError: false }) : match;
      });
    } catch (e) {
      console.warn('KaTeX rendering error', e);
    }
    return processed;
  }

  renderQuestion(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    const question = this.questions[index];

    // Scroll to top
    document.getElementById('passage-panel').scrollTop = 0;
    document.getElementById('question-panel').scrollTop = 0;

    // Navigation and badges
    this.elements.currentQNum.textContent = index + 1;
    this.elements.qNumBadge.textContent = index + 1;
    
    this.elements.backBtn.disabled = (index === 0);
    if (index === this.questions.length - 1) {
      this.elements.nextBtn.textContent = 'Review';
    } else {
      this.elements.nextBtn.textContent = 'Next';
    }

    this.elements.markReviewCb.checked = this.flagged.has(question.id);

    // Stimulus
    if (question.stimulus) {
      this.elements.testBody.classList.add('has-passage');
      this.elements.passageContent.innerHTML = this.processMath(question.stimulus);
    } else {
      this.elements.testBody.classList.remove('has-passage');
      this.elements.passageContent.innerHTML = '';
    }

    // Question
    this.elements.questionText.innerHTML = this.processMath(question.question);

    // Choices vs SPR
    if (question.type === 'mcq') {
      this.elements.sprContainer.style.display = 'none';
      this.elements.choicesContainer.style.display = 'block';
      this.renderChoices(question);
    } else {
      this.elements.choicesContainer.style.display = 'none';
      this.elements.sprContainer.style.display = 'block';
      this.elements.sprInput.value = this.answers[question.id] || '';
    }
  }

  renderChoices(question) {
    this.elements.choicesContainer.innerHTML = '';
    const selectedAnswer = this.answers[question.id];

    question.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      
      const eliminatedSet = this.eliminatedAnswers[question.id] || new Set();
      if (eliminatedSet.has(choice.id)) {
        btn.classList.add('eliminated');
      } else if (selectedAnswer === choice.id) {
        btn.classList.add('selected');
      }

      const letterDiv = document.createElement('div');
      letterDiv.className = 'choice-letter';
      letterDiv.textContent = choice.id;

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'choice-body';
      bodyDiv.innerHTML = this.processMath(choice.content);

      const eliminatorBtn = document.createElement('div');
      eliminatorBtn.className = 'eliminator-icon-btn';
      eliminatorBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M3 21L21 3"/></svg>';
      
      eliminatorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.eliminatedAnswers[question.id]) {
          this.eliminatedAnswers[question.id] = new Set();
        }
        const eSet = this.eliminatedAnswers[question.id];
        
        if (eSet.has(choice.id)) {
          eSet.delete(choice.id);
          btn.classList.remove('eliminated');
          eliminatorBtn.classList.remove('active');
        } else {
          if (this.answers[question.id] === choice.id) {
            delete this.answers[question.id];
            btn.classList.remove('selected');
            this.updateQuestionGrid();
          }
          eSet.add(choice.id);
          btn.classList.add('eliminated');
          eliminatorBtn.classList.add('active');
        }
      });
      
      if (eliminatedSet.has(choice.id)) {
        eliminatorBtn.classList.add('active');
      }

      btn.appendChild(letterDiv);
      btn.appendChild(bodyDiv);
      btn.appendChild(eliminatorBtn);

      btn.addEventListener('click', () => {
        if (this.eliminatedAnswers[question.id] && this.eliminatedAnswers[question.id].has(choice.id)) {
          this.eliminatedAnswers[question.id].delete(choice.id);
          btn.classList.remove('eliminated');
          eliminatorBtn.classList.remove('active');
        }
        this.handleChoiceClick(question.id, choice.id);
      });

      this.elements.choicesContainer.appendChild(btn);
    });
  }

  handleChoiceClick(questionId, choiceId) {
    this.answers[questionId] = choiceId;
    
    // Update UI
    const btns = this.elements.choicesContainer.querySelectorAll('.choice-btn');
    btns.forEach(btn => {
      if (btn.querySelector('.choice-letter').textContent === choiceId) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  handleSprInput(e) {
    const questionId = this.questions[this.currentIndex].id;
    this.answers[questionId] = e.target.value;
  }

  handleMarkReview(e) {
    const questionId = this.questions[this.currentIndex].id;
    if (e.target.checked) {
      this.flagged.add(questionId);
    } else {
      this.flagged.delete(questionId);
    }
  }

  handleNext() {
    if (this.currentIndex < this.questions.length - 1) {
      this.renderQuestion(this.currentIndex + 1);
    } else {
      this.showModuleReview();
    }
  }

  handleBack() {
    if (this.currentIndex > 0) {
      this.renderQuestion(this.currentIndex - 1);
    }
  }

  handleKeyDown(e) {
    // Only if not in review and no modal is open (basic check)
    if (this.isReviewing || document.querySelector('.modal-overlay[style*="display: block"]') || document.querySelector('.modal-overlay[style*="display: flex"]')) return;
    
    // Prevent interfering with SPR input
    if (document.activeElement === this.elements.sprInput) return;

    if (e.key === 'ArrowRight') {
      this.handleNext();
    } else if (e.key === 'ArrowLeft') {
      this.handleBack();
    } else if (e.key.toLowerCase() === 'm' || (e.ctrlKey && e.key.toLowerCase() === 'm')) {
      e.preventDefault();
      this.elements.markReviewCb.click();
    } else {
      // 1,2,3,4 for MCQ
      const question = this.questions[this.currentIndex];
      if (question.type === 'mcq') {
        const keyMap = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        if (keyMap[e.key]) {
          this.handleChoiceClick(question.id, keyMap[e.key]);
        }
      }
    }
  }

  // --- Question Grid ---

  toggleGridPopup(e) {
    e.stopPropagation();
    const isHidden = this.elements.qGridPopup.style.display === 'none';
    if (isHidden) {
      this.elements.qGridPopup.style.display = 'block';
      this.elements.gridPopupTitle = document.getElementById('grid-popup-title');
      if (this.elements.gridPopupTitle) {
        this.elements.gridPopupTitle.textContent = this.label;
      }
      this.renderGrid(this.elements.qGrid);
    } else {
      this.closeGridPopup();
    }
  }

  closeGridPopup() {
    this.elements.qGridPopup.style.display = 'none';
  }

  handleOutsideClick(e) {
    if (this.elements.qGridPopup.style.display === 'block') {
      if (!this.elements.qGridPopup.contains(e.target) && !this.elements.qNavPill.contains(e.target)) {
        this.closeGridPopup();
      }
    }
  }

  renderGrid(container) {
    container.innerHTML = '';
    this.questions.forEach((q, i) => {
      const btn = document.createElement('button');
      btn.className = 'grid-q';
      btn.textContent = i + 1;
      
      if (this.answers[q.id] !== undefined && this.answers[q.id].toString().trim() !== '') {
        btn.classList.add('answered');
      } else {
        btn.classList.add('unanswered');
      }

      if (this.flagged.has(q.id)) {
        btn.classList.add('flagged');
      }

      if (i === this.currentIndex && !this.isReviewing) {
        btn.classList.add('current');
      }

      btn.addEventListener('click', () => {
        if (this.isReviewing) {
          // Switch back to test view
          if (this.callbacks.onReturnToQuestion) {
            this.callbacks.onReturnToQuestion(i);
          }
          this.isReviewing = false;
        } else {
          this.closeGridPopup();
        }
        this.renderQuestion(i);
      });

      container.appendChild(btn);
    });
  }

  // --- Module Review ---

  showModuleReview() {
    this.isReviewing = true;
    if (this.callbacks.onRequestReview) {
      this.callbacks.onRequestReview({
        label: this.label,
        states: this.questions.map(q => ({
          answered: this.answers[q.id] !== undefined && this.answers[q.id].toString().trim() !== '',
          flagged: this.flagged.has(q.id)
        }))
      });
    }
  }

  goToQuestion(index) {
    this.isReviewing = false;
    this.renderQuestion(index);
  }

  pause() {
    this.stopTimer();
  }

  resume() {
    if (this.secondsRemaining > 0 && !this.timerInterval) {
      this.startTimer();
    }
  }

  // --- Timer ---

  startTimer() {
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.secondsRemaining--;
      if (this.secondsRemaining <= 0) {
        this.secondsRemaining = 0;
        this.stopTimer();
        this.updateTimerDisplay();
        this.handleTimeUp();
      } else {
        this.updateTimerDisplay();
        if (this.secondsRemaining === 300 && !this.fiveMinuteWarningShown) {
          this.showFiveMinuteWarning();
        }
        if (this.callbacks.onTimerUpdate) {
          this.callbacks.onTimerUpdate(this.secondsRemaining);
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.secondsRemaining / 60);
    const secs = this.secondsRemaining % 60;
    this.elements.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleTimer() {
    if (this.elements.timerToggle.disabled) return;
    
    this.timerVisible = !this.timerVisible;
    if (this.timerVisible) {
      this.elements.timerDisplay.style.visibility = 'visible';
      this.elements.timerToggle.textContent = 'Hide';
    } else {
      this.elements.timerDisplay.style.visibility = 'hidden';
      this.elements.timerToggle.textContent = 'Show';
    }
  }

  showFiveMinuteWarning() {
    this.fiveMinuteWarningShown = true;
    this.elements.fiveMinModal.style.display = 'flex';
    
    // Force timer visible
    this.timerVisible = true;
    this.elements.timerDisplay.style.visibility = 'visible';
    this.elements.timerToggle.textContent = 'Hide';
    this.elements.timerToggle.disabled = true;
    
    this.elements.timerContainer.classList.add('timer-warning');
  }

  handleDismissFiveMin() {
    this.elements.fiveMinModal.style.display = 'none';
  }

  handleTimeUp() {
    this.elements.timesupModal.style.display = 'flex';
  }

  handleDismissTimesup() {
    this.elements.timesupModal.style.display = 'none';
    this.submitModule();
  }

  // --- Submission and Scoring ---

  submitModule() {
    this.stopTimer();
    const results = this.getModuleResults();
    if (this.callbacks.onModuleComplete) {
      this.callbacks.onModuleComplete(results);
    }
  }

  getModuleResults() {
    let correctCount = 0;
    let incorrectCount = 0;
    let omittedCount = 0;
    
    const questionsResults = this.questions.map(q => {
      const userAnswer = this.answers[q.id];
      let isCorrect = false;
      let isOmitted = false;

      if (userAnswer === undefined || userAnswer.toString().trim() === '') {
        isOmitted = true;
      } else {
        if (q.type === 'mcq') {
          isCorrect = (userAnswer === q.correctAnswer);
        } else if (q.type === 'spr') {
          isCorrect = this.checkSprAnswer(userAnswer, q.correctAnswer);
        }
      }

      if (isOmitted) omittedCount++;
      else if (isCorrect) correctCount++;
      else incorrectCount++;

      return {
        question: q,
        userAnswer: isOmitted ? null : userAnswer,
        isCorrect,
        isOmitted
      };
    });

    return {
      moduleKey: this.moduleKey,
      label: this.label,
      questionResults: questionsResults,
      correct: correctCount,
      incorrect: incorrectCount,
      omitted: omittedCount,
      total: this.questions.length
    };
  }

  checkSprAnswer(userAnswer, correctAnswers) {
    if (!correctAnswers || !Array.isArray(correctAnswers)) return false;
    
    const normalize = (val) => {
      if (typeof val !== 'string') val = String(val);
      val = val.trim();
      
      // Handle fraction
      if (val.includes('/')) {
        const parts = val.split('/');
        if (parts.length === 2) {
          const num = parseFloat(parts[0]);
          const den = parseFloat(parts[1]);
          if (!isNaN(num) && !isNaN(den) && den !== 0) {
            return num / den;
          }
        }
      }
      return parseFloat(val);
    };

    const userVal = normalize(userAnswer);
    if (isNaN(userVal)) return false;

    // Check against all correct answers
    for (let ans of correctAnswers) {
      const correctVal = normalize(ans);
      if (!isNaN(correctVal)) {
        // Compare with small epsilon for float precision
        if (Math.abs(userVal - correctVal) < 0.0001) {
          return true;
        }
      } else {
        // Fallback string compare
        if (userAnswer.trim().toLowerCase() === String(ans).trim().toLowerCase()) {
          return true;
        }
      }
    }
    
    return false;
  }

  destroy() {
    this.stopTimer();
    this.removeListeners();
  }
}
