/**
 * Abandoned but Not Forgotten — NASA Space Apps Challenge 2026
 * Quiz View: Evidence-backed 10-Question Knowledge Challenge
 * Spec: Questions tied to verified records; immediate feedback with rationale and citations; retry option.
 */

const QuizView = (() => {

  let currentQuestionIndex = 0;
  let score = 0;
  let answered = false;

  function render(container) {
    const questions = DataService.getQuizQuestions();
    currentQuestionIndex = 0;
    score = 0;
    answered = false;

    renderQuestion(container, questions);
  }

  function renderQuestion(container, questions) {
    if (questions.length === 0) {
      container.innerHTML = `
        <div class="section-container" style="text-align: center; padding: 4rem 1rem;">
          <h2>No quiz questions available</h2>
        </div>
      `;
      return;
    }

    // Completion state
    if (currentQuestionIndex >= questions.length) {
      renderCompletion(container, questions);
      return;
    }

    const q = questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex) / questions.length) * 100;

    container.innerHTML = `
      <div class="section-container">
        <div class="section-header" style="text-align: center;">
          <span class="section-eyebrow">Interactive Knowledge Assessment</span>
          <h1 class="section-title">The Extraterrestrial Heritage Quiz</h1>
          <p class="section-description" style="margin: 0 auto;">
            Test your knowledge of NASA's historic and active missions, landing sites, rover odometries, and hardware left across the Moon, Mars, and beyond.
          </p>
        </div>

        <div class="quiz-card">
          <!-- Progress -->
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 8px;">
            <span>Question ${currentQuestionIndex + 1} of ${questions.length}</span>
            <span>Current Score: ${score}</span>
          </div>
          <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <!-- Question -->
          <h2 class="quiz-question-text">${q.question}</h2>

          <!-- Options -->
          <div class="quiz-options-list" id="quiz-options-container">
            ${q.options.map((opt, idx) => `
              <button type="button" class="quiz-option-btn" data-index="${idx}">
                <span style="display: inline-block; width: 24px; font-weight: 700; color: var(--color-nasa-blue);">${String.fromCharCode(65 + idx)}.</span>
                ${opt}
              </button>
            `).join('')}
          </div>

          <!-- Feedback Box Container -->
          <div id="quiz-feedback-container"></div>

          <!-- Next Button -->
          <div style="text-align: right; display: none;" id="quiz-next-container">
            <button type="button" class="btn btn-primary" id="quiz-next-btn">
              ${currentQuestionIndex + 1 === questions.length ? 'See Final Results 🏆' : 'Next Question →'}
            </button>
          </div>
        </div>
      </div>
    `;

    const optionBtns = container.querySelectorAll('.quiz-option-btn');
    const feedbackBox = container.querySelector('#quiz-feedback-container');
    const nextContainer = container.querySelector('#quiz-next-container');
    const nextBtn = container.querySelector('#quiz-next-btn');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (answered) return;
        answered = true;

        const selectedIdx = parseInt(btn.dataset.index, 10);
        const isCorrect = selectedIdx === q.correctIndex;

        if (isCorrect) {
          score++;
          btn.classList.add('selected-correct');
        } else {
          btn.classList.add('selected-wrong');
          // Highlight correct answer
          optionBtns[q.correctIndex].classList.add('selected-correct');
        }

        // Disable all buttons
        optionBtns.forEach(b => b.disabled = true);

        // Render feedback with explanation & citation
        feedbackBox.innerHTML = `
          <div class="quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}">
            <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 6px;">
              ${isCorrect ? '✓ Correct Answer!' : '✗ Not Quite Right'}
            </div>
            <p style="font-size: 0.95rem; line-height: 1.55; margin-bottom: 8px;">
              ${q.explanation}
            </p>
            <div style="font-size: 0.8rem; font-style: italic; opacity: 0.9;">
              Source: ${q.citation}
            </div>
          </div>
        `;

        nextContainer.style.display = 'block';
        nextBtn.focus();
      });
    });

    nextBtn.addEventListener('click', () => {
      answered = false;
      currentQuestionIndex++;
      renderQuestion(container, questions);
    });
  }

  function renderCompletion(container, questions) {
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    let message = 'Great effort!';
    if (percentage === 100) message = 'Outstanding! Perfect score on NASA extraterrestrial history!';
    else if (percentage >= 80) message = 'Impressive knowledge of NASA planetary and lunar exploration!';
    else if (percentage >= 50) message = 'Solid understanding of space artifacts and missions!';

    container.innerHTML = `
      <div class="section-container">
        <div class="quiz-card" style="text-align: center; padding: 3.5rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
          <span class="section-eyebrow">Quiz Complete</span>
          <h2 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem;">Your Score: ${score} / ${total} (${percentage}%)</h2>
          <p style="font-size: 1.1rem; color: var(--color-text-muted); margin-bottom: 2rem;">${message}</p>

          <div style="background: #f8fafc; border-radius: var(--radius-lg); padding: 1.5rem; max-width: 500px; margin: 0 auto 2rem; border: 1px solid var(--color-border); text-align: left; font-size: 0.9rem;">
            <p style="margin-bottom: 8px;"><strong>Scientific Integrity Note:</strong> All quiz items were formulated strictly from audited NASA Science and NSSDC primary documentation.</p>
            <p style="color: #64748b;">Ready to explore the catalogue further or test your knowledge again?</p>
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" id="quiz-retry-btn">Retry Quiz ↺</button>
            <a href="#/filters" class="btn btn-secondary">Explore Equipment Catalogue →</a>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#quiz-retry-btn').addEventListener('click', () => {
      render(container);
    });
  }

  return { render };
})();

window.QuizView = QuizView;
