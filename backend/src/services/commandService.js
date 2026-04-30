import { exec } from 'child_process';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { findContact, addContact, getWhatsAppLink, listContacts } from './contactService.js';
import { getFirstYouTubeVideo } from './youtubeService.js';

// --- In-memory reminders & timers ---
const activeReminders = new Map();
const activeTimers = new Map();
let reminderIdCounter = 1;

/**
 * Parse command blocks from AI response
 */
export function parseCommand(response) {
  const commandRegex = /```command\s*\n([\s\S]*?)\n```/;
  const match = response.match(commandRegex);

  if (!match) {
    return { command: null, spokenText: response };
  }

  try {
    const command = JSON.parse(match[1].trim());
    const spokenText = response.replace(commandRegex, '').trim();
    return { command, spokenText: spokenText || command.description || 'Done!' };
  } catch (err) {
    console.error('❌ Failed to parse command JSON:', err.message);
    return { command: null, spokenText: response };
  }
}

/**
 * Execute a system command
 */
export async function executeCommand(command) {
  if (!command || !command.type) {
    return { success: false, message: 'Invalid command' };
  }

  console.log(`⚡ Executing command: ${command.type}`, JSON.stringify(command));

  try {
    switch (command.type) {
      // --- File System ---
      case 'CREATE_FOLDER':
        return await handleCreateFolder(command);

      // --- Apps ---
      case 'OPEN_APP':
        return await handleOpenApp(command);
      case 'OPEN_URL':
        return { success: true, message: 'URL command sent to frontend', frontendAction: true };
      case 'SEARCH_WEB':
        return { success: true, message: 'Search command sent to frontend', frontendAction: true };

      // --- WhatsApp & Contacts ---
      case 'SEND_WHATSAPP':
        return await handleWhatsApp(command);
      case 'SAVE_CONTACT':
        return handleSaveContact(command);
      case 'LIST_CONTACTS':
        return handleListContacts();

      // --- Email ---
      case 'SEND_EMAIL':
        return handleSendEmail(command);

      // --- System Controls ---
      case 'SHUTDOWN':
        return await handleSystemPower(command);
      case 'RESTART':
        return await handleSystemPower(command);
      case 'LOCK':
        return await handleLockScreen();
      case 'SLEEP':
        return await handleSleep();

      // --- Volume ---
      case 'VOLUME_UP':
        return await handleVolume('up', command.amount || 10);
      case 'VOLUME_DOWN':
        return await handleVolume('down', command.amount || 10);
      case 'VOLUME_MUTE':
        return await handleVolume('mute');
      case 'VOLUME_SET':
        return await handleVolume('set', command.level || 50);

      // --- Brightness ---
      case 'BRIGHTNESS_UP':
        return await handleBrightness('up', command.amount || 20);
      case 'BRIGHTNESS_DOWN':
        return await handleBrightness('down', command.amount || 20);
      case 'BRIGHTNESS_SET':
        return await handleBrightness('set', command.level || 50);

      // --- Screenshot ---
      case 'TAKE_SCREENSHOT':
        return await handleScreenshot();

      // --- Timers & Reminders ---
      case 'SET_TIMER':
        return handleSetTimer(command);
      case 'SET_REMINDER':
        return handleSetReminder(command);
      case 'LIST_REMINDERS':
        return handleListReminders();
      case 'CANCEL_REMINDER':
        return handleCancelReminder(command);

      // --- System Info ---
      case 'SYSTEM_INFO':
        return handleSystemInfo(command);

      // --- Clipboard ---
      case 'COPY_TEXT':
        return await handleClipboard('copy', command.text);

      // --- Play Music ---
      case 'PLAY_MUSIC':
        return await handlePlayMusic(command);

      // --- WiFi ---
      case 'WIFI_STATUS':
        return await handleWifiStatus();

      // --- Task Manager (kill process) ---
      case 'KILL_PROCESS':
        return await handleKillProcess(command);

      default:
        return { success: false, message: `Unknown command type: ${command.type}` };
    }
  } catch (err) {
    console.error(`❌ Command execution error:`, err.message);
    return { success: false, message: err.message };
  }
}

// ===========================
// WhatsApp & Contacts
// ===========================

