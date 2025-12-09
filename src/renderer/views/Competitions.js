function getSubjectCardColors(name) {
  const text = (name || '').trim();
  if (!text) {
    return {
      background: 'linear-gradient(135deg, #eef2ff, #e0f2fe)',
      borderColor: '#c7d2fe',
    };
  }

  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 70;
  const lightnessStart = 95;
  const lightnessEnd = 88;

  const background = `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightnessStart}%), hsl(${(hue + 20) % 360}, ${saturation}%, ${lightnessEnd}%))`;
  const borderColor = `hsl(${hue}, ${saturation}%, 75%)`;

  return { background, borderColor };
}

function getSubjectAvatarInfo(subject) {
  if (!subject) {
    return { emoji: '📚', className: '' };
  }

  const code = (subject.code || '').toUpperCase();
  const nameAr = subject.name_ar || '';

  if (code === 'ISLAMIC' || nameAr.includes('الإسلام')) {
    return { emoji: '🕌', className: 'subject-avatar--islamic' };
  }
  if (code === 'AR' || nameAr.includes('العربية')) {
    return { emoji: '📖', className: 'subject-avatar--arabic' };
  }
  if (code === 'EN' || nameAr.includes('الإنجليزية')) {
    return { emoji: '🔤', className: 'subject-avatar--english' };
  }
  if (code === 'MATH' || nameAr.includes('الرياضيات')) {
    return { emoji: '➗', className: 'subject-avatar--math' };
  }
  if (code === 'BIO') {
    return { emoji: '🧬', className: 'subject-avatar--bio' };
  }
  if (code === 'CHEM') {
    return { emoji: '⚗️', className: 'subject-avatar--chem' };
  }
  if (code === 'PHYS') {
    return { emoji: '🔭', className: 'subject-avatar--phys' };
  }
  if (code === 'HIST') {
    return { emoji: '🏺', className: 'subject-avatar--hist' };
  }
  if (code === 'GEO') {
    return { emoji: '🗺️', className: 'subject-avatar--geo' };
  }

  return { emoji: '📚', className: '' };
}

