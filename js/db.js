// ══════════════════════════════════
// db.js — Base de datos local (localStorage)
// ══════════════════════════════════

const USERS_KEY = 'arraigo_users';
const SESSION_TOKEN_KEY = 'arraigo_session_token';
const SESSION_STORE_KEY = 'arraigo_sessions';
const APP_STATE_KEY = 'arraigo_app_state';
const LOCATION_DATASET_KEY = 'arraigo_location_dataset_v1';
const COMMUNITIES_KEY = 'arraigo_communities_v1';
const NOTIFICATIONS_KEY = 'arraigo_notifications_v1';
const NOTIFICATION_META_KEY = 'arraigo_notification_meta_v1';
const CUSTOM_JOBS_KEY = 'arraigo_custom_jobs_v1';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOCATION_RECORD_LIMIT = 3000;
const COMMUNITY_RECORD_LIMIT = 200;
const NOTIFICATION_LIMIT = 120;

const ADMIN_EMAIL = 'admin@arraigo.test';
const ADMIN_PROFILE = {
  name: 'Admin Arraigo',
  email: ADMIN_EMAIL,
  passwordHash: 'sha256:7f3f87694a5ff1f64900cc38046872ed913653ff7f8a8367f37c224cb6a19a85',
  role: 'admin',
  town: 'Madrid',
  region: 'Madrid',
  country: 'España',
  status: 'Visualización y testing',
  avatar: 'https://i.pravatar.cc/136?img=12',
  trackingEnabled: false,
  createdAt: 1774543200000
};

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function dedupeById(items) {
  const seen = new Map();
  (Array.isArray(items) ? items : []).forEach(item => {
    if (!item || !item.id) return;
    seen.set(item.id, item);
  });
  return Array.from(seen.values());
}

function dedupeStrings(items) {
  return Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean)));
}

function removeSensitiveFields(user) {
  if (!user) return null;
  const nextUser = { ...user };
  delete nextUser.pass;
  delete nextUser.passwordHash;
  return nextUser;
}

function ensureAdminUser(users) {
  if (users?.[ADMIN_EMAIL]) return users;

  const nextUsers = { ...(users || {}) };
  nextUsers[ADMIN_EMAIL] = { ...ADMIN_PROFILE };
  writeJson(USERS_KEY, nextUsers);
  return nextUsers;
}

function generateToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  const values = new Uint32Array(4);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
    return Array.from(values, value => value.toString(16).padStart(8, '0')).join('');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getDateKey(dateValue = Date.now()) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readSessionStore() {
  const store = readJson(SESSION_STORE_KEY, {});
  const now = Date.now();
  let changed = false;

  Object.keys(store).forEach(token => {
    const session = store[token];
    if (!session?.email || !session?.expiresAt || session.expiresAt <= now) {
      delete store[token];
      changed = true;
    }
  });

  if (changed) writeJson(SESSION_STORE_KEY, store);
  return store;
}

function getDefaultAppState() {
  return {
    savedJobs: [],
    savedTowns: [],
    hiddenJobIds: []
  };
}

function getDefaultLocationDataset() {
  return {
    records: [],
    nightlyRegistry: {}
  };
}

function getDefaultCommunities() {
  return [];
}

function getDefaultNotifications() {
  return [];
}

function getDefaultCustomJobs() {
  return [];
}

function getDefaultNotificationMeta() {
  return {
    examplesSeeded: false,
    jobIdsSeen: []
  };
}