async function handleWhatsApp(command) {
  const contactName = command.contact || command.name || '';
  const message = command.message || '';

  if (!contactName) {
    return { success: false, message: 'Contact name nahi mila.' };
  }

  const contact = findContact(contactName);

  if (!contact) {
    return {
      success: false,
      message: `"${contactName}" contacts mein nahi hai. Pehle contact save karo: "Save contact ${contactName} phone 919876543210"`,
      needsPhone: true,
    };
  }

  if (!contact.phone) {
    return {
      success: false,
      message: `"${contact.name}" ka phone number nahi hai. Add karo: "Save contact ${contact.name} phone 919876543210"`,
      needsPhone: true,
    };
  }

  const url = getWhatsAppLink(contact.phone, message);
  console.log(`📱 WhatsApp: ${contact.name} (${contact.phone}) - "${message}"`);

  return {
    success: true,
    message: `WhatsApp khol raha hoon ${contact.name} ke liye!`,
    frontendAction: true,
    overrideCommand: { type: 'OPEN_URL', url, description: `WhatsApp to ${contact.name}` },
  };
}

function handleSaveContact(command) {
  const name = command.name || '';
  const phone = command.phone || '';
  if (!name) return { success: false, message: 'Contact name batao.' };
  if (!phone) return { success: false, message: 'Phone number batao (jaise 919876543210).' };
  addContact(name, phone, command.aliases || []);
  return { success: true, message: `Contact saved: ${name} (${phone})` };
}

function handleListContacts() {
  const contacts = listContacts();
  if (contacts.length === 0) return { success: true, message: 'Koi contacts saved nahi hain.' };
  const list = contacts.map(c => `${c.name}${c.phone ? ` (${c.phone})` : ' (no phone)'}`).join(', ');
  return { success: true, message: `Saved contacts: ${list}` };
}

// ===========================
// Email
// ===========================

function handleSendEmail(command) {
  const to = command.to || command.email || '';
  const subject = command.subject || '';
  const body = command.body || command.message || '';

  if (!to) return { success: false, message: 'Email address batao.' };

  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {
    success: true,
    message: `Email app khol raha hoon!`,
    frontendAction: true,
    overrideCommand: { type: 'OPEN_URL', url: mailto, description: `Email to ${to}` },
  };
}

// ===========================
// File System
// ===========================

async function handleCreateFolder(command) {
  let folderPath = command.path;
  if (!folderPath) {
    const home = process.env.USERPROFILE || process.env.HOME;
    folderPath = path.join(home, 'Desktop', command.name || 'NewFolder');
  }
  folderPath = path.resolve(folderPath);
  if (existsSync(folderPath)) return { success: true, message: `Folder pehle se hai: ${folderPath}` };
  await mkdir(folderPath, { recursive: true });
  console.log(`📁 Created folder: ${folderPath}`);
  return { success: true, message: `Folder ban gaya: ${folderPath}` };
}

// ===========================
// Apps
// ===========================

async function handleOpenApp(command) {
  const appName = (command.app || '').toLowerCase();
  const appMap = {
    'notepad': 'notepad', 'calculator': 'calc', 'calc': 'calc',
    'paint': 'mspaint', 'explorer': 'explorer', 'file explorer': 'explorer',
    'cmd': 'cmd', 'command prompt': 'cmd', 'terminal': 'wt',
    'powershell': 'powershell', 'task manager': 'taskmgr',
    'settings': 'ms-settings:', 'vs code': 'code', 'vscode': 'code',
    'chrome': 'chrome', 'edge': 'msedge', 'firefox': 'firefox',
    'word': 'winword', 'excel': 'excel', 'powerpoint': 'powerpnt',
    'spotify': 'spotify:', 'whatsapp': 'whatsapp:', 'telegram': 'telegram:',
    'discord': 'discord:', 'slack': 'slack:', 'teams': 'msteams:',
    'snipping tool': 'snippingtool', 'clock': 'ms-clock:',
    'camera': 'microsoft.windows.camera:', 'photos': 'ms-photos:',
    'maps': 'bingmaps:', 'store': 'ms-windows-store:',
    'control panel': 'control', 'device manager': 'devmgmt.msc',
    'disk management': 'diskmgmt.msc', 'event viewer': 'eventvwr.msc',
  };
  const cmd = appMap[appName];
  if (!cmd) return { success: false, message: `App nahi mili: ${appName}` };

  return new Promise((resolve) => {
    exec(`start "" ${cmd}`, { shell: 'cmd.exe' }, (error) => {
      if (error) {
        console.error(`❌ Failed to open ${appName}:`, error.message);
        resolve({ success: false, message: `${appName} nahi khul paya` });
      } else {
        console.log(`🚀 Opened: ${appName}`);
        resolve({ success: true, message: `${appName} khol diya` });
      }
    });
  });
}

