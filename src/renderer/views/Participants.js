window.renderParticipantsView = function renderParticipantsView(root) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-participants';

  const header = document.createElement('div');
  header.className = 'participants-header';

  const title = document.createElement('h1');
  title.textContent = 'إدارة المشاركين';

	const subtitle = document.createElement('p');
	subtitle.className = 'view-subtitle';
	subtitle.textContent = 'اختر مادة ثم أضف أو عدّل أو احذف المشاركين المرتبطين بها.';

  const headerActions = document.createElement('div');
  headerActions.className = 'participants-header-actions';

  const backButton = document.createElement('button');
  backButton.textContent = 'رجوع إلى المواد';
  backButton.className = 'btn-outline';

  headerActions.appendChild(backButton);
  header.appendChild(title);
  header.appendChild(headerActions);

  const filters = document.createElement('div');
  filters.className = 'participants-filters';

  const subjectSelect = document.createElement('select');
  subjectSelect.className = 'participants-subject-select';

  filters.appendChild(subjectSelect);

  const layout = document.createElement('div');
  layout.className = 'participants-layout';

  const listContainer = document.createElement('div');
  listContainer.className = 'participants-list';

  const formCard = document.createElement('div');
  formCard.className = 'participant-form-card';

  const formTitle = document.createElement('h2');
  formTitle.textContent = 'إضافة مشارك';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'الاسم الكامل';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';

  const groupLabel = document.createElement('label');
  groupLabel.textContent = 'المدرسة / المجموعة (اختياري)';
  const groupInput = document.createElement('input');
  groupInput.type = 'text';

  const categoryLabel = document.createElement('label');
  categoryLabel.textContent = 'الفئة (اختياري)';
  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';

  const saveButton = document.createElement('button');
  saveButton.textContent = 'حفظ المشارك';
  saveButton.className = 'btn-hero';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'إلغاء التعديل';
  cancelButton.className = 'btn-outline';

  const message = document.createElement('div');
  message.className = 'participants-message';

  formCard.appendChild(formTitle);
  formCard.appendChild(nameLabel);
  formCard.appendChild(nameInput);
  formCard.appendChild(groupLabel);
  formCard.appendChild(groupInput);
  formCard.appendChild(categoryLabel);
  formCard.appendChild(categoryInput);
  formCard.appendChild(saveButton);
  formCard.appendChild(cancelButton);
  formCard.appendChild(message);

  layout.appendChild(listContainer);
  layout.appendChild(formCard);

  container.appendChild(header);
	container.appendChild(subtitle);
  container.appendChild(filters);
  container.appendChild(layout);

  root.appendChild(container);

  let subjects = [];
  let participants = [];
  let selectedSubjectId = null;
  let editingId = null;

  function resetForm() {
    editingId = null;
    formTitle.textContent = 'إضافة مشارك';
    saveButton.textContent = 'حفظ المشارك';
    nameInput.value = '';
    groupInput.value = '';
    categoryInput.value = '';
    message.textContent = '';
  }

  function setSubjectsOptions() {
    subjectSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'اختر مادة';
    subjectSelect.appendChild(placeholder);

    (subjects || []).forEach((s) => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = s.name_ar || '';
      subjectSelect.appendChild(opt);
    });

    if (selectedSubjectId) {
      subjectSelect.value = String(selectedSubjectId);
    }
  }

  function renderParticipantsList() {
    listContainer.innerHTML = '';

    if (!selectedSubjectId) {
      const p = document.createElement('p');
      p.textContent = 'اختر مادة لعرض المشاركين.';
      listContainer.appendChild(p);
      return;
    }

    if (!participants || participants.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'لا يوجد مشاركون لهذه المادة بعد.';
      listContainer.appendChild(p);
      return;
    }

    participants.forEach((pt) => {
      const card = document.createElement('div');
      card.className = 'participant-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'participant-card-name';
      nameEl.textContent = pt.full_name || '';

      const meta = document.createElement('div');
      meta.className = 'participant-card-meta';

      if (pt.group_or_school) {
        const span = document.createElement('span');
        span.textContent = pt.group_or_school;
        meta.appendChild(span);
      }

      if (pt.category) {
        const span = document.createElement('span');
        span.textContent = pt.category;
        meta.appendChild(span);
      }

      const actions = document.createElement('div');
      actions.className = 'participant-card-actions';

      const editButton = document.createElement('button');
      editButton.textContent = 'تعديل';
      editButton.className = 'btn-outline btn-small';
      editButton.addEventListener('click', () => {
        editingId = pt.id;
        formTitle.textContent = 'تعديل المشارك';
        saveButton.textContent = 'حفظ التغييرات';
        nameInput.value = pt.full_name || '';
        groupInput.value = pt.group_or_school || '';
        categoryInput.value = pt.category || '';
        message.textContent = '';
      });

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'حذف';
      deleteButton.className = 'btn-danger btn-small';
      deleteButton.addEventListener('click', async () => {
        const confirmed = await (window.confirmDialog
          ? window.confirmDialog('هل تريد حذف هذا المشارك؟')
          : Promise.resolve(window.confirm('هل تريد حذف هذا المشارك؟')));
        if (!confirmed) {
          return;
        }

        if (!window.api || !window.api.participants || typeof window.api.participants.delete !== 'function') {
          message.textContent = 'واجهة حذف المشاركين غير متاحة';
          return;
        }

        try {
          const result = await window.api.participants.delete(pt.id);
          if (!result || !result.ok) {
            message.textContent = 'تعذر حذف المشارك';
            return;
          }
          if (editingId === pt.id) {
            resetForm();
          }
          // reload list
          if (selectedSubjectId) {
            loadParticipants(selectedSubjectId);
          }
        } catch (err) {
          message.textContent = 'حدث خطأ أثناء حذف المشارك';
        }
      });

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);

      card.appendChild(nameEl);
      card.appendChild(meta);
      card.appendChild(actions);

      listContainer.appendChild(card);
    });
  }

  async function loadParticipants(subjectId) {
    participants = [];
    listContainer.innerHTML = '';

    if (!window.api || !window.api.participants || typeof window.api.participants.listBySubject !== 'function') {
      const p = document.createElement('p');
      p.textContent = 'واجهة تحميل المشاركين غير متاحة';
      listContainer.appendChild(p);
      return;
    }

    try {
      const rows = await window.api.participants.listBySubject(subjectId);
      participants = rows || [];
      renderParticipantsList();
    } catch (err) {
      const p = document.createElement('p');
      p.textContent = 'حدث خطأ أثناء تحميل المشاركين';
      listContainer.appendChild(p);
    }
  }

  async function loadSubjects() {
    subjects = [];
    if (!window.api || !window.api.subjects || typeof window.api.subjects.listWithStats !== 'function') {
      const p = document.createElement('p');
      p.textContent = 'تعذر تحميل المواد';
      listContainer.appendChild(p);
      return;
    }

    try {
      const rows = await window.api.subjects.listWithStats();
      subjects = rows || [];
      setSubjectsOptions();
    } catch (err) {
      const p = document.createElement('p');
      p.textContent = 'حدث خطأ أثناء تحميل المواد';
      listContainer.appendChild(p);
    }
  }

  async function handleSave() {
    message.textContent = '';

    if (!selectedSubjectId) {
      message.textContent = 'يرجى اختيار مادة أولاً';
      return;
    }

    const fullName = nameInput.value && nameInput.value.trim();
    const groupOrSchool = groupInput.value && groupInput.value.trim();
    const category = categoryInput.value && categoryInput.value.trim();

    if (!fullName) {
      message.textContent = 'يرجى إدخال الاسم الكامل';
      return;
    }

    if (!window.api || !window.api.participants) {
      message.textContent = 'واجهة المشاركين غير متاحة';
      return;
    }

    const subject = (subjects || []).find((s) => String(s.id) === String(selectedSubjectId));
    const subjectName = subject && subject.name_ar ? subject.name_ar : '';

    try {
      if (editingId) {
        if (typeof window.api.participants.update !== 'function') {
          message.textContent = 'واجهة تعديل المشاركين غير متاحة';
          return;
        }

        const result = await window.api.participants.update({
          id: editingId,
          fullName,
          groupOrSchool,
          category
        });
        if (!result || !result.ok) {
          message.textContent = 'تعذر تعديل المشارك';
          return;
        }
      } else {
        if (typeof window.api.participants.createForSubject !== 'function') {
          message.textContent = 'واجهة إضافة المشاركين غير متاحة';
          return;
        }

        const result = await window.api.participants.createForSubject(selectedSubjectId, {
          subjectName,
          fullName,
          groupOrSchool,
          category
        });
        if (!result || !result.ok) {
          message.textContent = 'تعذر إضافة المشارك';
          return;
        }
      }

      resetForm();
      if (selectedSubjectId) {
        loadParticipants(selectedSubjectId);
      }
    } catch (err) {
      message.textContent = 'حدث خطأ أثناء حفظ بيانات المشارك';
    }
  }

  backButton.addEventListener('click', () => {
    if (window.renderCompetitionsView) {
      window.renderCompetitionsView(root);
    }
  });

  subjectSelect.addEventListener('change', () => {
    const val = subjectSelect.value;
    selectedSubjectId = val ? Number(val) : null;
    participants = [];
    renderParticipantsList();
    if (selectedSubjectId) {
      loadParticipants(selectedSubjectId);
    }
  });

  saveButton.addEventListener('click', () => {
    handleSave();
  });

  cancelButton.addEventListener('click', () => {
    resetForm();
  });

  loadSubjects();
};
