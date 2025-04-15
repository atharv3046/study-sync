// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const playlistUrlInput = document.querySelector('input[placeholder="https://www.youtube.com/playlist?list=..."]');
const fetchButton = document.getElementById('generatePlanButton');
const daysInput = document.getElementById('daysInput');
const hoursInput = document.getElementById('hoursInput');
const studyHoursRange = document.getElementById('studyHoursRange');
const studyHoursOutput = document.getElementById('studyHoursOutput');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const videoItemsContainer = document.getElementById('videoItemsContainer');
const pomodoroStartBtn = document.getElementById('pomodoroStartBtn');
const pomodoroResetBtn = document.getElementById('pomodoroResetBtn');
const pomodoroTime = document.getElementById('pomodoroTime');
const pomodoroStatus = document.getElementById('pomodoroStatus');
const savePlanBtn = document.getElementById('savePlanBtn');
const sharePlanBtn = document.getElementById('sharePlanBtn');
const notesTextarea = document.getElementById('notesTextarea');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const chatButton = document.getElementById('chatButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const submitAuthBtn = document.getElementById('submitAuthBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const mainContent = document.getElementById('mainContent');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const googleSignInContainer = document.getElementById('googleSignInContainer');

// State
let darkMode = true;
let playlistData = null;
let watchedVideos = new Set();
let pomodoroInterval = null;
let timerSeconds = 25 * 60;
let isPomodoroRunning = false;
let isStudyTime = true;
let isAuthenticated = !!localStorage.getItem('user');

// YouTube API Key - Replace with your own key or move to a backend
const YOUTUBE_API_KEY = 'AIzaSyDPkxHAOn6qIKViBI3pHK2u4aTzQE8pgfc'; // Replace with a valid key

// Google Client ID - Replace with your own
const GOOGLE_CLIENT_ID = '267992965998-2roctmfodhiddkrcidb989e6pnr0iogq.app.googleusercontent.com'; // Replace with a valid client ID
// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Google Sign-In
  initializeGoogleSignIn();

  // Theme Toggle
  themeToggle.checked = darkMode;
  themeToggle.addEventListener('change', toggleTheme);

  // Custom Radio Buttons
  setupRadioButtons();

  // Custom Checkboxes
  setupCheckboxes();

  // Video Checkboxes and Redirection
  setupVideoHandlers();

  // Range Input for Study Hours
  setupStudyHoursRange();

  // Fetch Button
  fetchButton.addEventListener('click', fetchPlaylist);

  // Pomodoro Timer
  setupPomodoroTimer();

  // Save Plan
  savePlanBtn.addEventListener('click', savePlan);

  // Share Plan
  sharePlanBtn.addEventListener('click', sharePlan);

  // Save Notes
  saveNotesBtn.addEventListener('click', saveNotes);

  // Chat Button
  chatButton.addEventListener('click', () => alert('Chat feature coming soon!'));

  // Load Saved Data
  loadSavedData();

  // Authentication
  loginBtn.addEventListener('click', () => showAuthModal('Login'));
  signupBtn.addEventListener('click', () => showAuthModal('Sign Up'));
  logoutBtn.addEventListener('click', logout);
  authForm.addEventListener('submit', handleAuth);
  closeModalBtn.addEventListener('click', () => authModal.classList.add('hidden'));

  checkAuthStatus();
});

// Initialize Google Sign-In
function initializeGoogleSignIn() {
  if (!window.google) {
    console.error('Google Sign-In library not loaded');
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleSignIn,
    ux_mode: 'popup',
    context: 'signin'
  });

  google.accounts.id.renderButton(
    googleSignInContainer,
    {
      type: 'standard',
      theme: 'filled_blue',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '300'
    }
  );
}