// ===========================
// System Power Controls
// ===========================

async function handleSystemPower(command) {
  const type = command.type;
  const delay = command.delay || 0;

  // Safety: require confirmation
  if (type === 'SHUTDOWN') {
    return new Promise((resolve) => {
      exec(`shutdown /s /t ${delay}`, { shell: 'cmd.exe' }, (error) => {
        if (error) resolve({ success: false, message: 'Shutdown fail ho gaya.' });
        else resolve({ success: true, message: `Computer ${delay > 0 ? `${delay} seconds mein` : 'ab'} shutdown ho jayega.` });
      });
    });
  }

  if (type === 'RESTART') {
    return new Promise((resolve) => {
      exec(`shutdown /r /t ${delay}`, { shell: 'cmd.exe' }, (error) => {
        if (error) resolve({ success: false, message: 'Restart fail ho gaya.' });
        else resolve({ success: true, message: `Computer ${delay > 0 ? `${delay} seconds mein` : 'ab'} restart ho jayega.` });
      });
    });
  }

  return { success: false, message: 'Unknown power command' };
}

async function handleLockScreen() {
  return new Promise((resolve) => {
    exec('rundll32.exe user32.dll,LockWorkStation', { shell: 'cmd.exe' }, (error) => {
      if (error) resolve({ success: false, message: 'Lock nahi ho paya.' });
      else resolve({ success: true, message: 'Computer lock ho gaya.' });
    });
  });
}

async function handleSleep() {
  return new Promise((resolve) => {
    exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0', { shell: 'cmd.exe' }, (error) => {
      if (error) resolve({ success: false, message: 'Sleep mode fail.' });
      else resolve({ success: true, message: 'Computer sleep mode mein ja raha hai.' });
    });
  });
}

// ===========================
// Volume Control (Windows)
// ===========================

async function handleVolume(action, amount = 10) {
  // Uses PowerShell + AudioDeviceCmdlets or nircmd
  const commands = {
    'up': `powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]175)"`.repeat(Math.ceil(amount / 2)),
    'down': `powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"`.repeat(Math.ceil(amount / 2)),
    'mute': `powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"`,
  };

  // Simple approach: use PowerShell to adjust volume
  const psScript = action === 'mute'
    ? `(New-Object -ComObject WScript.Shell).SendKeys([char]173)`
    : action === 'up'
    ? `$wshShell = New-Object -ComObject WScript.Shell; 1..${Math.ceil(amount / 2)} | ForEach-Object { $wshShell.SendKeys([char]175) }`
    : action === 'down'
    ? `$wshShell = New-Object -ComObject WScript.Shell; 1..${Math.ceil(amount / 2)} | ForEach-Object { $wshShell.SendKeys([char]174) }`
    : '';

  if (!psScript) return { success: false, message: 'Invalid volume action' };

  return new Promise((resolve) => {
    exec(`powershell -Command "${psScript}"`, (error) => {
      if (error) resolve({ success: false, message: `Volume ${action} fail.` });
      else resolve({ success: true, message: action === 'mute' ? 'Volume mute kar diya.' : `Volume ${action === 'up' ? 'badha' : 'kam'} diya.` });
    });
  });
}

// ===========================
// Brightness Control
// ===========================

