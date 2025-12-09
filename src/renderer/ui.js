(function () {
  function ensureContainers() {
    let tc = document.getElementById('toast-container');
    if (!tc) {
      tc = document.createElement('div');
      tc.id = 'toast-container';
      document.body.appendChild(tc);
    }

	function showAnswerDialog(isCorrect) {
		ensureContainers();
		const modal = document.getElementById('answer-modal');
		if (!modal) {
			return Promise.resolve();
		}
		const emojiEl = modal.querySelector('.am-emoji');
		const msgEl = modal.querySelector('.am-message');
		const btnOk = modal.querySelector('.am-ok');
		const backdrop = modal.querySelector('[data-role="backdrop"]');

		modal.classList.remove('answer-correct', 'answer-wrong');
		if (isCorrect) {
			modal.classList.add('answer-correct');
			emojiEl.textContent = '🎉';
			msgEl.textContent = 'إجابة صحيحة! أحسنت 👏';
		} else {
			modal.classList.add('answer-wrong');
			emojiEl.textContent = '❌';
			msgEl.textContent = 'إجابة غير صحيحة. تم تمييز الإجابة الصحيحة باللون الأخضر.';
		}

		modal.style.display = 'block';
		return new Promise((resolve) => {
			function cleanup() {
				btnOk.removeEventListener('click', onOk);
				backdrop.removeEventListener('click', onOk);
				modal.style.display = 'none';
				resolve();
			}
			function onOk() {
				cleanup();
			}
			btnOk.addEventListener('click', onOk);
			backdrop.addEventListener('click', onOk);
		});
	}
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.innerHTML = `
        <div class="cm-backdrop" data-role="backdrop"></div>
        <div class="cm-dialog">
          <div class="cm-message"></div>
          <div class="cm-actions">
            <button class="cm-yes">تأكيد</button>
            <button class="cm-no">إلغاء</button>
          </div>
        </div>`;
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }

	let answerModal = document.getElementById('answer-modal');
	if (!answerModal) {
		answerModal = document.createElement('div');
		answerModal.id = 'answer-modal';
		answerModal.innerHTML = `
			<div class="am-backdrop" data-role="backdrop"></div>
			<div class="am-dialog">
				<div class="am-emoji"></div>
				<div class="am-message"></div>
				<div class="am-actions">
					<button class="am-ok">حسناً</button>
				</div>
			</div>`;
		answerModal.style.display = 'none';
		document.body.appendChild(answerModal);
	}
  }

  function showToast(message, type = 'info', timeout = 3000) {
    ensureContainers();
    const tc = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    tc.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    const to = setTimeout(() => dismiss(), timeout);
    function dismiss() {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 300);
      clearTimeout(to);
    }
    el.addEventListener('click', dismiss);
  }

  function confirmDialog(message) {
    ensureContainers();
    const modal = document.getElementById('confirm-modal');
    const msg = modal.querySelector('.cm-message');
    const btnYes = modal.querySelector('.cm-yes');
    const btnNo = modal.querySelector('.cm-no');
    msg.textContent = message;
    modal.style.display = 'block';
    return new Promise((resolve) => {
      function cleanup(result) {
        btnYes.removeEventListener('click', onYes);
        btnNo.removeEventListener('click', onNo);
        modal.querySelector('[data-role="backdrop"]').removeEventListener('click', onNo);
        modal.style.display = 'none';
        resolve(result);
      }
      function onYes() { cleanup(true); }
      function onNo() { cleanup(false); }
      btnYes.addEventListener('click', onYes);
      btnNo.addEventListener('click', onNo);
      modal.querySelector('[data-role="backdrop"]').addEventListener('click', onNo);
    });
  }

  window.ensureUIContainers = ensureContainers;
  window.showToast = showToast;
  window.confirmDialog = confirmDialog;
  window.showAnswerDialog = showAnswerDialog;
})();
