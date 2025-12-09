window.renderQuestionsView = function renderQuestionsView(root, subject) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-questions';

  const title = document.createElement('h1');
  title.textContent = `بنك الأسئلة: ${subject && subject.name_ar ? subject.name_ar : ''}`;

  const listContainer = document.createElement('div');
  listContainer.className = 'questions-list';

  const formContainer = document.createElement('div');
  formContainer.className = 'question-form';

  const formTitle = document.createElement('h2');
  formTitle.textContent = 'إضافة سؤال جديد';

  const questionLabel = document.createElement('label');
  questionLabel.textContent = 'نص السؤال';
  const questionInput = document.createElement('textarea');

  const difficultyLabel = document.createElement('label');
  difficultyLabel.textContent = 'درجة الصعوبة';
  const difficultySelect = document.createElement('select');
  difficultySelect.className = 'difficulty-select';
  ['easy', 'medium', 'hard'].forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    if (value === 'easy') {
      option.textContent = 'سهل';
    } else if (value === 'medium') {
      option.textContent = 'متوسط';
    } else {
      option.textContent = 'صعب';
    }
    difficultySelect.appendChild(option);
  });

  const answersLabel = document.createElement('label');
  answersLabel.textContent = 'الخيارات (حدد الإجابة الصحيحة)';

  const answersContainer = document.createElement('div');
  answersContainer.className = 'answers-container';

  const answerInputs = [];
  let correctIndex = 0;
  let editingQuestionId = null;

  for (let i = 0; i < 4; i += 1) {
    const row = document.createElement('div');
    row.className = 'answer-row';

    const input = document.createElement('input');
    input.type = 'text';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'correctAnswer';
    radio.value = String(i);
    if (i === 0) {
      radio.checked = true;
    }

    radio.addEventListener('change', () => {
      correctIndex = i;
    });

    answerInputs.push(input);

    row.appendChild(radio);
    row.appendChild(input);
    answersContainer.appendChild(row);
  }

  const saveButton = document.createElement('button');
  saveButton.textContent = 'حفظ السؤال';
  saveButton.className = 'btn-hero';

  const cancelEditButton = document.createElement('button');
  cancelEditButton.textContent = 'إلغاء التعديل';
  cancelEditButton.className = 'btn-outline';

  const backButton = document.createElement('button');
  backButton.textContent = 'رجوع إلى المواد';
  backButton.className = 'btn-outline';

  formContainer.appendChild(formTitle);
  formContainer.appendChild(questionLabel);
  formContainer.appendChild(questionInput);
  formContainer.appendChild(difficultyLabel);
  formContainer.appendChild(difficultySelect);
  formContainer.appendChild(answersLabel);
  formContainer.appendChild(answersContainer);
  formContainer.appendChild(saveButton);
  formContainer.appendChild(cancelEditButton);

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-backdrop';
  modalOverlay.appendChild(formContainer);

  const header = document.createElement('div');
  header.className = 'questions-header';

  const headerActions = document.createElement('div');
  headerActions.className = 'questions-header-actions';

  const openFormButton = document.createElement('button');
  openFormButton.textContent = 'إضافة سؤال';
  openFormButton.className = 'btn-hero';

  headerActions.appendChild(openFormButton);
  headerActions.appendChild(backButton);

  header.appendChild(title);
  header.appendChild(headerActions);

  container.appendChild(header);
  container.appendChild(listContainer);
  container.appendChild(modalOverlay);

  root.appendChild(container);

  function resetForm() {
    editingQuestionId = null;
    formTitle.textContent = 'إضافة سؤال جديد';
    questionInput.value = '';
    difficultySelect.value = 'easy';
    answerInputs.forEach((input) => {
      input.value = '';
    });
    correctIndex = 0;
    const radios = answersContainer.querySelectorAll('input[type="radio"]');
    if (radios[0]) {
      radios[0].checked = true;
    }
    // messages are shown via toasts only
  }

  function startEdit(question) {
    editingQuestionId = question.id;
    formTitle.textContent = 'تعديل السؤال';
    questionInput.value = question.text || '';
    if (question.difficulty) {
      difficultySelect.value = question.difficulty;
    }

    answerInputs.forEach((input, index) => {
      const answer = (question.answers || [])[index];
      input.value = answer && answer.text ? answer.text : '';
    });

    const idx = (question.answers || []).findIndex((a) => a.is_correct);
    correctIndex = idx >= 0 ? idx : 0;
    const radios = answersContainer.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, index) => {
      radio.checked = index === correctIndex;
    });

    modalOverlay.classList.add('is-visible');
  }

  async function loadQuestions() {
    listContainer.innerHTML = '';

    if (!window.api || !window.api.questions || typeof window.api.questions.listBySubject !== 'function') {
      listContainer.textContent = 'تعذر تحميل الأسئلة';
      return;
    }

    try {
      const questions = await window.api.questions.listBySubject(subject.id);

      if (!questions || questions.length === 0) {
        listContainer.textContent = 'لا توجد أسئلة بعد';
        return;
      }

      const list = document.createElement('div');
      list.className = 'questions-grid';

      questions.forEach((q) => {
        const card = document.createElement('div');
        card.className = 'question-card';

        const qText = document.createElement('p');
        qText.textContent = q.text || '';

        const qDiff = document.createElement('span');
        let diffLabel = '';
        if (q.difficulty === 'easy') {
          diffLabel = 'سهل';
        } else if (q.difficulty === 'medium') {
          diffLabel = 'متوسط';
        } else if (q.difficulty === 'hard') {
          diffLabel = 'صعب';
        }
        qDiff.textContent = `الصعوبة: ${diffLabel}`;

        const answersList = document.createElement('ul');
        (q.answers || []).forEach((a) => {
          const li = document.createElement('li');
          li.textContent = a.text || '';
          if (a.is_correct) {
            li.style.fontWeight = 'bold';
          }
          answersList.appendChild(li);
        });

        const actions = document.createElement('div');
        actions.className = 'question-card-actions';
        const editButton = document.createElement('button');
        editButton.textContent = 'تعديل';
        editButton.className = 'btn-outline btn-small';
        editButton.addEventListener('click', () => {
          startEdit(q);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف';
        deleteButton.className = 'btn-danger btn-small';
        deleteButton.addEventListener('click', async () => {
          const confirmed = await (window.confirmDialog
            ? window.confirmDialog('هل تريد حذف هذا السؤال؟')
            : Promise.resolve(window.confirm('هل تريد حذف هذا السؤال؟')));
          if (!confirmed) {
            return;
          }

          if (!window.api || !window.api.questions || typeof window.api.questions.delete !== 'function') {
            listContainer.textContent = 'واجهة حذف الأسئلة غير متاحة';
            return;
          }

          try {
            const result = await window.api.questions.delete(q.id);
            if (!result || !result.ok) {
              listContainer.textContent = 'تعذر حذف السؤال';
              return;
            }
            if (editingQuestionId === q.id) {
              resetForm();
            }
            await loadQuestions();
          } catch (err) {
            listContainer.textContent = 'حدث خطأ أثناء حذف السؤال';
          }
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        card.appendChild(qText);
        card.appendChild(qDiff);
        card.appendChild(answersList);
        card.appendChild(actions);

        list.appendChild(card);
      });

      listContainer.appendChild(list);
    } catch (err) {
      const msg = 'حدث خطأ أثناء تحميل الأسئلة';
      if (window.showToast) {
        window.showToast(msg, 'error');
      }
    }
  }

  async function handleSave() {
    const text = questionInput.value.trim();
    const difficulty = difficultySelect.value;

    if (!text) {
      const msg = 'يرجى إدخال نص السؤال';
      if (window.showToast) {
        window.showToast(msg, 'warning');
      }
      return;
    }

    const answers = answerInputs.map((input, index) => ({
      text: input.value.trim(),
      is_correct: index === correctIndex
    }));

    const hasAnyAnswer = answers.some((a) => a.text);
    if (!hasAnyAnswer) {
      const msg = 'يرجى إدخال خيار واحد على الأقل';
      if (window.showToast) {
        window.showToast(msg, 'warning');
      }
      return;
    }

    const correctCount = answers.filter((a) => a.is_correct).length;
    if (correctCount !== 1) {
      const msg = 'يجب اختيار إجابة صحيحة واحدة فقط للسؤال';
      if (window.showToast) {
        window.showToast(msg, 'warning');
      }
      return;
    }

    if (!window.api || !window.api.questions) {
      const msg = 'واجهة حفظ الأسئلة غير متاحة';
      if (window.showToast) {
        window.showToast(msg, 'error');
      }
      return;
    }

    const isEditing = editingQuestionId !== null;

    try {
      if (isEditing) {
        if (typeof window.api.questions.update !== 'function') {
          const msg = 'واجهة تعديل الأسئلة غير متاحة';
          if (window.showToast) {
            window.showToast(msg, 'error');
          }
          return;
        }

        const payload = {
          id: editingQuestionId,
          subjectId: subject.id,
          text,
          difficulty,
          answers
        };

        const result = await window.api.questions.update(payload);
        if (!result || !result.ok) {
          if (result && result.error === 'DUPLICATE_QUESTION_SAME_SUBJECT') {
            const msg = 'هذا السؤال موجود مسبقاً لهذه المادة';
            if (window.showToast) {
              window.showToast(msg, 'warning');
            }
          } else if (window.showToast) {
            window.showToast('تعذر تعديل السؤال', 'error');
          }
          return;
        }

        if (window.showToast) {
          window.showToast('تم تعديل السؤال بنجاح', 'success');
        }
      } else {
        if (typeof window.api.questions.create !== 'function') {
          const msg = 'واجهة حفظ الأسئلة غير متاحة';
          if (window.showToast) {
            window.showToast(msg, 'error');
          }
          return;
        }

        const payload = {
          subjectId: subject.id,
          text,
          difficulty,
          answers
        };

        const result = await window.api.questions.create(payload);
        if (!result || !result.ok) {
          if (result && result.error === 'DUPLICATE_QUESTION_SAME_SUBJECT') {
            const msg = 'هذا السؤال موجود مسبقاً لهذه المادة';
            if (window.showToast) {
              window.showToast(msg, 'warning');
            }
          } else if (window.showToast) {
            window.showToast('تعذر حفظ السؤال', 'error');
          }
          return;
        }

        if (window.showToast) {
          window.showToast('تم حفظ السؤال بنجاح', 'success');
        }
      }

      resetForm();
      await loadQuestions();
      modalOverlay.classList.remove('is-visible');
    } catch (err) {
      if (window.showToast) {
        window.showToast('حدث خطأ أثناء حفظ السؤال', 'error');
      }
    }
  }

  saveButton.addEventListener('click', () => {
    handleSave();
  });

  cancelEditButton.addEventListener('click', () => {
    resetForm();
    modalOverlay.classList.remove('is-visible');
  });

  openFormButton.addEventListener('click', () => {
    resetForm();
    modalOverlay.classList.add('is-visible');
  });

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      resetForm();
      modalOverlay.classList.remove('is-visible');
    }
  });

  backButton.addEventListener('click', () => {
    if (window.renderCompetitionsView) {
      window.renderCompetitionsView(root);
    }
  });

  loadQuestions();
};