async function handleBrightness(action, amount = 20) {
  const psScript = action === 'set'
    ? `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${amount})`
    : action === 'up'
    ? `$cur = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness; $new = [Math]::Min(100, $cur + ${amount}); (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $new)`
    : `$cur = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness; $new = [Math]::Max(0, $cur - ${amount}); (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $new)`;

  return new Promise((resolve) => {
    exec(`powershell -Command "${psScript}"`, (error) => {
      if (error) resolve({ success: false, message: 'Brightness change nahi ho paya. Desktop pe ye feature laptops pe kaam karta hai.' });
      else resolve({ success: true, message: `Brightness ${action === 'up' ? 'badha' : action === 'down' ? 'kam' : `${amount}% pe set`} diya.` });
    });
  });
}

// ===========================
// Screenshot
// ===========================

async function handleScreenshot() {
  const screenshotPath = path.join(process.env.USERPROFILE || '', 'Desktop', `screenshot_${Date.now()}.png`);

  return new Promise((resolve) => {
    // Use PowerShell to take screenshot
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}')
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    exec(`powershell -Command "${ps}"`, (error) => {
      if (error) resolve({ success: false, message: 'Screenshot nahi le paya.' });
      else {
        console.log(`📸 Screenshot: ${screenshotPath}`);
        resolve({ success: true, message: `Screenshot Desktop pe save ho gaya: ${path.basename(screenshotPath)}` });
      }
    });
  });
}

// ===========================
// Timers & Reminders
// ===========================

function handleSetTimer(command) {
  const seconds = command.seconds || command.minutes * 60 || command.duration || 60;
  const label = command.label || 'Timer';

  const id = reminderIdCounter++;

  const timer = setTimeout(() => {
    console.log(`⏰ TIMER: ${label} completed!`);
    activeTimers.delete(id);
    // The frontend will be notified via the next health check or message
  }, seconds * 1000);

  activeTimers.set(id, { label, seconds, startTime: Date.now(), timer });

  const displayTime = seconds >= 60
    ? `${Math.floor(seconds / 60)} minute${seconds >= 120 ? 's' : ''} ${seconds % 60 > 0 ? `${seconds % 60} seconds` : ''}`
    : `${seconds} seconds`;

  return { success: true, message: `Timer set: ${label} — ${displayTime}` };
}

function handleSetReminder(command) {
  const message = command.message || command.text || 'Reminder!';
  const seconds = command.seconds || (command.minutes || 5) * 60;

  const id = reminderIdCounter++;

  const timer = setTimeout(() => {
    console.log(`🔔 REMINDER: ${message}`);
    activeReminders.delete(id);
  }, seconds * 1000);

  activeReminders.set(id, { message, seconds, startTime: Date.now(), timer });

  return { success: true, message: `Reminder set: "${message}" — ${Math.floor(seconds / 60)} minute(s) mein yaad dila dunga.` };
}

function handleListReminders() {
  const reminders = [...activeReminders.entries()].map(([id, r]) => {
    const elapsed = Math.floor((Date.now() - r.startTime) / 1000);
    const remaining = Math.max(0, r.seconds - elapsed);
    return `#${id}: "${r.message}" — ${Math.floor(remaining / 60)}m ${remaining % 60}s left`;
  });

  const timers = [...activeTimers.entries()].map(([id, t]) => {
    const elapsed = Math.floor((Date.now() - t.startTime) / 1000);
    const remaining = Math.max(0, t.seconds - elapsed);
    return `Timer #${id}: ${t.label} — ${Math.floor(remaining / 60)}m ${remaining % 60}s left`;
  });

  const all = [...reminders, ...timers];
  if (all.length === 0) return { success: true, message: 'Koi active timer ya reminder nahi hai.' };

  return { success: true, message: `Active: ${all.join('; ')}` };
}

function handleCancelReminder(command) {
  const id = command.id || command.reminderId;
  if (activeReminders.has(id)) {
    clearTimeout(activeReminders.get(id).timer);
    activeReminders.delete(id);
    return { success: true, message: `Reminder #${id} cancel ho gaya.` };
  }
  if (activeTimers.has(id)) {
    clearTimeout(activeTimers.get(id).timer);
    activeTimers.delete(id);
    return { success: true, message: `Timer #${id} cancel ho gaya.` };
  }
  return { success: false, message: `Reminder/Timer #${id} nahi mila.` };
}

// ===========================
// System Info
// ===========================