// Handle Google Sign-In
function handleGoogleSignIn(response) {
  const { credential } = response;
  
  // Decode the JWT to get user info (client-side only, in production verify on backend)
  const payload = JSON.parse(atob(credential.split('.')[1]));
  
  // Create a user account with Google data
  const username = payload.email.split('@')[0] + '_google';
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (!users[username]) {
    // Create a new user with Google auth
    users[username] = 'google_auth'; // Special marker for Google-authenticated users
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  // Log the user in
  localStorage.setItem('user', username);
  localStorage.setItem('userEmail', payload.email);
  localStorage.setItem('userName', payload.name || username);
  localStorage.setItem('userPicture', payload.picture || '');
  
  isAuthenticated = true;
  showMessage('Google login successful!', 'success');
  authModal.classList.add('hidden');
  checkAuthStatus();
}

// Update User Profile in UI
function updateUserProfile() {
  if (!isAuthenticated) return;
  
  const email = localStorage.getItem('userEmail');
  const name = localStorage.getItem('userName');
  const picture = localStorage.getItem('userPicture');
  
  if (name || email) {
    userProfile.classList.remove('hidden');
    userName.textContent = name || email.split('@')[0];
    
    if (picture) {
      userAvatar.src = picture;
    } else {
      userAvatar.src = 'https://www.gravatar.com/avatar/?d=mp';
    }
    
    loginBtn.classList.add('hidden');
    signupBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  }
}

// Check Authentication Status
function checkAuthStatus() {
  isAuthenticated = !!localStorage.getItem('user');
  
  if (isAuthenticated) {
    updateUserProfile();
    mainContent.classList.remove('hidden');
  } else {
    userProfile.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    signupBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    mainContent.classList.add('hidden');
    
    // Clear Google auth data on logout
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
  }
  
  if (!isAuthenticated) {
    updateOverview();
    renderVideoList();
  }
}

// Logout Function
function logout() {
  // Sign out from Google
  if (window.google && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }
  
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPicture');
  isAuthenticated = false;
  playlistData = null;
  watchedVideos.clear();
  updateOverview();
  renderVideoList();
  checkAuthStatus();
  showMessage('Logged out successfully.', 'success');
}

// Theme Toggle
function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode', darkMode);
  document.body.classList.toggle('light-mode', !darkMode);
  localStorage.setItem('darkMode', darkMode);
}

// Setup Radio Buttons
function setupRadioButtons() {
  const radio1 = document.getElementById('radio1');
  const radio2 = document.getElementById('radio2');

  radio1.addEventListener('click', () => {
    radio1.classList.add('checked');
    radio2.classList.remove('checked');
    if (playlistData && isAuthenticated) generateStudyPlan();
  });

  radio2.addEventListener('click', () => {
    radio2.classList.add('checked');
    radio1.classList.remove('checked');
    if (playlistData && isAuthenticated) generateStudyPlan();
  });
}

// Setup Checkboxes
function setupCheckboxes() {
  const checkbox1 = document.getElementById('checkbox1');
  const checkbox2 = document.getElementById('checkbox2');
  checkbox1.addEventListener('click', () => checkbox1.classList.toggle('checked'));
  checkbox2.addEventListener('click', () => checkbox2.classList.toggle('checked'));
}

// Setup Video Handlers
function setupVideoHandlers() {
  videoItemsContainer.addEventListener('click', (e) => {
    const checkbox = e.target.closest('.custom-checkbox');
    if (checkbox && !checkbox.id) {
      handleVideoCheckboxClick(checkbox);
      return;
    }

    const videoElement = e.target.closest('.bg-dark-200.rounded-lg.p-3');
    if (videoElement && isAuthenticated) {
      handleVideoClick(videoElement);
    }
  });
}

function handleVideoCheckboxClick(checkbox) {
  if (!isAuthenticated) {
    showMessage('Please log in to mark videos as watched.', 'error');
    return;
  }
  checkbox.classList.toggle('checked');
  const item = checkbox.closest('.bg-dark-200.rounded-lg.p-3');
  const title = item.querySelector('h4').textContent;
  const videoIndex = parseInt(title.match(/^(\d+)\./)[1]) - 1;

  if (playlistData?.videos?.[videoIndex]) {
    const videoId = playlistData.videos[videoIndex].id;
    if (checkbox.classList.contains('checked')) {
      watchedVideos.add(videoId);
    } else {
      watchedVideos.delete(videoId);
    }
    updateProgress();
    updateAchievements();
    updateStats();
  }
}

function handleVideoClick(videoElement) {
  const title = videoElement.querySelector('h4').textContent;
  const videoIndex = parseInt(title.match(/^(\d+)\./)[1]) - 1;
  if (playlistData?.videos?.[videoIndex]?.id) {
    window.open(`https://www.youtube.com/watch?v=${playlistData.videos[videoIndex].id}`, '_blank');
  }
}

