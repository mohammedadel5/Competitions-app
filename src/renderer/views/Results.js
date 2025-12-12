window.renderResultsView = function renderResultsView(root) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-results';

  const header = document.createElement('div');
  header.className = 'results-header';

  const title = document.createElement('h1');
  title.textContent = 'سجل النتائج';

	const subtitle = document.createElement('p');
	subtitle.className = 'view-subtitle';
	subtitle.textContent = 'استخدم الفلاتر لمراجعة نتائج المسابقات حسب المادة، المجموعة، أو التاريخ.';

  const headerActions = document.createElement('div');
  headerActions.className = 'results-header-actions';

  const backButton = document.createElement('button');
  backButton.textContent = 'رجوع إلى المواد';
  backButton.className = 'btn-outline';

  headerActions.appendChild(backButton);
  header.appendChild(title);
  header.appendChild(headerActions);

  const filters = document.createElement('div');
  filters.className = 'results-filters';

  const subjectFilter = document.createElement('select');
  subjectFilter.className = 'results-filter-select';

  const groupFilter = document.createElement('select');
  groupFilter.className = 'results-filter-select';

  const dateFilter = document.createElement('select');
  dateFilter.className = 'results-filter-select';

  filters.appendChild(subjectFilter);
  filters.appendChild(groupFilter);
  filters.appendChild(dateFilter);

  const listContainer = document.createElement('div');
  listContainer.className = 'results-list';

  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'results-details';

  container.appendChild(header);
	container.appendChild(subtitle);
  container.appendChild(filters);
  container.appendChild(listContainer);
  container.appendChild(detailsContainer);

  root.appendChild(container);

  let allResults = [];
  let selectedResultId = null;

  function setFilterOptions(select, placeholderText, values) {
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = placeholderText;
    select.appendChild(placeholder);

    Array.from(values).forEach((val) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  }

  function applyFilters() {
    const subjectVal = subjectFilter.value;
    const groupVal = groupFilter.value;
    const dateVal = dateFilter.value;

    return allResults.filter((r) => {
      if (subjectVal && r.subject_name !== subjectVal) return false;
      if (groupVal && r.group_or_school !== groupVal) return false;
      if (dateVal && (r.start_date || '').slice(0, 10) !== dateVal) return false;
      return true;
    });
  }

  function renderDetails(result) {
    detailsContainer.innerHTML = '';

    if (!result) {
      return;
    }

    const titleEl = document.createElement('h2');
    titleEl.textContent = `تفاصيل المسابقة للمشارك: ${result.full_name || ''}`;

    const meta = document.createElement('p');
    meta.className = 'results-details-meta';
    const dateText = (result.start_date || '').slice(0, 10) || 'غير معروف';
    meta.textContent = `المادة: ${result.subject_name || ''} — التاريخ: ${dateText}`;

    const list = document.createElement('ol');
    list.className = 'results-details-list';

    if (!window.api || !window.api.results || typeof window.api.results.getDetails !== 'function') {
      const p = document.createElement('p');
      p.textContent = 'تعذر تحميل تفاصيل النتيجة';
      detailsContainer.appendChild(p);
      return;
    }

    window.api.results
      .getDetails(result.result_id)
      .then((rows) => {
        (rows || []).forEach((row, index) => {
          const li = document.createElement('li');

          const qText = document.createElement('p');
          qText.className = 'results-details-question';
          qText.textContent = `السؤال ${index + 1}: ${row.question_text || ''}`;

          const selected = document.createElement('p');
          selected.className = 'results-details-selected';
          if (row.selected_answer_text) {
            selected.textContent = `إجابتك: ${row.selected_answer_text}`;
          } else {
            selected.textContent = 'لم يتم اختيار إجابة';
          }

          const correct = document.createElement('p');
          correct.className = 'results-details-correct';
          if (row.correct_answer_text) {
            correct.textContent = `الإجابة الصحيحة: ${row.correct_answer_text}`;
          }

          if (row.is_correct) {
            li.classList.add('results-details-correct-item');
          } else if (row.selected_answer_id != null) {
            li.classList.add('results-details-wrong-item');
          }

          li.appendChild(qText);
          li.appendChild(selected);
          li.appendChild(correct);
          list.appendChild(li);
        });

        detailsContainer.appendChild(titleEl);
        detailsContainer.appendChild(meta);
        if (result.judge_notes) {
          const notesEl = document.createElement('p');
          notesEl.className = 'results-details-notes';
          notesEl.textContent = result.judge_notes;
          detailsContainer.appendChild(notesEl);
        }
        detailsContainer.appendChild(list);
      })
      .catch(() => {
        const p = document.createElement('p');
        p.textContent = 'حدث خطأ أثناء تحميل تفاصيل النتيجة';
        detailsContainer.appendChild(p);
      });
  }

  function renderResultsList() {
    const filtered = applyFilters();
    listContainer.innerHTML = '';

    if (!filtered || filtered.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'لا توجد نتائج بعد.';
      listContainer.appendChild(empty);
      detailsContainer.innerHTML = '';
      return;
    }

    filtered.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const topRow = document.createElement('div');
      topRow.className = 'result-card-top';

      const nameEl = document.createElement('div');
      nameEl.className = 'result-card-name';
      nameEl.textContent = r.full_name || '';

      const scoreEl = document.createElement('div');
      scoreEl.className = 'result-card-score';
      scoreEl.textContent = r.score != null ? `النتيجة: ${r.score}` : 'النتيجة غير متاحة';

      topRow.appendChild(nameEl);
      topRow.appendChild(scoreEl);

      const metaRow = document.createElement('div');
      metaRow.className = 'result-card-meta';

      const subjectSpan = document.createElement('span');
      subjectSpan.textContent = r.subject_name || 'بدون مادة';

      const groupSpan = document.createElement('span');
      if (r.group_or_school) {
        groupSpan.textContent = r.group_or_school;
      }

      const dateSpan = document.createElement('span');
      const dateText = (r.start_date || '').slice(0, 10) || '';
      dateSpan.textContent = dateText;

      metaRow.appendChild(subjectSpan);
      if (r.group_or_school) {
        metaRow.appendChild(groupSpan);
      }
      metaRow.appendChild(dateSpan);

      const actions = document.createElement('div');
      actions.className = 'result-card-actions';

      const detailsButton = document.createElement('button');
      detailsButton.textContent = 'عرض التفاصيل';
      detailsButton.className = 'btn-outline btn-small';
      detailsButton.addEventListener('click', () => {
        selectedResultId = r.result_id;
        renderDetails(r);
      });

      actions.appendChild(detailsButton);

      card.appendChild(topRow);
      card.appendChild(metaRow);
      card.appendChild(actions);

      listContainer.appendChild(card);
    });

    if (selectedResultId) {
      const current = filtered.find((r) => r.result_id === selectedResultId);
      renderDetails(current || filtered[0]);
    } else {
      renderDetails(filtered[0]);
    }
  }

  function initFilters() {
    const subjects = new Set();
    const groups = new Set();
    const dates = new Set();

    (allResults || []).forEach((r) => {
      if (r.subject_name) subjects.add(r.subject_name);
      if (r.group_or_school) groups.add(r.group_or_school);
      if (r.start_date) dates.add((r.start_date || '').slice(0, 10));
    });

    setFilterOptions(subjectFilter, 'جميع المواد', subjects);
    setFilterOptions(groupFilter, 'كل المدارس / المجموعات', groups);
    setFilterOptions(dateFilter, 'كل التواريخ', dates);
  }

  function attachFilterListeners() {
    subjectFilter.addEventListener('change', renderResultsList);
    groupFilter.addEventListener('change', renderResultsList);
    dateFilter.addEventListener('change', renderResultsList);
  }

  if (!window.api || !window.api.results || typeof window.api.results.listAll !== 'function') {
    listContainer.textContent = 'تعذر تحميل النتائج';
  } else {
    window.api.results
      .listAll()
      .then((rows) => {
        allResults = rows || [];
        initFilters();
        attachFilterListeners();
        renderResultsList();
      })
      .catch(() => {
        listContainer.textContent = 'حدث خطأ أثناء تحميل النتائج';
      });
  }

  backButton.addEventListener('click', () => {
    if (window.renderCompetitionsView) {
      window.renderCompetitionsView(root);
    }
  });
};