function handleSystemInfo(command) {
  const infoType = (command.info || 'all').toLowerCase();

  const info = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length + ' cores',
    totalMemory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
    freeMemory: (os.freemem() / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
    uptime: formatUptime(os.uptime()),
    user: os.userInfo().username,
    osVersion: os.release(),
    currentTime: new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' }),
  };

  if (infoType === 'time' || infoType === 'date') {
    return { success: true, message: `Abhi time hai: ${info.currentTime}` };
  }
  if (infoType === 'memory' || infoType === 'ram') {
    return { success: true, message: `Total RAM: ${info.totalMemory}, Free: ${info.freeMemory}` };
  }
  if (infoType === 'battery') {
    return getBatteryInfo();
  }

  const summary = `Computer: ${info.hostname}, OS: Windows ${info.osVersion}, CPU: ${info.cpus}, RAM: ${info.totalMemory} (${info.freeMemory} free), Uptime: ${info.uptime}, User: ${info.user}`;
  return { success: true, message: summary };
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} ghante ${m} minute`;
}

function getBatteryInfo() {
  // Battery info via PowerShell — returns synchronously with exec
  return new Promise((resolve) => {
    exec('powershell -Command "(Get-WmiObject Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json)"', (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ success: true, message: 'Battery info nahi mil paya. Ye desktop hai ya battery driver nahi hai.' });
        return;
      }
      try {
        const data = JSON.parse(stdout);
        const charge = data.EstimatedChargeRemaining;
        const status = data.BatteryStatus === 2 ? 'Charging' : 'Not Charging';
        resolve({ success: true, message: `Battery: ${charge}%, Status: ${status}` });
      } catch {
        resolve({ success: true, message: 'Battery info parse nahi ho paya.' });
      }
    });
  });
}

// ===========================
// Clipboard
// ===========================

async function handleClipboard(action, text) {
  if (action === 'copy' && text) {
    return new Promise((resolve) => {
      exec(`powershell -Command "Set-Clipboard -Value '${text.replace(/'/g, "''")}';"`, (error) => {
        if (error) resolve({ success: false, message: 'Copy nahi ho paya.' });
        else resolve({ success: true, message: 'Text clipboard pe copy ho gaya!' });
      });
    });
  }
  return { success: false, message: 'Clipboard operation fail.' };
}

// ===========================
// Play Music (YouTube — Direct Play)
// ===========================

async function handlePlayMusic(command) {
  const query = command.query || command.song || command.artist || 'bollywood hits';

  // Scrape YouTube to find the first video and get a direct play link
  const url = await getFirstYouTubeVideo(query);
  console.log(`🎵 Play Music: "${query}" → ${url}`);

  return {
    success: true,
    message: `YouTube pe "${query}" play kar raha hoon!`,
    frontendAction: true,
    overrideCommand: { type: 'OPEN_URL', url, description: `Playing ${query}` },
  };
}

// ===========================
// WiFi Status
// ===========================

async function handleWifiStatus() {
  return new Promise((resolve) => {
    exec('netsh wlan show interfaces', { shell: 'cmd.exe' }, (error, stdout) => {
      if (error) {
        resolve({ success: false, message: 'WiFi info nahi mil paya.' });
        return;
      }
      const ssidMatch = stdout.match(/SSID\s+:\s+(.+)/);
      const signalMatch = stdout.match(/Signal\s+:\s+(\d+)%/);
      const stateMatch = stdout.match(/State\s+:\s+(.+)/);

      const ssid = ssidMatch ? ssidMatch[1].trim() : 'Unknown';
      const signal = signalMatch ? signalMatch[1] + '%' : 'Unknown';
      const state = stateMatch ? stateMatch[1].trim() : 'Unknown';

      resolve({ success: true, message: `WiFi: ${ssid}, Signal: ${signal}, State: ${state}` });
    });
  });
}

// ===========================
// Kill Process
// ===========================

async function handleKillProcess(command) {
  const processName = command.process || command.name || '';
  if (!processName) return { success: false, message: 'Process name batao.' };

  return new Promise((resolve) => {
    exec(`taskkill /IM "${processName}" /F`, { shell: 'cmd.exe' }, (error) => {
      if (error) resolve({ success: false, message: `${processName} band nahi ho paya.` });
      else resolve({ success: true, message: `${processName} band kar diya.` });
    });
  });
}