// Setup Study Hours Range
function setupStudyHoursRange() {
  studyHoursRange.addEventListener('input', () => {
    const value = parseFloat(studyHoursRange.value);
    hoursInput.value = value;
    studyHoursOutput.textContent = `${value} hours`;
    if (playlistData && isAuthenticated) generateStudyPlan();
  });
  hoursInput.value = studyHoursRange.value;
  studyHoursOutput.textContent = `${hoursInput.value} hours`;
}

// Setup Pomodoro Timer
function setupPomodoroTimer() {
  pomodoroStartBtn.addEventListener('click', startPomodoro);
  pomodoroResetBtn.addEventListener('click', resetPomodoro);
  loadPomodoroState();
}

// Fetch Playlist with YouTube API
async function fetchPlaylist() {
  if (!isAuthenticated) {
    showMessage('Please log in to fetch a playlist.', 'error');
    return;
  }
  const url = playlistUrlInput.value.trim();
  if (!url) {
    showMessage('Please enter a YouTube playlist URL', 'error');
    return;
  }

  let playlistId;
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('youtube.com')) {
      throw new Error('URL must be from youtube.com');
    }
    playlistId = urlObj.searchParams.get('list');
    if (!playlistId) {
      const pathMatch = urlObj.pathname.match(/\/playlist\/([^/]+)/);
      playlistId = pathMatch ? pathMatch[1] : null;
    }
    if (!playlistId) {
      throw new Error('No playlist ID found in URL');
    }
  } catch (e) {
    showMessage('Invalid YouTube playlist URL', 'error');
    console.error('URL Parsing Error:', e);
    return;
  }

  fetchButton.disabled = true;
  fetchButton.querySelector('#generatePlanText').textContent = 'Loading...';
  loadingOverlay.classList.remove('hidden');

  try {
    let videos = [];
    let nextPageToken = '';
    let totalDuration = 0;

    do {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
      );
      if (!response.ok) throw new Error(`API error: ${response.status} - ${response.statusText}`);
      const data = await response.json();
      console.log('Playlist Items Response:', data);

      const videoIds = data.items.map((item) => item.contentDetails.videoId);
      const durations = await getVideoDurations(videoIds);

      data.items.forEach((item, index) => {
        const videoId = item.contentDetails.videoId;
        const duration = durations[index] || 0;
        if (duration > 0) {
          videos.push({
            id: videoId,
            title: item.snippet.title,
            duration: duration,
            thumbnail: item.snippet.thumbnails?.medium?.url || '',
            watched: watchedVideos.has(videoId),
          });
          totalDuration += duration;
        }
      });

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    if (videos.length === 0) throw new Error('No videos found in playlist');

    // Get playlist title
    const playlistInfo = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
    );
    const playlistInfoData = await playlistInfo.json();
    const playlistTitle = playlistInfoData.items?.[0]?.snippet?.title || videos[0]?.title || 'Untitled Playlist';

    playlistData = {
      title: playlistTitle,
      totalVideos: videos.length,
      totalDuration: totalDuration / 60,
      videos: videos,
    };
    console.log('Fetched Playlist Data:', playlistData);

    updateOverview();
    renderVideoList();
    generateStudyPlan();
    showMessage('Playlist loaded successfully!', 'success');
    localStorage.setItem(`playlist_${url}`, JSON.stringify(playlistData)); // Cache
  } catch (error) {
    console.error('Fetch Error:', error);
    showMessage(`Error loading playlist: ${error.message}`, 'error');
  } finally {
    fetchButton.disabled = false;
    fetchButton.querySelector('#generatePlanText').textContent = 'Generate Study Plan';
    loadingOverlay.classList.add('hidden');
  }
}

// Get Video Durations
async function getVideoDurations(videoIds) {
  if (!videoIds.length) return [];
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
  );
  if (!response.ok) throw new Error('Failed to fetch video durations');
  const data = await response.json();
  return data.items.map((item) => parseYouTubeDuration(item.contentDetails.duration)).filter((d) => !isNaN(d));
}

function parseYouTubeDuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0) * 60;
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0) / 60;
  return hours + minutes + seconds;
}