export const DB = {
  bootstrap() {
    this.getUsers();
    if (!this.getSessionToken()) {
      const legacySession = readJson('arraigo_session', null);
      if (legacySession?.email) this.setSession(legacySession);
      localStorage.removeItem('arraigo_session');
    }
    this.getSession();
  },

  getUsers() {
    const users = readJson(USERS_KEY, {});
    return ensureAdminUser(users);
  },

  saveUsers(users) {
    const nextUsers = ensureAdminUser(users || {});
    writeJson(USERS_KEY, nextUsers);
  },

  getAllUsers() {
    return Object.values(this.getUsers()).map(removeSensitiveFields);
  },

  getProfile(email) {
    const users = this.getUsers();
    return users[email] || null;
  },

  saveProfile(email, data) {
    const users = this.getUsers();
    const currentProfile = users[email] || {
      email,
      role: 'user',
      createdAt: Date.now()
    };

    const nextProfile = { ...currentProfile };

    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value === null) {
        delete nextProfile[key];
        return;
      }
      nextProfile[key] = value;
    });

    if (!nextProfile.role) nextProfile.role = 'user';
    users[email] = nextProfile;
    this.saveUsers(users);

    return nextProfile;
  },

  createSession(user) {
    if (!user?.email) return null;

    const token = generateToken();
    const sessions = readSessionStore();
    const now = Date.now();

    sessions[token] = {
      email: user.email,
      role: user.role || 'user',
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + SESSION_TTL_MS
    };

    writeJson(SESSION_STORE_KEY, sessions);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    return this.getSession();
  },

  setSession(user) {
    return this.createSession(user);
  },

  getSessionToken() {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  getSession() {
    const token = this.getSessionToken();
    if (!token) return null;

    const sessions = readSessionStore();
    const sessionMeta = sessions[token];
    if (!sessionMeta) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }

    const user = this.getProfile(sessionMeta.email);
    if (!user) {
      delete sessions[token];
      writeJson(SESSION_STORE_KEY, sessions);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }

    const now = Date.now();
    sessionMeta.lastSeenAt = now;
    sessionMeta.expiresAt = now + SESSION_TTL_MS;
    sessions[token] = sessionMeta;
    writeJson(SESSION_STORE_KEY, sessions);

    return {
      ...removeSensitiveFields(user),
      role: user.role || sessionMeta.role || 'user',
      sessionToken: token,
      sessionExpiresAt: sessionMeta.expiresAt,
      sessionCreatedAt: sessionMeta.createdAt,
      sessionLastSeenAt: sessionMeta.lastSeenAt
    };
  },

  clearSession() {
    const token = this.getSessionToken();
    if (token) {
      const sessions = readSessionStore();
      delete sessions[token];
      writeJson(SESSION_STORE_KEY, sessions);
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
  },

  isAdminSession() {
    return this.getSession()?.role === 'admin';
  },

  getAppState() {
    const parsed = readJson(APP_STATE_KEY, getDefaultAppState());
    return {
      savedJobs: dedupeById(parsed.savedJobs),
      savedTowns: dedupeById(parsed.savedTowns),
      hiddenJobIds: dedupeStrings(parsed.hiddenJobIds)
    };
  },

  saveAppState(state) {
    const nextState = {
      savedJobs: dedupeById(state?.savedJobs),
      savedTowns: dedupeById(state?.savedTowns),
      hiddenJobIds: dedupeStrings(state?.hiddenJobIds)
    };
    writeJson(APP_STATE_KEY, nextState);
  },

  getSavedJobs() {
    const state = this.getAppState();
    const hiddenJobIds = new Set(state.hiddenJobIds);
    return state.savedJobs.filter(job => job?.id && !hiddenJobIds.has(job.id));
  },

  getSavedTowns() {
    return this.getAppState().savedTowns;
  },

  getHiddenJobIds() {
    return this.getAppState().hiddenJobIds;
  },

  isJobHidden(jobId) {
    return this.getHiddenJobIds().includes(jobId);
  },

  getCommunities() {
    return readJson(COMMUNITIES_KEY, getDefaultCommunities())
      .filter(item => item?.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  getCustomJobs() {
    return readJson(CUSTOM_JOBS_KEY, getDefaultCustomJobs())
      .filter(item => item?.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  saveCustomJobs(jobs) {
    const nextJobs = (Array.isArray(jobs) ? jobs : [])
      .filter(item => item?.id);
    writeJson(CUSTOM_JOBS_KEY, nextJobs);
  },

  saveCommunities(communities) {
    const nextCommunities = (Array.isArray(communities) ? communities : [])
      .filter(item => item?.id)
      .slice(0, COMMUNITY_RECORD_LIMIT);
    writeJson(COMMUNITIES_KEY, nextCommunities);
  },

  createCommunity(entry) {
    const session = this.getSession();
    if (!session?.email) return null;

    const createdAt = Date.now();
    const community = {
      id: generateToken(),
      title: String(entry?.title || '').trim(),
      description: String(entry?.description || '').trim(),
      image: String(entry?.image || '').trim(),
      chatLink: String(entry?.chatLink || '').trim(),
      chatType: String(entry?.chatType || '').trim(),
      createdAt,
      createdByEmail: session.email,
      createdByName: session.name || session.email
    };

    if (!community.title || !community.description || !community.chatLink) return null;

    const communities = this.getCommunities();
    communities.unshift(community);
    this.saveCommunities(communities);
    return community;
  },

  createJob(entry) {
    const session = this.getSession();
    if (!session?.email || session.role !== 'admin') return null;

    const normalizeList = items => (Array.isArray(items) ? items : [])
      .map(item => String(item || '').trim())
      .filter(Boolean);

    const createdAt = Date.now();
    const job = {
      id: generateToken(),
      category: String(entry?.category || '').trim(),
      badge: {
        label: String(entry?.badge?.label || '').trim(),
        tone: String(entry?.badge?.tone || '').trim()
      },
      company: String(entry?.company || '').trim(),
      title: String(entry?.title || '').trim(),
      salary: String(entry?.salary || '').trim(),
      location: String(entry?.location || '').trim(),
      type: String(entry?.type || '').trim(),
      schedule: String(entry?.schedule || '').trim(),
      mode: String(entry?.mode || '').trim(),
      image: String(entry?.image || '').trim(),
      summary: String(entry?.summary || '').trim(),
      description: String(entry?.description || '').trim(),
      requirements: normalizeList(entry?.requirements),
      benefits: normalizeList(entry?.benefits),
      contactUrl: String(entry?.contactUrl || '').trim(),
      createdAt,
      createdByEmail: session.email,
      createdByName: session.name || session.email
    };

    const requiredValues = [
      job.category,
      job.badge.label,
      job.badge.tone,
      job.company,
      job.title,
      job.salary,
      job.location,
      job.type,
      job.schedule,
      job.mode,
      job.image,
      job.summary,
      job.description,
      job.contactUrl
    ];

    if (requiredValues.some(value => !value) || !job.requirements.length || !job.benefits.length) return null;

    const jobs = this.getCustomJobs();
    jobs.unshift(job);
    this.saveCustomJobs(jobs);
    return job;
  },

  deleteCommunity(communityId, requesterEmail = this.getSession()?.email) {
    if (!communityId || !requesterEmail) return false;

    const communities = this.getCommunities();
    const target = communities.find(item => item.id === communityId);
    const session = this.getSession();
    const isAdmin = session?.email === requesterEmail && session.role === 'admin';
    if (!target || (target.createdByEmail !== requesterEmail && !isAdmin)) return false;

    this.saveCommunities(communities.filter(item => item.id !== communityId));
    return true;
  },

  getNotifications() {
    return readJson(NOTIFICATIONS_KEY, getDefaultNotifications())
      .filter(item => item?.id)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  saveNotifications(notifications) {
    const nextNotifications = (Array.isArray(notifications) ? notifications : [])
      .filter(item => item?.id)
      .slice(0, NOTIFICATION_LIMIT);
    writeJson(NOTIFICATIONS_KEY, nextNotifications);
  },

  addNotification(entry) {
    const notification = {
      id: generateToken(),
      type: String(entry?.type || 'system'),
      title: String(entry?.title || '').trim(),
      body: String(entry?.body || '').trim(),
      actionType: String(entry?.actionType || '').trim(),
      actionTargetId: String(entry?.actionTargetId || '').trim(),
      isRead: Boolean(entry?.isRead),
      createdAt: Number(entry?.createdAt) || Date.now()
    };

    if (!notification.title || !notification.body) return null;

    const notifications = this.getNotifications();
    notifications.unshift(notification);
    this.saveNotifications(notifications);
    return notification;
  },

  markAllNotificationsRead() {
    const notifications = this.getNotifications().map(item => ({
      ...item,
      isRead: true
    }));
    this.saveNotifications(notifications);
    return notifications;
  },

  getUnreadNotificationsCount() {
    return this.getNotifications().filter(item => !item.isRead).length;
  },

  getNotificationMeta() {
    const meta = readJson(NOTIFICATION_META_KEY, getDefaultNotificationMeta());
    return {
      examplesSeeded: Boolean(meta?.examplesSeeded),
      jobIdsSeen: Array.isArray(meta?.jobIdsSeen) ? Array.from(new Set(meta.jobIdsSeen.filter(Boolean))) : []
    };
  },

  saveNotificationMeta(meta) {
    writeJson(NOTIFICATION_META_KEY, {
      examplesSeeded: Boolean(meta?.examplesSeeded),
      jobIdsSeen: Array.isArray(meta?.jobIdsSeen) ? Array.from(new Set(meta.jobIdsSeen.filter(Boolean))) : []
    });
  },

  isJobSaved(id) {
    return this.getSavedJobs().some(job => job.id === id);
  },

  isTownSaved(id) {
    return this.getSavedTowns().some(town => town.id === id);
  },

  toggleSavedJob(job) {
    if (!job?.id || this.isJobHidden(job.id)) return false;

    const state = this.getAppState();
    const index = state.savedJobs.findIndex(item => item.id === job.id);

    if (index >= 0) {
      state.savedJobs.splice(index, 1);
      this.saveAppState(state);
      return false;
    }

    state.savedJobs.unshift(job);
    this.saveAppState(state);
    return true;
  },

  hideJob(jobId) {
    if (!jobId || !this.isAdminSession()) return false;

    const state = this.getAppState();
    const customJobs = this.getCustomJobs();
    const hasCustomJob = customJobs.some(item => item.id === jobId);

    if (hasCustomJob) {
      this.saveCustomJobs(customJobs.filter(item => item.id !== jobId));
    } else {
      state.hiddenJobIds = dedupeStrings([jobId, ...(state.hiddenJobIds || [])]);
    }

    state.savedJobs = state.savedJobs.filter(item => item?.id !== jobId);
    this.saveAppState(state);
    return true;
  },

  toggleSavedTown(town) {
    const state = this.getAppState();
    const index = state.savedTowns.findIndex(item => item.id === town.id);

    if (index >= 0) {
      state.savedTowns.splice(index, 1);
      this.saveAppState(state);
      return false;
    }

    state.savedTowns.unshift(town);
    this.saveAppState(state);
    return true;
  },

  getLocationDataset() {
    const dataset = readJson(LOCATION_DATASET_KEY, getDefaultLocationDataset());
    return {
      records: Array.isArray(dataset.records) ? dataset.records : [],
      nightlyRegistry: dataset.nightlyRegistry || {}
    };
  },

  saveLocationDataset(dataset) {
    const nextDataset = {
      records: Array.isArray(dataset?.records) ? dataset.records.slice(-LOCATION_RECORD_LIMIT) : [],
      nightlyRegistry: dataset?.nightlyRegistry || {}
    };
    writeJson(LOCATION_DATASET_KEY, nextDataset);
  },

  hasNightlyLocation(email, dateKey) {
    const dataset = this.getLocationDataset();
    return Boolean(dataset.nightlyRegistry?.[`${email}__${dateKey}`]);
  },

  recordUserLocation(entry) {
    const email = entry?.email || this.getSession()?.email;
    if (!email) return null;

    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const user = this.getProfile(email);
    const capturedAt = Number(entry?.capturedAt) || Date.now();
    const dataset = this.getLocationDataset();
    const record = {
      id: generateToken(),
      email,
      name: user?.name || email,
      role: user?.role || 'user',
      town: user?.town || '',
      region: user?.region || '',
      lat,
      lon,
      accuracy: Number(entry?.accuracy) || null,
      source: entry?.source || 'manual',
      capturedAt
    };

    dataset.records.push(record);
    dataset.records = dataset.records.slice(-LOCATION_RECORD_LIMIT);

    if (entry?.nightlyDateKey) {
      dataset.nightlyRegistry[`${email}__${entry.nightlyDateKey}`] = record.id;
    }

    this.saveLocationDataset(dataset);
    return record;
  },

  getUserLocations(email) {
    return this.getLocationDataset()
      .records
      .filter(record => record.email === email)
      .sort((a, b) => b.capturedAt - a.capturedAt);
  },

  getLatestLocationsByUser() {
    const latestByUser = new Map();

    this.getLocationDataset().records.forEach(record => {
      const current = latestByUser.get(record.email);
      if (!current || record.capturedAt > current.capturedAt) {
        latestByUser.set(record.email, record);
      }
    });

    return Array.from(latestByUser.values()).sort((a, b) => b.capturedAt - a.capturedAt);
  },

  getLocationSummaryRows() {
    const counts = new Map();
    this.getLocationDataset().records.forEach(record => {
      counts.set(record.email, (counts.get(record.email) || 0) + 1);
    });

    return this.getLatestLocationsByUser().map(record => ({
      ...record,
      recordsCount: counts.get(record.email) || 1,
      dateKey: getDateKey(record.capturedAt)
    }));
  }
};
