window.renderLoginView = function renderLoginView(root) {
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'view view-login';

  const title = document.createElement('h1');
  title.textContent = 'تطبيق المسابقات';

  const subtitle = document.createElement('p');
  subtitle.className = 'login-subtitle';
  subtitle.textContent = 'منصة لإدارة المسابقات المدرسية بشكل بسيط وسريع';

  const usernameLabel = document.createElement('label');
  usernameLabel.textContent = 'اسم المستخدم';
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';

  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'كلمة المرور';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';

  const loginButton = document.createElement('button');
  loginButton.textContent = 'دخول';
  loginButton.className = 'btn-hero';

  const errorMessage = document.createElement('div');
  errorMessage.className = 'login-error';
  errorMessage.style.color = 'red';
  errorMessage.style.marginTop = '8px';

  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(usernameLabel);
  container.appendChild(usernameInput);
  container.appendChild(passwordLabel);
  container.appendChild(passwordInput);
  container.appendChild(loginButton);
  container.appendChild(errorMessage);

  root.appendChild(container);

  async function handleLogin() {
    errorMessage.textContent = '';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      errorMessage.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
      return;
    }

    if (!window.api || !window.api.auth || typeof window.api.auth.login !== 'function') {
      errorMessage.textContent = 'واجهة تسجيل الدخول غير متاحة';
      return;
    }

    try {
      const result = await window.api.auth.login({ username, password });

      if (!result || !result.ok) {
        errorMessage.textContent = 'بيانات تسجيل الدخول غير صحيحة';
        return;
      }

      if (window.renderCompetitionsView) {
        window.renderCompetitionsView(root);
      } else {
        root.innerHTML = '';
        const success = document.createElement('div');
        success.textContent = 'تم تسجيل الدخول بنجاح';
        root.appendChild(success);
      }
    } catch (err) {
      errorMessage.textContent = 'حدث خطأ أثناء تسجيل الدخول';
    }
  }

  loginButton.addEventListener('click', () => {
    handleLogin();
  });

  passwordInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  });
};