// Update Overview
function updateOverview(totalHours = playlistData?.totalDuration || 0) {
  if (!playlistData || !isAuthenticated) {
    document.getElementById('playlistTitle').textContent = 'Your Study Plan';
    document.getElementById('playlistSubtitle').textContent = 'Please log in and add a YouTube playlist to get started';
    document.getElementById('totalDuration').textContent = '0 hours';
    document.getElementById('completionDate').textContent = '-';
    document.getElementById('dailyCommitment').textContent = '0 hours/day';
    document.getElementById('totalVideos').textContent = '0 videos';
    document.getElementById('sessionTime').textContent = 'Add a playlist to see schedule';
    document.getElementById('sessionDuration').textContent = '-';
    document.getElementById('scheduleList').innerHTML = '<div class="text-gray-400 text-sm">Add a playlist to see schedule</div>';
    return;
  }

  document.getElementById('playlistTitle').textContent = playlistData.title;
  document.getElementById('playlistSubtitle').textContent = `${playlistData.totalVideos} videos`;

  const mode = document.querySelector('.custom-radio.checked').id === 'radio1' ? 'deadline' : 'daily';
  let dailyHours, completionDays;

  const unwatchedVideos = playlistData.videos.filter((v) => !watchedVideos.has(v.id));
  const remainingDuration = unwatchedVideos.reduce((sum, v) => sum + v.duration, 0) / 60;

  if (mode === 'deadline') {
    completionDays = parseInt(daysInput.value) || 1;
    dailyHours = remainingDuration / completionDays || 0;
  } else {
    dailyHours = parseFloat(hoursInput.value) || 1;
    completionDays = Math.ceil(remainingDuration / dailyHours) || 0;
  }

  document.getElementById('totalDuration').textContent = `${remainingDuration.toFixed(1)} hours`;
  document.getElementById('dailyCommitment').textContent = `${dailyHours.toFixed(1)} hours/day`;

  const today = new Date();
  today.setDate(today.getDate() + completionDays);
  document.getElementById('completionDate').textContent = completionDays > 0 ? today.toLocaleDateString() : '-';

  document.getElementById('totalVideos').textContent = `${playlistData.totalVideos} videos`;

  updateTodaysSchedule(dailyHours);
}

// Update Today's Schedule
function updateTodaysSchedule(dailyHours) {
  if (!playlistData || !isAuthenticated) {
    document.getElementById('sessionTime').textContent = 'Add a playlist to see schedule';
    document.getElementById('sessionDuration').textContent = '-';
    document.getElementById('scheduleList').innerHTML = '<div class="text-gray-400 text-sm">Add a playlist to see schedule</div>';
    return;
  }

  const dailyMinutes = dailyHours * 60;
  let scheduledMinutes = 0;
  const scheduleVideos = [];

  const unwatchedVideos = playlistData.videos.filter((v) => !watchedVideos.has(v.id));
  for (const video of unwatchedVideos) {
    if (scheduledMinutes + video.duration <= dailyMinutes) {
      scheduledMinutes += video.duration;
      scheduleVideos.push(video);
    } else {
      break;
    }
  }

  // Calculate end time in hours and minutes
  const startHour = 8; // Start at 8:00 AM
  const totalMinutes = scheduledMinutes;
  const endHour = Math.floor(startHour + totalMinutes / 60); // Total hours from start
  const endMinutes = Math.round(totalMinutes % 60); // Remaining minutes
  const period = endHour >= 12 ? 'PM' : 'AM';
  const displayEndHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;

  // Format end time
  const endTimeStr = `${displayEndHour}:${endMinutes.toString().padStart(2, '0')} ${period}`;

  document.getElementById('sessionTime').textContent = `Morning Session (8:00 - ${endTimeStr})`;
  document.getElementById('sessionDuration').textContent = `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`;

  const scheduleList = document.getElementById('scheduleList');
  scheduleList.innerHTML = scheduleVideos.length
    ? scheduleVideos
        .map(
          (v, i) => `
        <div class="flex items-center justify-between py-2 border-b border-dark-100">
          <span class="text-sm">${i + 1}. ${v.title}</span>
          <span class="text-xs text-gray-400">${Math.floor(v.duration)}:${Math.round((v.duration % 1) * 60)
            .toString()
            .padStart(2, '0')}</span>
        </div>
      `
        )
        .join('')
    : '<div class="text-gray-400 text-sm">No videos scheduled for today</div>';
}

