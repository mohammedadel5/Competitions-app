(function () {
  let correctSound;
  let wrongSound;
  let soundsInitialized = false;
  let soundsFailed = false;

  let startScreenSound;
  let runStartSound;
  let extraSoundsInitialized = false;
  let extraSoundsFailed = false;

  let timerAudioCtx;

  function initAnswerSounds() {
    if (soundsInitialized || soundsFailed) {
      return;
    }

    try {
      correctSound = new Audio('../assets/sounds/correct.mp3');
      wrongSound = new Audio('../assets/sounds/wrong.mp3');
      soundsInitialized = true;
    } catch (err) {
      soundsFailed = true;
    }
  }

  function playTimerTick(isWarning) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      if (!timerAudioCtx) {
        timerAudioCtx = new AudioCtx();
      }

      const ctx = timerAudioCtx;
      const now = ctx.currentTime;

      function scheduleTick(startOffset, fast) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = fast ? 1200 : 950;
        gain.gain.value = fast ? 0.16 : 0.12;

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + startOffset;
        const duration = fast ? 0.09 : 0.15;
        osc.start(startTime);
        osc.stop(startTime + duration);
      }

      if (isWarning) {
        // Two quick ticks to feel more urgent in the last seconds
        scheduleTick(0, true);
        scheduleTick(0.18, true);
      } else {
        // Single regular tick for normal seconds
        scheduleTick(0, false);
      }
    } catch (err) {
    }
  }

  function initExtraSounds() {
    if (extraSoundsInitialized || extraSoundsFailed) {
      return;
    }

    try {
      startScreenSound = new Audio('../assets/sounds/start-screen.mp3');
      runStartSound = new Audio('../assets/sounds/run-start.mp3');
      extraSoundsInitialized = true;
    } catch (err) {
      extraSoundsFailed = true;
    }
  }

  function playAnswerSound(isCorrect) {
    try {
      initAnswerSounds();
      if (!soundsInitialized || !correctSound || !wrongSound) {
        return;
      }

      const sound = isCorrect ? correctSound : wrongSound;
      sound.currentTime = 0;
      const promise = sound.play();
      if (promise && typeof promise.then === 'function') {
        promise.catch(() => {
        });
      }
    } catch (err) {
    }
  }

  function playStartScreenSound() {
    try {
      initExtraSounds();
      if (!extraSoundsInitialized || !startScreenSound) {
        return;
      }
      startScreenSound.currentTime = 0;
      const promise = startScreenSound.play();
      if (promise && typeof promise.then === 'function') {
        promise.catch(() => {
        });
      }
    } catch (err) {
    }
  }

  function playRunStartSound() {
    try {
      initExtraSounds();
      if (!extraSoundsInitialized || !runStartSound) {
        return;
      }
      runStartSound.currentTime = 0;
      const promise = runStartSound.play();
      if (promise && typeof promise.then === 'function') {
        promise.catch(() => {
        });
      }
    } catch (err) {
    }
  }

  function ensureContainers() {
    let tc = document.getElementById('toast-container');
    if (!tc) {
      tc = document.createElement('div');
      tc.id = 'toast-container';
      document.body.appendChild(tc);
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
  window.playAnswerSound = playAnswerSound;
  window.playStartScreenSound = playStartScreenSound;
  window.playRunStartSound = playRunStartSound;
  window.playTimerTick = playTimerTick;
})();
