const { app, BrowserWindow, Menu, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('تطبيق مسابقات المدارس');
const { registerAuthHandlers } = require('./src/main/ipcAuth');
const { registerCompetitionHandlers } = require('./src/main/ipcCompetitions');
const { registerParticipantHandlers } = require('./src/main/ipcParticipants');
const { registerSubjectHandlers } = require('./src/main/ipcSubjects');
const { registerQuestionHandlers } = require('./src/main/ipcQuestions');
const { registerResultHandlers } = require('./src/main/ipcResults');
const { registerAdminHandlers } = require('./src/main/ipcAdmin');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'تطبيق مسابقات المدارس',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
}

function showAboutDialog() {
  const productName = 'تطبيق مسابقات المدارس';
  const version = app.getVersion();

  const terms = `الشروط والأحكام لتطبيق سينار\n1.      الترخيص والاستخدام\nيمنح مطور تطبيق سينار ترخيصًا محدودًا وغير حصري لاستخدام التطبيق على جهازك الشخصي. التطبيق مصمم للعمل بشكل أوفلاين بالكامل، ولا يُسمح بإعادة بيع أو توزيع أو تعديل التطبيق دون إذن خطي من المطور.\n2.      التحديثات\nيتضمن الترخيص تفعيل التطبيق لأول مرة فقط. بعد أول استخدام، تكون جميع التحديثات المستقبلية خدمات مدفوعة يتم شراؤها بشكل منفصل. يحق للمطور إصدار تحديثات تقنية أو تحسينات، ويحق له تحديد أسعار هذه التحديثات.\n3.      الصيانة والدعم الفني\nالصيانة والدعم الفني للتطبيق ليست مجانية. تُقدّم خدمات الصيانة، وإصلاح المشاكل التقنية، ودعم الاستخدام مقابل رسوم يتم الاتفاق عليها مع المطور.\n4.      جمع البيانات والخصوصية\nالتطبيق يعمل أوفلاين ولا يجمع بيانات شخصية من المستخدم، باستثناء المعلومات التي يقوم المستخدم بإدخالها يدويًا داخل النظام. جميع البيانات تبقى داخل جهاز المستخدم وتحت مسؤوليته الكاملة.\n5.      القيود والمسؤولية\nيتم توفير تطبيق سينار كما هو دون أي ضمانات مباشرة أو ضمنية. لا يتحمل المطور أي مسؤولية عن أي خسائر ناتجة عن الاستخدام، أو تلف البيانات، أو الأعطال الناتجة عن سوء الاستخدام. المستخدم مسؤول عن حفظ بياناته والنسخ الاحتياطي.\n6.      إنهاء الاستخدام\nيحق للمطور إيقاف الترخيص في حال خالف المستخدم هذه الشروط. ويمكن للمستخدم حذف التطبيق في أي وقت، ولكن لا يترتب على ذلك أي استرجاع للمبالغ المدفوعة.\n7.      القانون المعمول به\nتخضع هذه الشروط لقوانين البلد الذي يعمل به المطور، ويتم حل أي نزاع عبر الجهات القضائية المختصة.`;

  const iconPngPath = path.join(__dirname, 'build', 'icon.png');
  let icon;
  if (fs.existsSync(iconPngPath)) {
    icon = nativeImage.createFromPath(iconPngPath);
  }

  dialog.showMessageBox({
    type: 'info',
    title: productName,
    message: `${productName} - v${version}`,
    detail: terms,
    icon,
    buttons: ['موافق']
  });
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';
  const productName = 'تطبيق مسابقات المدارس';

  const template = [];

  if (isMac) {
    template.push({
      label: productName,
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => showAboutDialog()
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  template.push(
    {
      label: 'ملف',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'تحرير',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول تطبيق مسابقات المدارس',
          click: () => showAboutDialog()
        }
      ]
    }
  );

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  require('./src/db/db');
  registerAuthHandlers();
  registerCompetitionHandlers();
  registerParticipantHandlers();
  registerSubjectHandlers();
  registerQuestionHandlers();
  registerResultHandlers();
  registerAdminHandlers();
  createWindow();
  createAppMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