// Render Video List
function renderVideoList() {
  if (!playlistData || !isAuthenticated) {
    videoItemsContainer.innerHTML = '';
    return;
  }
  videoItemsContainer.innerHTML = '';
  playlistData.videos.forEach((video, index) => {
    const item = document.createElement('div');
    item.className = 'bg-dark-200 rounded-lg p-3 flex items-center hover:bg-dark-100 transition cursor-pointer';
    item.innerHTML = `
      <div class="custom-checkbox ${video.watched ? 'checked' : ''} mr-3" role="checkbox" aria-checked="${video.watched}" tabindex="0"></div>
      <div class="w-24 h-14 bg-dark-100 rounded mr-3 flex-shrink-0 relative">
        <img src="${video.thumbnail}" alt="Video thumbnail" class="w-full h-full object-cover rounded">
        <div class="absolute bottom-1 right-1 bg-black bg-opacity-70 text-xs px-1 rounded">${Math.floor(video.duration)}:${Math.round((video.duration % 1) * 60)
          .toString()
          .padStart(2, '0')}</div>
      </div>
      <div class="flex-grow">
        <h4 class="text-sm font-medium">${index + 1}. ${video.title}</h4>
        <p class="text-xs text-gray-400">${video.watched ? `Completed on ${new Date().toLocaleDateString()}` : 'Not started'}</p>
      </div>
    `;
    videoItemsContainer.appendChild(item);
  });
}

// Generate Study Plan
function generateStudyPlan() {
  if (!playlistData || isNaN(playlistData.totalDuration) || !isAuthenticated) {
    showMessage('Please log in and reload the playlist.', 'error');
    return;
  }

  updateOverview();
  updateProgress();
}

// Update Progress
function updateProgress() {
  if (!playlistData || !isAuthenticated) {
    progressBar.style.width = '0%';
    progressText.textContent = '0/0 videos';
    return;
  }
  const totalVideos = playlistData.totalVideos || 0;
  const watchedCount = Array.from(watchedVideos).filter((id) =>
    playlistData.videos.some((v) => v.id === id)
  ).length;
  const progressPercent = totalVideos > 0 ? (watchedCount / totalVideos) * 100 : 0;
  progressBar.style.width = `${progressPercent}%`;
  progressText.textContent = `${watchedCount}/${totalVideos} videos`;
}

// Start Pomodoro
function startPomodoro() {
  if (!isAuthenticated) {
    showMessage('Please log in to use the Pomodoro timer.', 'error');
    return;
  }
  if (isPomodoroRunning) return;
  isPomodoroRunning = true;
  pomodoroStartBtn.disabled = true;
  pomodoroResetBtn.disabled = false;
  pomodoroStatus.textContent = isStudyTime ? 'Study Session' : 'Next: 5 min break';

  const startTime = Date.now();
  const endTime = startTime + timerSeconds * 1000;

  pomodoroInterval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    pomodoroTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(pomodoroInterval);
      isPomodoroRunning = false;
      isStudyTime = !isStudyTime;
      timerSeconds = isStudyTime ? 25 * 60 : 5 * 60;
      pomodoroStatus.textContent = isStudyTime ? 'Study Session' : 'Next: 5 min break';
      pomodoroStartBtn.disabled = false;
      pomodoroResetBtn.disabled = true;
      alert(isStudyTime ? 'Break over! Start studying.' : 'Session complete! Take a break.');
      trackPomodoroSession();
    }
  }, 100);
}

// Reset Pomodoro
function resetPomodoro() {
  if (!isAuthenticated) {
    showMessage('Please log in to use the Pomodoro timer.', 'error');
    return;
  }
  clearInterval(pomodoroInterval);
  isPomodoroRunning = false;
  isStudyTime = true;
  timerSeconds = 25 * 60;
  pomodoroTime.textContent = '25:00';
  pomodoroStatus.textContent = 'Study Session';
  pomodoroStartBtn.disabled = false;
  pomodoroResetBtn.disabled = true;
}