window.renderCompetitionsView = function renderCompetitionsView(root) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-competitions';

  const header = document.createElement('div');
  header.className = 'competitions-header';

  const title = document.createElement('h1');
  title.textContent = 'مواد المسابقات';

	const subtitle = document.createElement('p');
	subtitle.className = 'view-subtitle';
	subtitle.textContent = 'اختر مادة لإدارة بنك الأسئلة، بدء المسابقة، ومتابعة نتائج الطلاب.';

  const headerActions = document.createElement('div');
  headerActions.className = 'competitions-header-actions';

  const participantsButton = document.createElement('button');
  participantsButton.textContent = 'إدارة المشاركين';
  participantsButton.className = 'btn-outline';
  participantsButton.addEventListener('click', () => {
    if (window.renderParticipantsView) {
      window.renderParticipantsView(root);
    }
  });

  const resultsButton = document.createElement('button');
  resultsButton.textContent = 'سجل النتائج';
  resultsButton.className = 'btn-outline';
  resultsButton.addEventListener('click', () => {
    if (window.renderResultsView) {
      window.renderResultsView(root);
    }
  });

  const resetButton = document.createElement('button');
  resetButton.textContent = 'مسح بيانات المسابقات (مؤقت)';
  resetButton.className = 'btn-danger btn-small';
  resetButton.addEventListener('click', async () => {
    const confirmed = await (window.confirmDialog
      ? window.confirmDialog('سيتم مسح جميع المسابقات، المشاركين، الأسئلة، والنتائج. هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟')
      : Promise.resolve(window.confirm('سيتم مسح جميع المسابقات، المشاركين، الأسئلة، والنتائج. هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟')));
    if (!confirmed) {
      return;
    }

    if (!window.api || !window.api.admin || typeof window.api.admin.resetDb !== 'function') {
      if (window.showToast) {
        window.showToast('واجهة مسح البيانات غير متاحة', 'error');
      }
      return;
    }

    try {
      const result = await window.api.admin.resetDb();
      if (!result || !result.ok) {
        if (window.showToast) {
          window.showToast('تعذر مسح البيانات', 'error');
        }
        return;
      }
      if (window.showToast) {
        window.showToast('تم مسح بيانات المسابقات بنجاح', 'success');
      }
      // Reload subjects grid
      loadSubjects();
    } catch (err) {
      if (window.showToast) {
        window.showToast('حدث خطأ أثناء مسح البيانات', 'error');
      }
    }
  });

  headerActions.appendChild(participantsButton);
  headerActions.appendChild(resultsButton);
  headerActions.appendChild(resetButton);
  header.appendChild(title);
  header.appendChild(headerActions);

  const grid = document.createElement('div');
  grid.className = 'subjects-grid';

  container.appendChild(header);
	container.appendChild(subtitle);
  container.appendChild(grid);

  root.appendChild(container);

  async function loadSubjects() {
    if (!window.api || !window.api.subjects || typeof window.api.subjects.listWithStats !== 'function') {
      grid.textContent = 'تعذر تحميل المواد';
      return;
    }

    try {
      const subjects = await window.api.subjects.listWithStats();
      grid.innerHTML = '';

      (subjects || []).forEach((subject) => {
        const card = document.createElement('div');
        card.className = 'subject-card';

        const colors = getSubjectCardColors(subject.name_ar || subject.name || '');

        const codeForBg = (subject.code || '').toUpperCase();
        if (codeForBg) {
          card.style.backgroundImage = `url('../assets/subjects/bg-${codeForBg}.png')`;
          card.style.backgroundSize = 'cover';
          card.style.backgroundPosition = 'center';
          card.style.backgroundRepeat = 'no-repeat';
        } else if (colors && colors.background) {
          card.style.background = colors.background;
        }

        if (colors && colors.borderColor) {
          card.style.borderColor = colors.borderColor;
        }

        const header = document.createElement('div');
        header.className = 'subject-card-header';

        const avatarInfo = getSubjectAvatarInfo(subject);
        const avatar = document.createElement('div');
        avatar.className = 'subject-avatar';
        if (avatarInfo && avatarInfo.className) {
          avatar.className += ` ${avatarInfo.className}`;
        }

        const codeForImage = (subject.code || '').toUpperCase();
        if (codeForImage) {
          const img = document.createElement('img');
          img.src = `../assets/subjects/${codeForImage}.png`;
          img.alt = subject.name_ar || '';
          img.onerror = () => {
            img.remove();
            const avatarSpanFallback = document.createElement('span');
            avatarSpanFallback.textContent = (avatarInfo && avatarInfo.emoji) || '📚';
            avatar.appendChild(avatarSpanFallback);
          };
          avatar.appendChild(img);
        } else {
          const avatarSpan = document.createElement('span');
          avatarSpan.textContent = (avatarInfo && avatarInfo.emoji) || '📚';
          avatar.appendChild(avatarSpan);
        }

        const textWrap = document.createElement('div');
        textWrap.className = 'subject-card-text';

        const name = document.createElement('h2');
        name.textContent = subject.name_ar || '';

        const stats = document.createElement('p');
        stats.className = 'subject-card-stats';
        const count = subject.question_count || 0;
        stats.textContent = `عدد الأسئلة: ${count}`;

        textWrap.appendChild(name);
        textWrap.appendChild(stats);

        header.appendChild(avatar);
        header.appendChild(textWrap);

        const buttons = document.createElement('div');
        buttons.className = 'subject-card-buttons';

        const bankButton = document.createElement('button');
        bankButton.textContent = 'بنك الأسئلة';
        bankButton.className = 'btn-outline';
        bankButton.addEventListener('click', () => {
          if (window.renderQuestionsView) {
            window.renderQuestionsView(root, subject);
          }
        });

        const startButton = document.createElement('button');
        startButton.textContent = 'بدء المسابقة';
        startButton.className = 'btn-hero';
        startButton.addEventListener('click', async () => {
          if (!window.api || !window.api.competitions || typeof window.api.competitions.startForSubject !== 'function') {
            if (window.showToast) {
              window.showToast('تعذر بدء المسابقة (الواجهة غير متاحة)', 'error');
            }
            return;
          }

          try {
            const result = await window.api.competitions.startForSubject(subject.id, subject.name_ar);
            if (!result || !result.ok) {
              if (window.showToast) {
                window.showToast('تعذر إنشاء سجل المسابقة', 'error');
              }
              return;
            }
            if (window.renderRunCompetitionView) {
              window.renderRunCompetitionView(root, subject, result.id);
            }
          } catch (err) {
            if (window.showToast) {
              window.showToast('حدث خطأ أثناء بدء المسابقة', 'error');
            }
            return;
          }
        });

        buttons.appendChild(bankButton);
        buttons.appendChild(startButton);

        card.appendChild(header);
        card.appendChild(buttons);

        grid.appendChild(card);
      });
    } catch (err) {
      grid.textContent = 'حدث خطأ أثناء تحميل المواد';
    }
  }

  loadSubjects();
};
