window.renderRunCompetitionView = function renderRunCompetitionView(root, subject, competitionId) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-run-competition';

  const title = document.createElement('h1');
  title.textContent = `مسابقة: ${subject && subject.name_ar ? subject.name_ar : ''}`;

  const header = document.createElement('div');
  header.className = 'run-header';

  const headerActions = document.createElement('div');
  headerActions.className = 'run-header-actions';

  const participantsContainer = document.createElement('div');
  participantsContainer.className = 'run-participants';

  const newParticipantContainer = document.createElement('div');
  newParticipantContainer.className = 'run-participants-new';

  const newParticipantInput = document.createElement('input');
  newParticipantInput.type = 'text';
  newParticipantInput.placeholder = 'اسم المشارك';

  const newParticipantSaveButton = document.createElement('button');
  newParticipantSaveButton.textContent = 'حفظ المشارك';
  newParticipantSaveButton.className = 'btn-hero btn-small';

  const newParticipantCancelButton = document.createElement('button');
  newParticipantCancelButton.textContent = 'إلغاء';
  newParticipantCancelButton.className = 'btn-outline btn-small';

  const participantLabel = document.createElement('label');
  participantLabel.className = 'run-participants-label';
  participantLabel.textContent = 'المشارك';

  const participantSelect = document.createElement('select');
  participantSelect.className = 'run-participants-select';

  const addParticipantButton = document.createElement('button');
  addParticipantButton.textContent = 'إضافة مشارك';
  addParticipantButton.className = 'btn-outline btn-small';
  addParticipantButton.style.display = 'none';

  const questionContainer = document.createElement('div');
  questionContainer.className = 'run-question';

  const scoreInfo = document.createElement('p');
  scoreInfo.className = 'run-score';

  const controls = document.createElement('div');
  controls.className = 'run-controls';

  const prevButton = document.createElement('button');
  prevButton.textContent = 'السابق';
  prevButton.className = 'btn-outline';

  const nextButton = document.createElement('button');
  nextButton.textContent = 'التالي';
  nextButton.className = 'btn-outline';

  const nextRunButton = document.createElement('button');
  nextRunButton.textContent = 'بدء للمشارك التالي';
  nextRunButton.className = 'btn-outline';
  nextRunButton.style.display = 'none';

  const backButton = document.createElement('button');
  backButton.textContent = 'إنهاء المسابقة والرجوع';
  backButton.className = 'btn-hero';

  headerActions.appendChild(nextRunButton);
  headerActions.appendChild(backButton);
  header.appendChild(title);
  header.appendChild(headerActions);

  container.appendChild(header);
  participantsContainer.appendChild(participantLabel);
  participantsContainer.appendChild(participantSelect);
  participantsContainer.appendChild(addParticipantButton);
  container.appendChild(participantsContainer);
  newParticipantContainer.appendChild(newParticipantInput);
  newParticipantContainer.appendChild(newParticipantSaveButton);
  newParticipantContainer.appendChild(newParticipantCancelButton);
  newParticipantContainer.style.display = 'none';
  container.appendChild(newParticipantContainer);
  container.appendChild(scoreInfo);
  container.appendChild(questionContainer);
  container.appendChild(controls);

  controls.appendChild(prevButton);
  controls.appendChild(nextButton);

  root.appendChild(container);

  let allQuestions = [];
  let questions = [];
  let currentIndex = 0;
  const selectedAnswers = {};
  const checkedQuestions = {};
  const currentCompetitionId = competitionId || null;
  let summaryShown = false;
  let selectedParticipantId = null;
  let perQuestionSeconds = 0;
  let extraTimeSeconds = 0;
  let remainingSeconds = 0;
  let timerId = null;
  let fiftyUsed = false;
  let friendUsed = false;
  let extraTimeUsed = false;

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }

  function computeScore() {
    if (!questions || questions.length === 0) {
      scoreInfo.textContent = '';
      return;
    }

    let correctCount = 0;

    questions.forEach((q) => {
      if (!checkedQuestions[q.id]) {
        return;
      }
      const selectedId = selectedAnswers[q.id];
      if (!selectedId) {
        return;
      }
      const correct = (q.answers || []).some((a) => a.id === selectedId && a.is_correct);
      if (correct) {
        correctCount += 1;
      }
    });

    scoreInfo.textContent = `النتيجة الحالية: ${correctCount} من ${questions.length}`;
    return correctCount;
  }

  async function showSummary() {
    questionContainer.innerHTML = '';

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remainingSeconds = 0;

    if (!questions || questions.length === 0) {
      questionContainer.textContent = 'لا توجد أسئلة لهذه المادة بعد.';
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    const correctCount = computeScore();
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    if (
      currentCompetitionId &&
      selectedParticipantId &&
      window.api &&
      window.api.results &&
      typeof window.api.results.save === 'function'
    ) {
      try {
        const details = (questions || []).map((q) => {
          const selectedId = selectedAnswers[q.id] || null;
          const isCorrect = selectedId
            ? (q.answers || []).some((a) => a.id === selectedId && a.is_correct)
            : false;
          return {
            questionId: q.id,
            selectedAnswerId: selectedId,
            isCorrect
          };
        });

        const judgeNotes = friendUsed
          ? 'تم استخدام مساعدة صديق في هذه المسابقة'
          : null;

        await window.api.results.save({
          competitionId: currentCompetitionId,
          participantId: selectedParticipantId,
          score: correctCount,
          judgeNotes,
          details
        });
      } catch (err) {
        // ignore errors when saving results
      }
    }

    const card = document.createElement('div');
    card.className = 'run-summary-card';

    const header = document.createElement('div');
    header.className = 'run-summary-header';

    const summaryTitle = document.createElement('h2');
    summaryTitle.textContent = 'ملخص المسابقة';

    const scoreBadge = document.createElement('span');
    scoreBadge.className = 'run-summary-score';
    scoreBadge.textContent = `${correctCount} / ${questions.length}`;

    header.appendChild(summaryTitle);
    header.appendChild(scoreBadge);

    const progress = document.createElement('div');
    progress.className = 'run-summary-progress';

    const progressBar = document.createElement('div');
    progressBar.className = 'run-summary-progress-bar';
    progressBar.style.width = `${percentage}%`;
    progress.appendChild(progressBar);

    const percentLabel = document.createElement('div');
    percentLabel.className = 'run-summary-percent';
    percentLabel.textContent = `${percentage}%`;

    const overall = document.createElement('p');
    overall.className = 'run-summary-overall';
    overall.textContent = `عدد الإجابات الصحيحة: ${correctCount} من ${questions.length}`;

    const list = document.createElement('ol');
    list.className = 'run-summary-list';

    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.className = 'run-summary-item';

      const selectedId = selectedAnswers[q.id];
      const correctAnswer = (q.answers || []).find((a) => a.is_correct);

      let statusText = 'لم يتم الإجابة';
      if (selectedId) {
        const isCorrect = (q.answers || []).some((a) => a.id === selectedId && a.is_correct);
        if (isCorrect) {
          statusText = 'صحيح';
          li.classList.add('summary-correct');
        } else {
          statusText = 'خطأ';
          li.classList.add('summary-wrong');
        }
      }

      const qTextSpan = document.createElement('span');
      qTextSpan.className = 'run-summary-question';
      qTextSpan.textContent = `السؤال ${index + 1}: ${q.text || ''}`;

      const metaRow = document.createElement('div');
      metaRow.className = 'run-summary-meta';

      const subjectBadge = document.createElement('span');
      subjectBadge.className = 'run-summary-subject';
      subjectBadge.textContent = subject && subject.name_ar ? subject.name_ar : 'المادة';

      const diffBadge = document.createElement('span');
      diffBadge.className = 'run-difficulty-badge';
      let diffLabel = '';
      if (q.difficulty === 'easy') {
        diffLabel = 'سهل';
        diffBadge.classList.add('run-difficulty-easy');
      } else if (q.difficulty === 'medium') {
        diffLabel = 'متوسط';
        diffBadge.classList.add('run-difficulty-medium');
      } else if (q.difficulty === 'hard') {
        diffLabel = 'صعب';
        diffBadge.classList.add('run-difficulty-hard');
      }
      diffBadge.textContent = diffLabel || '—';

      const statusSpan = document.createElement('span');
      statusSpan.className = 'run-summary-status';
      statusSpan.textContent = statusText;

      metaRow.appendChild(subjectBadge);
      metaRow.appendChild(diffBadge);
      metaRow.appendChild(statusSpan);

      li.appendChild(qTextSpan);
      li.appendChild(metaRow);

      if (correctAnswer && correctAnswer.text) {
        const correctSpan = document.createElement('div');
        correctSpan.className = 'run-summary-correct-answer';
        correctSpan.textContent = `الإجابة الصحيحة: ${correctAnswer.text}`;
        li.appendChild(correctSpan);
      }

      list.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(progress);
    card.appendChild(percentLabel);
    card.appendChild(overall);
    card.appendChild(list);

    questionContainer.appendChild(card);

    prevButton.disabled = true;
    nextButton.disabled = true;
    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
    controls.style.display = 'none';
    nextRunButton.style.display = '';
  }

  function renderCurrentQuestion() {
    questionContainer.innerHTML = '';

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remainingSeconds = 0;

    if (!questions || questions.length === 0) {
      questionContainer.textContent = 'لا توجد أسئلة لهذه المادة بعد.';
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    if (currentIndex < 0) {
      currentIndex = 0;
    }
    if (currentIndex >= questions.length) {
      currentIndex = questions.length - 1;
    }

    const q = questions[currentIndex];

    const card = document.createElement('div');
    card.className = 'run-question-card';

    const header = document.createElement('div');
    header.className = 'run-question-header';

    const qTitle = document.createElement('h2');
    qTitle.textContent = `السؤال ${currentIndex + 1} من ${questions.length}`;

    const difficultyBadge = document.createElement('span');
    difficultyBadge.className = 'run-difficulty-badge';
    let diffLabel = '';
    if (q.difficulty === 'easy') {
      diffLabel = 'سهل';
      difficultyBadge.classList.add('run-difficulty-easy');
    } else if (q.difficulty === 'medium') {
      diffLabel = 'متوسط';
      difficultyBadge.classList.add('run-difficulty-medium');
    } else if (q.difficulty === 'hard') {
      diffLabel = 'صعب';
      difficultyBadge.classList.add('run-difficulty-hard');
    }
    difficultyBadge.textContent = diffLabel;

    header.appendChild(qTitle);
    if (diffLabel) {
      header.appendChild(difficultyBadge);
    }

    const qText = document.createElement('p');
    qText.textContent = q.text || '';

    const answersList = document.createElement('ul');
    answersList.className = 'run-answer-list';

    let selectedId = selectedAnswers[q.id] || null;
    const isChecked = !!checkedQuestions[q.id];

    const answerItems = [];

    (q.answers || []).forEach((a) => {
      const li = document.createElement('li');

      const label = document.createElement('label');

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'run-answer';
      input.value = String(a.id);
      input.checked = selectedId === a.id;

      input.addEventListener('change', () => {
        selectedAnswers[q.id] = a.id;
        renderCurrentQuestion();
      });

      const span = document.createElement('span');
      span.textContent = a.text || '';

      // Append span first, then input; CSS will use row-reverse so radio is at far right and text just to its left
      label.appendChild(span);
      label.appendChild(input);

      if (isChecked) {
        if (a.is_correct) {
          li.classList.add('answer-correct');
        }
        if (selectedId === a.id && !a.is_correct) {
          li.classList.add('answer-wrong');
        }
      } else if (selectedId === a.id) {
        li.classList.add('answer-selected');
      }

      li.appendChild(label);
      answersList.appendChild(li);
      answerItems.push({ li, answer: a });
    });

    const lifelines = document.createElement('div');
    lifelines.className = 'run-lifelines';

    const fiftyButton = document.createElement('button');
    fiftyButton.textContent = 'حذف إجابتين';
    fiftyButton.className = 'btn-outline btn-small';
    if (fiftyUsed) {
      fiftyButton.disabled = true;
    }

    const friendButton = document.createElement('button');
    friendButton.textContent = 'مساعدة صديق';
    friendButton.className = 'btn-outline btn-small';
    if (friendUsed) {
      friendButton.disabled = true;
    }

    const extraTimeButton = document.createElement('button');
    extraTimeButton.textContent = 'وقت إضافي';
    extraTimeButton.className = 'btn-outline btn-small';
    if (extraTimeUsed || perQuestionSeconds <= 0 || extraTimeSeconds <= 0) {
      extraTimeButton.disabled = true;
    }

    lifelines.appendChild(fiftyButton);
    lifelines.appendChild(friendButton);
    lifelines.appendChild(extraTimeButton);

    const checkButton = document.createElement('button');
    checkButton.textContent = 'تحقق من الإجابة';
    checkButton.className = 'btn-outline';
    checkButton.addEventListener('click', () => {
      const selectedIdInner = selectedAnswers[q.id];
      if (!selectedIdInner) {
        if (window.showToast) {
          window.showToast('يرجى اختيار إجابة أولاً', 'warning');
        }
        return;
      }

      const isCorrect = (q.answers || []).some(
        (a) => a.id === selectedIdInner && a.is_correct
      );

      checkedQuestions[q.id] = true;
      renderCurrentQuestion();

      if (window.playAnswerSound) {
        window.playAnswerSound(isCorrect);
      }

      if (window.showAnswerDialog) {
        window.showAnswerDialog(isCorrect);
      }
    });

    fiftyButton.addEventListener('click', () => {
      if (fiftyUsed) {
        return;
      }

      const incorrectItems = answerItems.filter(
        (item) => !item.answer.is_correct && item.li.style.display !== 'none'
      );

      if (incorrectItems.length <= 1) {
        if (window.showToast) {
          window.showToast('لا يمكن حذف إجابتين لهذا السؤال', 'warning');
        }
        return;
      }

      for (let i = incorrectItems.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = incorrectItems[i];
        incorrectItems[i] = incorrectItems[j];
        incorrectItems[j] = tmp;
      }

      const toHide = incorrectItems.slice(0, 2);
      toHide.forEach((item) => {
        item.li.style.display = 'none';
      });

      fiftyUsed = true;
      fiftyButton.disabled = true;

      if (window.showToast) {
        window.showToast('تم حذف إجابتين خاطئتين', 'info');
      }
    });

    friendButton.addEventListener('click', () => {
      if (friendUsed) {
        return;
      }

      if (window.showToast) {
        window.showToast('تم تفعيل مساعدة الصديق، يرجى انتظار إجابة الصديق.', 'info');
      }

      friendUsed = true;
      friendButton.disabled = true;
    });

    extraTimeButton.addEventListener('click', () => {
      if (extraTimeUsed || perQuestionSeconds <= 0 || extraTimeSeconds <= 0) {
        return;
      }

      if (!timerId) {
        if (window.showToast) {
          window.showToast('لا يوجد مؤقت نشط لهذا السؤال', 'warning');
        }
        return;
      }

      remainingSeconds += extraTimeSeconds;
      extraTimeUsed = true;
      extraTimeButton.disabled = true;

      if (window.showToast) {
        window.showToast(`تم إضافة ${extraTimeSeconds} ثانية إلى الوقت`, 'info');
      }
    });

    let timerWrapper = null;
    let timerHand = null;
    let timerText = null;
    let timerLabel = null;

    function updateAnalogTimer() {
      if (!timerHand || perQuestionSeconds <= 0) {
        return;
      }
      const ratio = Math.max(0, Math.min(1, remainingSeconds / perQuestionSeconds));
      const angle = 360 * (1 - ratio);
      timerHand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      if (timerText) {
        timerText.textContent = String(remainingSeconds);
      }

      const isWarning = remainingSeconds > 0 && remainingSeconds <= 5;
      if (timerWrapper) {
        if (isWarning) {
          timerWrapper.classList.add('run-timer-analog-warning');
        } else {
          timerWrapper.classList.remove('run-timer-analog-warning');
        }
      }
    }

    if (perQuestionSeconds > 0) {
      timerWrapper = document.createElement('div');
      timerWrapper.className = 'run-timer-analog';

      const timerCircle = document.createElement('div');
      timerCircle.className = 'run-timer-analog-circle';

      timerHand = document.createElement('div');
      timerHand.className = 'run-timer-analog-hand';

      timerText = document.createElement('span');
      timerText.className = 'run-timer-analog-text';

      timerCircle.appendChild(timerHand);
      timerCircle.appendChild(timerText);

      timerLabel = document.createElement('span');
      timerLabel.className = 'run-timer-label';
      timerLabel.textContent = 'مؤقت السؤال';

      timerWrapper.appendChild(timerCircle);
      timerWrapper.appendChild(timerLabel);

      header.appendChild(timerWrapper);

      remainingSeconds = perQuestionSeconds;
      updateAnalogTimer();

      timerId = setInterval(() => {
        remainingSeconds -= 1;

        if (remainingSeconds <= 0) {
          clearInterval(timerId);
          timerId = null;
          remainingSeconds = 0;
          if (timerLabel) {
            timerLabel.textContent = 'انتهى الوقت';
          }
          updateAnalogTimer();

          const inputs = answersList.querySelectorAll('input[type="radio"]');
          inputs.forEach((inputEl) => {
            inputEl.disabled = true;
          });

          checkButton.disabled = true;
        } else {
          if (window.playTimerTick && typeof window.playTimerTick === 'function') {
            const isWarning = remainingSeconds > 0 && remainingSeconds <= 5;
            window.playTimerTick(isWarning);
          }
          updateAnalogTimer();
        }
      }, 1000);
    }

    card.appendChild(header);
    card.appendChild(qText);
    card.appendChild(answersList);
    card.appendChild(lifelines);
    card.appendChild(checkButton);

    questionContainer.appendChild(card);

    controls.style.display = 'flex';
    prevButton.style.display = '';
    nextButton.style.display = '';
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === questions.length - 1;

    computeScore();
  }

  function showSetup() {
    questionContainer.innerHTML = '';

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remainingSeconds = 0;

    if (!allQuestions || allQuestions.length === 0) {
      questionContainer.textContent = 'لا توجد أسئلة لهذه المادة بعد.';
      prevButton.disabled = true;
      nextButton.disabled = true;
      controls.style.display = 'none';
      return;
    }

    const easyQuestions = allQuestions.filter((q) => q.difficulty === 'easy');
    const medQuestions = allQuestions.filter((q) => q.difficulty === 'medium');
    const hardQuestions = allQuestions.filter((q) => q.difficulty === 'hard');

    const card = document.createElement('div');
    card.className = 'run-setup-card';

    const headerEl = document.createElement('h2');
    headerEl.textContent = 'إعداد المسابقة';

    const info = document.createElement('p');
    info.className = 'run-setup-info';
    info.textContent = 'اختر عدد الأسئلة من كل مستوى صعوبة، ثم ابدأ المسابقة.';

    const rows = document.createElement('div');
    rows.className = 'run-setup-rows';

    function createRow(labelText, available, defaultValue) {
      const row = document.createElement('div');
      row.className = 'run-setup-row';

      const label = document.createElement('label');
      label.textContent = `${labelText} (متوفر: ${available})`;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = String(available);
      input.value = String(defaultValue);

      row.appendChild(label);
      row.appendChild(input);
      return { row, input };
    }

    const easyRow = createRow('عدد الأسئلة السهلة', easyQuestions.length, easyQuestions.length);
    const medRow = createRow('عدد الأسئلة المتوسطة', medQuestions.length, medQuestions.length);
    const hardRow = createRow('عدد الأسئلة الصعبة', hardQuestions.length, hardQuestions.length);

    rows.appendChild(easyRow.row);
    rows.appendChild(medRow.row);
    rows.appendChild(hardRow.row);

    const timerRow = document.createElement('div');
    timerRow.className = 'run-setup-row';

    const timerLabel = document.createElement('label');
    timerLabel.textContent = 'الوقت لكل سؤال (بالثواني، 0 = بدون مؤقت)';

    const timerInput = document.createElement('input');
    timerInput.type = 'number';
    timerInput.min = '0';
    timerInput.value = '0';

    timerRow.appendChild(timerLabel);
    timerRow.appendChild(timerInput);

    rows.appendChild(timerRow);

    const extraTimeRow = document.createElement('div');
    extraTimeRow.className = 'run-setup-row';

    const extraTimeLabel = document.createElement('label');
    extraTimeLabel.textContent = 'الوقت الإضافي عند استخدام المساعدة (بالثواني، 0 = بدون وقت إضافي)';

    const extraTimeInput = document.createElement('input');
    extraTimeInput.type = 'number';
    extraTimeInput.min = '0';
    extraTimeInput.value = '15';

    extraTimeRow.appendChild(extraTimeLabel);
    extraTimeRow.appendChild(extraTimeInput);

    rows.appendChild(extraTimeRow);

    const shuffleRow = document.createElement('div');
    shuffleRow.className = 'run-setup-row';

    const shuffleLabel = document.createElement('label');
    const shuffleCheckbox = document.createElement('input');
    shuffleCheckbox.type = 'checkbox';
    shuffleCheckbox.checked = true;

    const shuffleText = document.createElement('span');
    shuffleText.textContent = 'ترتيب عشوائي للأسئلة';

    shuffleLabel.appendChild(shuffleCheckbox);
    shuffleLabel.appendChild(shuffleText);
    shuffleRow.appendChild(shuffleLabel);

    const startButton = document.createElement('button');
    startButton.textContent = 'ابدأ المسابقة';
    startButton.className = 'btn-hero';

    function parseCount(input, max) {
      const v = parseInt(input.value, 10);
      if (Number.isNaN(v) || v < 0) return 0;
      if (v > max) return max;
      return v;
    }

    startButton.addEventListener('click', () => {
      const easyCount = parseCount(easyRow.input, easyQuestions.length);
      const medCount = parseCount(medRow.input, medQuestions.length);
      const hardCount = parseCount(hardRow.input, hardQuestions.length);

      const total = easyCount + medCount + hardCount;
      if (total === 0) {
        if (window.showToast) {
          window.showToast('يرجى اختيار عدد من الأسئلة أولاً', 'warning');
        }
        return;
      }

      if (window.playRunStartSound) {
        window.playRunStartSound();
      }

      const timerVal = parseInt(timerInput.value, 10);
      if (!Number.isNaN(timerVal) && timerVal > 0) {
        perQuestionSeconds = timerVal;
      } else {
        perQuestionSeconds = 0;
      }

      const extraTimeVal = parseInt(extraTimeInput.value, 10);
      if (!Number.isNaN(extraTimeVal) && extraTimeVal > 0) {
        extraTimeSeconds = extraTimeVal;
      } else {
        extraTimeSeconds = 0;
      }

      fiftyUsed = false;
      friendUsed = false;
      extraTimeUsed = false;

      const selected = [];

      const easyCopy = easyQuestions.slice();
      const medCopy = medQuestions.slice();
      const hardCopy = hardQuestions.slice();

      if (shuffleCheckbox.checked) {
        shuffleArray(easyCopy);
        shuffleArray(medCopy);
        shuffleArray(hardCopy);
      }

      selected.push(...easyCopy.slice(0, easyCount));
      selected.push(...medCopy.slice(0, medCount));
      selected.push(...hardCopy.slice(0, hardCount));

      if (shuffleCheckbox.checked) {
        shuffleArray(selected);
      }

      questions = selected;
      currentIndex = 0;
      summaryShown = false;

      Object.keys(selectedAnswers).forEach((key) => {
        delete selectedAnswers[key];
      });
      Object.keys(checkedQuestions).forEach((key) => {
        delete checkedQuestions[key];
      });

      controls.style.display = 'flex';
      prevButton.style.display = '';
      nextButton.style.display = '';
      nextRunButton.style.display = 'none';

      renderCurrentQuestion();
    });

    card.appendChild(headerEl);
    card.appendChild(info);
    card.appendChild(rows);
    card.appendChild(shuffleRow);
    card.appendChild(startButton);

    questionContainer.appendChild(card);

    // during setup, hide navigation controls
    controls.style.display = 'none';
    prevButton.disabled = true;
    nextButton.disabled = true;
    nextRunButton.style.display = 'none';
  }

  async function loadQuestions() {
    questionContainer.innerHTML = '';

    if (!window.api || !window.api.questions || typeof window.api.questions.listBySubject !== 'function') {
      questionContainer.textContent = 'تعذر تحميل الأسئلة.';
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    try {
      allQuestions = await window.api.questions.listBySubject(subject.id);
      showSetup();
    } catch (err) {
      questionContainer.textContent = 'حدث خطأ أثناء تحميل الأسئلة.';
      prevButton.disabled = true;
      nextButton.disabled = true;
    }
  }

  prevButton.addEventListener('click', () => {
    currentIndex -= 1;
    renderCurrentQuestion();
  });

  nextButton.addEventListener('click', () => {
    currentIndex += 1;
    renderCurrentQuestion();
  });

  nextRunButton.addEventListener('click', () => {
    // reset per-question state
    Object.keys(selectedAnswers).forEach((key) => {
      delete selectedAnswers[key];
    });
    Object.keys(checkedQuestions).forEach((key) => {
      delete checkedQuestions[key];
    });

    // reset run state
    currentIndex = 0;
    summaryShown = false;
    scoreInfo.textContent = '';

    fiftyUsed = false;
    friendUsed = false;
    extraTimeUsed = false;

    // require teacher to pick a participant again
    participantSelect.value = '';
    selectedParticipantId = null;

    // show navigation controls again
    controls.style.display = 'flex';
    prevButton.style.display = '';
    nextButton.style.display = '';
    nextRunButton.style.display = 'none';

    renderCurrentQuestion();
  });

  async function loadParticipants(preselectId) {
    if (
      !currentCompetitionId ||
      !window.api ||
      !window.api.participants ||
      typeof window.api.participants.listByCompetition !== 'function'
    ) {
      participantSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'لا يوجد مشاركون';
      participantSelect.appendChild(opt);
      selectedParticipantId = null;
      return;
    }

    try {
      const participants = await window.api.participants.listByCompetition(currentCompetitionId);
      participantSelect.innerHTML = '';

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'اختر مشاركاً';
      participantSelect.appendChild(placeholder);

      (participants || []).forEach((p) => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = p.full_name || '';
        participantSelect.appendChild(opt);
      });

      const targetId = preselectId || selectedParticipantId;
      if (targetId) {
        participantSelect.value = String(targetId);
        selectedParticipantId = Number(targetId);
      } else {
        participantSelect.value = '';
        selectedParticipantId = null;
      }
    } catch (err) {
      participantSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'تعذر تحميل المشاركين';
      participantSelect.appendChild(opt);
      selectedParticipantId = null;
    }
  }

  participantSelect.addEventListener('change', () => {
    const val = participantSelect.value;
    selectedParticipantId = val ? Number(val) : null;
  });

  addParticipantButton.addEventListener('click', () => {
    newParticipantInput.value = '';
    newParticipantContainer.style.display = 'flex';
    newParticipantInput.focus();
  });

  newParticipantCancelButton.addEventListener('click', () => {
    newParticipantInput.value = '';
    newParticipantContainer.style.display = 'none';
  });

  newParticipantSaveButton.addEventListener('click', async () => {
    if (!currentCompetitionId) {
      if (window.showToast) {
        window.showToast('لا يوجد سجل مسابقة لحفظ المشارك', 'error');
      }
      return;
    }

    if (!window.api || !window.api.participants || typeof window.api.participants.create !== 'function') {
      if (window.showToast) {
        window.showToast('واجهة المشاركين غير متاحة', 'error');
      }
      return;
    }

    const name = newParticipantInput.value && newParticipantInput.value.trim();
    if (!name) {
      if (window.showToast) {
        window.showToast('يرجى إدخال اسم المشارك', 'warning');
      }
      return;
    }

    try {
      const result = await window.api.participants.create(currentCompetitionId, {
        fullName: name
      });
      if (!result || !result.ok) {
        if (window.showToast) {
          window.showToast('تعذر إضافة المشارك', 'error');
        }
        return;
      }
      newParticipantContainer.style.display = 'none';
      await loadParticipants(result.id);
    } catch (err) {
      if (window.showToast) {
        window.showToast('حدث خطأ أثناء إضافة المشارك', 'error');
      }
    }
  });

  backButton.addEventListener('click', async () => {
    if (!summaryShown) {
      if (!selectedParticipantId) {
        if (window.showToast) {
          window.showToast('يرجى اختيار مشارك أولاً', 'warning');
        }
        return;
      }

      await showSummary();
      summaryShown = true;
      backButton.textContent = 'الرجوع إلى المواد';
      return;
    }

    if (window.renderCompetitionsView) {
      window.renderCompetitionsView(root);
    }
  });

  loadQuestions();

  if (currentCompetitionId) {
    loadParticipants();
  }
};