// Save Plan
function savePlan() {
  if (!isAuthenticated) {
    showMessage('Please log in to save your plan.', 'error');
    return;
  }
  if (!playlistData) {
    showMessage('No plan to save', 'error');
    return;
  }
  const plan = {
    playlistUrl: playlistUrlInput.value,
    mode: document.querySelector('.custom-radio.checked').id === 'radio1' ? 'deadline' : 'daily',
    days: parseInt(daysInput.value),
    hours: parseFloat(hoursInput.value),
    watchedVideos: Array.from(watchedVideos),
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem('studyPlan', JSON.stringify(plan));
  showMessage('Plan saved successfully!', 'success');
}

// Share Plan
function sharePlan() {
  if (!isAuthenticated) {
    showMessage('Please log in to share your plan.', 'error');
    return;
  }
  if (!playlistData) {
    showMessage('No plan to share', 'error');
    return;
  }
  const shareText = `My Study Plan: ${playlistData.title}\nTotal: ${playlistData.totalDuration.toFixed(1)} hours\nProgress: ${watchedVideos.size}/${playlistData.totalVideos} videos`;
  if (navigator.share) {
    navigator.share({ title: 'Study Plan', text: shareText }).catch(() => copyToClipboard(shareText));
  } else {
    copyToClipboard(shareText);
  }
}

// Copy to Clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => showMessage('Copied to clipboard!', 'success'))
      .catch(() => showMessage('Failed to copy to clipboard', 'error'));
  } else {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showMessage('Copied to clipboard!', 'success');
    } catch (e) {
      showMessage('Failed to copy to clipboard', 'error');
    }
  }
}

// Save Notes
function saveNotes() {
  if (!isAuthenticated) {
    showMessage('Please log in to save notes.', 'error');
    return;
  }
  const notes = notesTextarea.value;
  localStorage.setItem('studyNotes', notes);
  showMessage('Notes saved successfully!', 'success');
}

// Load Saved Data
function loadSavedData() {
  const savedPlan = localStorage.getItem('studyPlan');
  if (savedPlan) {
    const plan = JSON.parse(savedPlan);
    playlistUrlInput.value = plan.playlistUrl;
    daysInput.value = plan.days;
    hoursInput.value = plan.hours;
    studyHoursRange.value = plan.hours;
    studyHoursOutput.textContent = `${plan.hours} hours`;
    plan.watchedVideos.forEach((video) => watchedVideos.add(video));
    if (isAuthenticated) {
      updateOverview();
      updateAchievements();
      updateStats();
    }
  }
  const savedNotes = localStorage.getItem('studyNotes');
  if (savedNotes) notesTextarea.value = savedNotes;
}

// Update Achievements
function updateAchievements() {
  if (!playlistData || !isAuthenticated) return;
  const totalVideos = playlistData.totalVideos || 0;
  const watchedCount = watchedVideos.size;
  const progress = totalVideos > 0 ? (watchedCount / totalVideos) * 100 : 0;
  const streak = parseInt(localStorage.getItem('studyStreak') || '0');
  const sessions = parseInt(localStorage.getItem('pomodoroSessions') || '0');

  document.getElementById('newbieAchievement').style.width = watchedCount >= 1 ? '100%' : '0%';
  document.getElementById('consistentLearnerAchievement').style.width = streak >= 5 ? '100%' : `${(streak / 5) * 100}%`;
  document.getElementById('halfwayAchievement').style.width = `${Math.min(progress, 50)}%`;
  document.getElementById('halfwayPercent').textContent = `${Math.round(progress)}%`;
  document.getElementById('pomodoroAchievement').style.width = `${Math.min((sessions / 10) * 100, 100)}%`;
  document.getElementById('pomodoroCount').textContent = `${sessions}/10`;
}

// Update Stats
function updateStats() {
  if (!playlistData || !isAuthenticated) {
    document.getElementById('totalStudyTime').textContent = '0h 0m';
    document.getElementById('videosCompleted').textContent = '0/0';
    document.getElementById('averageDailyTime').textContent = '0h 0m';
    document.getElementById('streakCount').textContent = '0 days';
    return;
  }
  const totalTime = Array.from(watchedVideos).reduce((sum, videoId) => {
    const video = playlistData.videos.find((v) => v.id === videoId);
    return sum + (video ? video.duration : 0);
  }, 0);
  document.getElementById('totalStudyTime').textContent = `${Math.floor(totalTime / 60)}h ${Math.round(totalTime % 60)}m`;
  document.getElementById('videosCompleted').textContent = `${watchedVideos.size}/${playlistData.totalVideos || 0}`;

  const avgTime = watchedVideos.size > 0 ? totalTime / watchedVideos.size : 0;
  document.getElementById('averageDailyTime').textContent = `${Math.floor(avgTime / 60)}h ${Math.round(avgTime % 60)}m`;

  document.getElementById('streakCount').textContent = `${localStorage.getItem('studyStreak') || '0'} days`;
}

// Show Message
function showMessage(message, type) {
  const errorContainer = document.getElementById('errorContainer');
  const alertDiv = errorContainer.querySelector('div');

  alertDiv.className = type === 'error' ? 'bg-red-500 text-white px-4 py-2 rounded text-sm' : 'bg-green-500 text-white px-4 py-2 rounded text-sm';
  alertDiv.textContent = message;

  errorContainer.classList.remove('hidden');
  setTimeout(() => errorContainer.classList.add('hidden'), 3000);
}

// Track Pomodoro Session
function trackPomodoroSession() {
  if (!isAuthenticated) return;
  let sessions = parseInt(localStorage.getItem('pomodoroSessions') || '0');
  sessions++;
  localStorage.setItem('pomodoroSessions', sessions);
  updateAchievements();
}

// Track Streak
setInterval(() => {
  const lastDateStr = localStorage.getItem('lastStudyDate');
  const today = new Date();
  const todayStr = today.toDateString();

  if (lastDateStr && watchedVideos.size > 0 && isAuthenticated) {
    const lastDate = new Date(lastDateStr);
    const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);
    let streak = parseInt(localStorage.getItem('studyStreak') || '0');

    if (diffDays <= 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1; // Reset streak if a day was missed
    }

    localStorage.setItem('studyStreak', streak);
    localStorage.setItem('lastStudyDate', todayStr);
    updateStats();
  } else if (watchedVideos.size > 0 && isAuthenticated) {
    localStorage.setItem('studyStreak', '1');
    localStorage.setItem('lastStudyDate', todayStr);
    updateStats();
  }
}, 60000);

// Load Pomodoro State
function loadPomodoroState() {
  const state = localStorage.getItem('pomodoroState');
  if (state && isAuthenticated) {
    const { isRunning, startTime, timerSeconds: savedSeconds, isStudyTime: savedStudyTime } = JSON.parse(state);
    if (isRunning) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timerSeconds = Math.max(0, savedSeconds - elapsed);
      isStudyTime = savedStudyTime;
      if (timerSeconds > 0) {
        startPomodoro();
      } else {
        isStudyTime = !savedStudyTime;
        timerSeconds = isStudyTime ? 25 * 60 : 5 * 60;
        pomodoroTime.textContent = '25:00';
      }
    }
  }
}

window.addEventListener('beforeunload', () => {
  if (isPomodoroRunning && isAuthenticated) {
    localStorage.setItem(
      'pomodoroState',
      JSON.stringify({
        isRunning: true,
        startTime: Date.now(),
        timerSeconds,
        isStudyTime,
      })
    );
  } else {
    localStorage.removeItem('pomodoroState');
  }
});

// Authentication Functions
function showAuthModal(mode) {
  modalTitle.textContent = mode;
  submitAuthBtn.textContent = mode;
  authModal.classList.remove('hidden');
}

function handleAuth(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    showMessage('Username and password are required.', 'error');
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (modalTitle.textContent === 'Sign Up') {
    if (users[username]) {
      showMessage('Username already exists.', 'error');
      return;
    }
    users[username] = btoa(password); // Simple hash for demo
    localStorage.setItem('users', JSON.stringify(users));
    showMessage('Sign up successful! Please log in.', 'success');
  } else { // Login
    if (!users[username] || users[username] !== btoa(password)) {
      showMessage('Invalid username or password.', 'error');
      return;
    }
    localStorage.setItem('user', username);
    isAuthenticated = true;
    showMessage('Login successful!', 'success');
  }
  authModal.classList.add('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
  checkAuthStatus();
}