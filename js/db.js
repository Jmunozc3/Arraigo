// ══════════════════════════════════
// db.js — Capa de datos con Supabase
// ══════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { emitAppEvent } from './utils.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseConfig } from './supabase-config.js';

const DEFAULT_NOTIFICATION_META = {
  examplesSeeded: true,
  jobIdsSeen: []
};

const state = {
  client: null,
  ready: false,
  session: null,
  profile: null,
  jobs: [],
  hiddenJobIds: [],
  communities: [],
  savedJobs: [],
  savedJobRefs: new Map(),
  savedTowns: [],
  notifications: [],
  locationRecords: [],
  nightlyRegistry: {},
  bootstrapError: null
};

function getStorage() {
  try {
    return window.sessionStorage;
  } catch (error) {
    return undefined;
  }
}

function createSupabaseBrowserClient() {
  if (state.client || !hasSupabaseConfig()) return state.client;

  state.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: getStorage()
    }
  });

  return state.client;
}

function requireClient() {
  const client = createSupabaseBrowserClient();
  if (!client) {
    throw new Error('Falta la configuración pública de Supabase');
  }
  return client;
}

function normalizeDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function toIsoString(value = Date.now()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function sanitizeJobSnapshot(job) {
  if (!job?.id) return null;

  return {
    id: String(job.id),
    category: String(job.category || ''),
    badge: {
      label: String(job.badge?.label || ''),
      tone: String(job.badge?.tone || 'blue')
    },
    company: String(job.company || ''),
    title: String(job.title || ''),
    salary: String(job.salary || ''),
    location: String(job.location || ''),
    type: String(job.type || ''),
    schedule: String(job.schedule || ''),
    mode: String(job.mode || ''),
    image: String(job.image || ''),
    summary: String(job.summary || ''),
    description: String(job.description || ''),
    requirements: Array.isArray(job.requirements) ? job.requirements.map(item => String(item || '').trim()).filter(Boolean) : [],
    benefits: Array.isArray(job.benefits) ? job.benefits.map(item => String(item || '').trim()).filter(Boolean) : [],
    contactUrl: String(job.contactUrl || ''),
    createdAt: Number(job.createdAt) || Date.now(),
    createdByEmail: String(job.createdByEmail || ''),
    createdByName: String(job.createdByName || '')
  };
}

function sanitizeTownSnapshot(town) {
  if (!town?.id) return null;
  return JSON.parse(JSON.stringify(town));
}

function mapProfile(row, authSession = null) {
  if (!row?.id) return null;

  return {
    id: row.id,
    name: row.name || '',
    email: row.email || authSession?.user?.email || '',
    phone: row.phone || '',
    age: row.age == null ? '' : String(row.age),
    town: row.town || '',
    region: row.region || '',
    country: row.country || '',
    status: row.status || '',
    avatar: row.avatar || 'https://i.pravatar.cc/136?img=3',
    role: row.role || 'user',
    trackingEnabled: row.tracking_enabled !== false,
    additionalProfile: row.additional_profile || {},
    privacyAcceptedAt: row.privacy_accepted_at || null,
    createdAt: normalizeDateValue(row.created_at) || Date.now(),
    updatedAt: normalizeDateValue(row.updated_at) || Date.now(),
    sessionToken: authSession?.access_token || null,
    sessionExpiresAt: authSession?.expires_at ? authSession.expires_at * 1000 : null,
    sessionCreatedAt: authSession?.user?.created_at ? normalizeDateValue(authSession.user.created_at) : null,
    sessionLastSeenAt: Date.now()
  };
}

function mapJob(row) {
  return {
    id: row.id,
    category: row.category,
    badge: {
      label: row.badge_label,
      tone: row.badge_tone
    },
    company: row.company,
    title: row.title,
    salary: row.salary,
    location: row.location,
    type: row.type,
    schedule: row.schedule,
    mode: row.mode,
    image: row.image,
    summary: row.summary,
    description: row.description,
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    contactUrl: row.contact_url,
    source: row.source || 'admin',
    createdAt: normalizeDateValue(row.created_at) || Date.now(),
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || '',
    createdByEmail: row.created_by_email || ''
  };
}

function mapCommunity(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    chatLink: row.chat_link,
    chatType: row.chat_type || 'link',
    createdAt: normalizeDateValue(row.created_at) || Date.now(),
    createdBy: row.created_by || null,
    createdByName: row.created_by_name || '',
    createdByEmail: row.created_by_email || ''
  };
}

function mapSavedTown(row) {
  const snapshot = row?.town_snapshot && typeof row.town_snapshot === 'object'
    ? JSON.parse(JSON.stringify(row.town_snapshot))
    : {};

  return {
    ...snapshot,
    id: snapshot.id || row.town_id,
    name: snapshot.name || row.town_name,
    region: snapshot.region || row.region || '',
    country: snapshot.country || row.country || 'España'
  };
}

function mapNotification(row, readIds = new Set()) {
  return {
    id: row.id,
    type: row.type || 'system',
    title: row.title || '',
    body: row.body || '',
    actionType: row.action_type === 'none' ? '' : (row.action_type || ''),
    actionTargetId: row.action_target || '',
    isRead: readIds.has(row.id),
    createdAt: normalizeDateValue(row.created_at) || Date.now()
  };
}

function mapLocationRecord(row) {
  return {
    id: row.id,
    email: row.user_email || '',
    name: row.user_name || row.user_email || '',
    role: row.user_role || 'user',
    town: row.user_town || '',
    region: row.user_region || '',
    lat: Number(row.lat),
    lon: Number(row.lon),
    accuracy: row.accuracy_m == null ? null : Number(row.accuracy_m),
    source: row.source || 'manual',
    capturedAt: normalizeDateValue(row.captured_at) || Date.now(),
    nightlyDateKey: row.nightly_date || null
  };
}

function rebuildNightlyRegistry() {
  const registry = {};

  state.locationRecords.forEach(record => {
    if (!record?.email || !record?.nightlyDateKey) return;
    registry[`${record.email}__${record.nightlyDateKey}`] = record.id;
  });

  state.nightlyRegistry = registry;
}

async function runQuery(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function ensureProfileFromAuthUser(user) {
  const client = requireClient();
  const metadata = user?.user_metadata || {};

  const payload = {
    id: user.id,
    email: user.email || '',
    name: String(metadata.name || user.email?.split('@')[0] || 'Usuario'),
    phone: metadata.phone || null,
    age: metadata.age ? Number(metadata.age) : null,
    town: metadata.town || null,
    region: metadata.region || null,
    country: metadata.country || null,
    status: metadata.status || null,
    avatar: metadata.avatar || metadata.avatar_url || null,
    tracking_enabled: metadata.tracking_enabled !== false,
    additional_profile: metadata.additional_profile || {},
    privacy_accepted_at: metadata.privacy_accepted_at || null
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function loadSessionProfile() {
  if (!hasSupabaseConfig()) {
    state.session = null;
    state.profile = null;
    return null;
  }

  const client = requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const authSession = data?.session || null;
  if (!authSession?.user) {
    state.session = null;
    state.profile = null;
    return null;
  }

  let profileRow = await runQuery(
    client.from('profiles').select('*').eq('id', authSession.user.id).maybeSingle()
  );

  if (!profileRow) {
    profileRow = await ensureProfileFromAuthUser(authSession.user);
  }

  const profile = mapProfile(profileRow, authSession);
  state.profile = profile;
  state.session = profile;
  return profile;
}

function resetPrivateState() {
  state.savedJobs = [];
  state.savedJobRefs = new Map();
  state.savedTowns = [];
  state.notifications = [];
  state.locationRecords = [];
  state.nightlyRegistry = {};
}

async function loadJobs() {
  const client = requireClient();
  const rows = await runQuery(
    client
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
  );

  state.jobs = (rows || []).map(mapJob);
}

async function loadHiddenJobs() {
  const client = requireClient();
  const rows = await runQuery(
    client
      .from('hidden_jobs')
      .select('job_id')
      .order('created_at', { ascending: false })
  );

  state.hiddenJobIds = (rows || []).map(row => row.job_id).filter(Boolean);
}

async function loadCommunities() {
  const client = requireClient();
  const rows = await runQuery(
    client
      .from('communities')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
  );

  state.communities = (rows || []).map(mapCommunity);
}

async function loadSavedJobs() {
  if (!state.session?.id) {
    state.savedJobs = [];
    state.savedJobRefs = new Map();
    return;
  }

  const client = requireClient();
  const rows = await runQuery(
    client
      .from('saved_jobs')
      .select('*')
      .eq('user_id', state.session.id)
      .order('created_at', { ascending: false })
  );

  state.savedJobRefs = new Map();
  state.savedJobs = (rows || []).map(row => {
    const snapshot = row?.job_snapshot && typeof row.job_snapshot === 'object'
      ? JSON.parse(JSON.stringify(row.job_snapshot))
      : {};
    const jobId = snapshot.id || row.external_job_id || row.job_id;
    const job = { ...snapshot, id: jobId };
    state.savedJobRefs.set(jobId, row);
    return job;
  }).filter(job => job?.id);
}

async function loadSavedTowns() {
  if (!state.session?.id) {
    state.savedTowns = [];
    return;
  }

  const client = requireClient();
  const rows = await runQuery(
    client
      .from('saved_towns')
      .select('*')
      .eq('user_id', state.session.id)
      .order('created_at', { ascending: false })
  );

  state.savedTowns = (rows || []).map(mapSavedTown).filter(town => town?.id);
}

async function loadNotifications() {
  if (!state.session?.id) {
    state.notifications = [];
    return;
  }

  const client = requireClient();
  const [notificationRows, readRows] = await Promise.all([
    runQuery(
      client
        .from('notifications')
        .select('*')
        .or(`recipient_id.is.null,recipient_id.eq.${state.session.id}`)
        .order('created_at', { ascending: false })
    ),
    runQuery(
      client
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', state.session.id)
    )
  ]);

  const readIds = new Set((readRows || []).map(row => row.notification_id));
  state.notifications = (notificationRows || []).map(row => mapNotification(row, readIds));
}

async function loadLocationRecords() {
  if (!state.session?.id) {
    state.locationRecords = [];
    rebuildNightlyRegistry();
    return;
  }

  const client = requireClient();
  let query = client
    .from('location_events')
    .select('*')
    .order('captured_at', { ascending: false });

  if (!state.session || state.session.role !== 'admin') {
    query = query.eq('user_id', state.session.id);
  }

  const rows = await runQuery(query);
  state.locationRecords = (rows || []).map(mapLocationRecord);
  rebuildNightlyRegistry();
}

async function loadPublicState() {
  await Promise.all([
    loadJobs(),
    loadHiddenJobs(),
    loadCommunities()
  ]);
}

async function loadPrivateState() {
  if (!state.session?.id) {
    resetPrivateState();
    return;
  }

  await Promise.all([
    loadSavedJobs(),
    loadSavedTowns(),
    loadNotifications(),
    loadLocationRecords()
  ]);
}

function emitGlobalRefreshEvents() {
  emitAppEvent('arraigo:session-changed', { session: state.session });
  emitAppEvent('arraigo:saved-changed', { type: 'all' });
  emitAppEvent('arraigo:notifications-changed');
  emitAppEvent('arraigo:communities-changed');
  emitAppEvent('arraigo:jobs-changed');
}

function buildProfileUpdatePayload(data = {}) {
  const payload = {};

  if (data.name !== undefined) payload.name = data.name || '';
  if (data.phone !== undefined) payload.phone = data.phone || null;
  if (data.age !== undefined) payload.age = data.age ? Number(data.age) : null;
  if (data.town !== undefined) payload.town = data.town || null;
  if (data.region !== undefined) payload.region = data.region || null;
  if (data.country !== undefined) payload.country = data.country || null;
  if (data.status !== undefined) payload.status = data.status || null;
  if (data.avatar !== undefined) payload.avatar = data.avatar || null;
  if (data.trackingEnabled !== undefined) payload.tracking_enabled = Boolean(data.trackingEnabled);
  if (data.additionalProfile !== undefined) payload.additional_profile = data.additionalProfile || {};
  if (data.privacyAcceptedAt !== undefined) payload.privacy_accepted_at = data.privacyAcceptedAt || null;

  return payload;
}

export const DB = {
  async bootstrap() {
    if (state.ready) return state.session;

    if (!hasSupabaseConfig()) {
      state.bootstrapError = new Error('Falta la anon key de Supabase');
      state.ready = true;
      return null;
    }

    createSupabaseBrowserClient();
    await this.refreshState();
    state.ready = true;
    return state.session;
  },

  async refreshState(emit = false) {
    await loadSessionProfile();
    await loadPublicState();
    await loadPrivateState();
    if (emit) emitGlobalRefreshEvents();
    return state.session;
  },

  getClient() {
    return createSupabaseBrowserClient();
  },

  getBootstrapError() {
    return state.bootstrapError;
  },

  getUsers() {
    if (!state.session?.email) return {};
    return { [state.session.email]: state.session };
  },

  saveUsers() {
    return undefined;
  },

  getAllUsers() {
    return state.session ? [state.session] : [];
  },

  getProfile(email) {
    if (!email) return null;
    if (state.session?.email === email) return state.session;
    return null;
  },

  async saveProfile(email, data) {
    if (!state.session?.id || !email || state.session.email !== email) return null;

    const client = requireClient();
    const payload = buildProfileUpdatePayload(data);

    const row = await runQuery(
      client
        .from('profiles')
        .update(payload)
        .eq('id', state.session.id)
        .select('*')
        .single()
    );

    state.profile = mapProfile(row, { user: { id: state.session.id, email: state.session.email } });
    state.session = {
      ...state.session,
      ...state.profile,
      sessionToken: state.session.sessionToken,
      sessionExpiresAt: state.session.sessionExpiresAt,
      sessionCreatedAt: state.session.sessionCreatedAt,
      sessionLastSeenAt: Date.now()
    };

    return state.session;
  },

  async createSession() {
    return this.refreshState();
  },

  async setSession() {
    return this.refreshState();
  },

  getSessionToken() {
    return state.session?.sessionToken || null;
  },

  getSession() {
    if (!state.session) return null;
    return {
      ...state.session,
      sessionLastSeenAt: Date.now()
    };
  },

  async clearSession() {
    if (!hasSupabaseConfig()) {
      state.session = null;
      state.profile = null;
      resetPrivateState();
      return;
    }

    const client = requireClient();
    await client.auth.signOut();
    state.session = null;
    state.profile = null;
    resetPrivateState();
  },

  isAdminSession() {
    return state.session?.role === 'admin';
  },

  getAppState() {
    return {
      savedJobs: this.getSavedJobs(),
      savedTowns: this.getSavedTowns(),
      hiddenJobIds: this.getHiddenJobIds()
    };
  },

  saveAppState() {
    return undefined;
  },

  getSavedJobs() {
    return state.savedJobs.slice();
  },

  getSavedTowns() {
    return state.savedTowns.slice();
  },

  getHiddenJobIds() {
    return state.hiddenJobIds.slice();
  },

  isJobHidden(jobId) {
    return state.hiddenJobIds.includes(jobId);
  },

  getCommunities() {
    return state.communities.slice();
  },

  getCustomJobs() {
    return state.jobs.slice();
  },

  saveCustomJobs() {
    return undefined;
  },

  saveCommunities() {
    return undefined;
  },

  async createCommunity(entry) {
    if (!state.session?.id) return null;

    const client = requireClient();
    const payload = {
      id: crypto.randomUUID(),
      title: String(entry?.title || '').trim(),
      description: String(entry?.description || '').trim(),
      image: String(entry?.image || '').trim(),
      chat_link: String(entry?.chatLink || '').trim(),
      chat_type: String(entry?.chatType || 'link').trim(),
      created_by: state.session.id
    };

    if (!payload.title || !payload.description || !payload.chat_link) return null;

    const row = await runQuery(
      client
        .from('communities')
        .insert(payload)
        .select('*')
        .single()
    );

    const community = mapCommunity(row);
    state.communities.unshift(community);
    await loadNotifications();
    return community;
  },

  async createJob(entry) {
    if (!state.session?.id || state.session.role !== 'admin') return null;

    const normalizeList = items => (Array.isArray(items) ? items : [])
      .map(item => String(item || '').trim())
      .filter(Boolean);

    const payload = {
      id: crypto.randomUUID(),
      category: String(entry?.category || '').trim(),
      badge_label: String(entry?.badge?.label || '').trim(),
      badge_tone: String(entry?.badge?.tone || 'blue').trim(),
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
      contact_url: String(entry?.contactUrl || '').trim(),
      source: 'admin',
      created_by: state.session.id
    };

    const requiredValues = [
      payload.category,
      payload.badge_label,
      payload.badge_tone,
      payload.company,
      payload.title,
      payload.salary,
      payload.location,
      payload.type,
      payload.schedule,
      payload.mode,
      payload.image,
      payload.summary,
      payload.description,
      payload.contact_url
    ];

    if (requiredValues.some(value => !value) || !payload.requirements.length || !payload.benefits.length) {
      return null;
    }

    const client = requireClient();
    const row = await runQuery(
      client
        .from('jobs')
        .insert(payload)
        .select('*')
        .single()
    );

    const job = mapJob(row);
    state.jobs.unshift(job);
    await loadNotifications();
    return job;
  },

  async deleteCommunity(communityId, requesterEmail = this.getSession()?.email) {
    if (!communityId || !requesterEmail || !state.session?.id) return false;

    const target = state.communities.find(item => item.id === communityId);
    const isAdmin = state.session.role === 'admin';
    const isOwner = target?.createdBy === state.session.id || target?.createdByEmail === requesterEmail;
    if (!target || (!isOwner && !isAdmin)) return false;

    const client = requireClient();
    await runQuery(
      client
        .from('communities')
        .update({
          deleted_at: toIsoString(),
          deleted_by: state.session.id
        })
        .eq('id', communityId)
        .select('id')
        .single()
    );

    state.communities = state.communities.filter(item => item.id !== communityId);
    return true;
  },

  getNotifications() {
    return state.notifications.slice();
  },

  saveNotifications() {
    return undefined;
  },

  async addNotification(entry) {
    if (!state.session?.id) return null;

    const client = requireClient();
    const payload = {
      id: crypto.randomUUID(),
      recipient_id: entry?.recipientId || null,
      type: String(entry?.type || 'system').trim(),
      title: String(entry?.title || '').trim(),
      body: String(entry?.body || '').trim(),
      action_type: entry?.actionType ? String(entry.actionType).trim() : 'none',
      action_target: entry?.actionTargetId ? String(entry.actionTargetId).trim() : null,
      created_by: state.session.id
    };

    if (!payload.title || !payload.body) return null;

    const row = await runQuery(
      client
        .from('notifications')
        .insert(payload)
        .select('*')
        .single()
    );

    await loadNotifications();
    return mapNotification(row);
  },

  async markAllNotificationsRead() {
    if (!state.session?.id) return [];

    const unread = state.notifications.filter(item => !item.isRead);
    if (!unread.length) return state.notifications;

    const client = requireClient();
    const rows = unread.map(item => ({
      notification_id: item.id,
      user_id: state.session.id,
      read_at: toIsoString()
    }));

    await runQuery(
      client
        .from('notification_reads')
        .upsert(rows, { onConflict: 'notification_id,user_id' })
        .select('notification_id')
    );

    state.notifications = state.notifications.map(item => ({
      ...item,
      isRead: true
    }));

    return state.notifications;
  },

  getUnreadNotificationsCount() {
    return state.notifications.filter(item => !item.isRead).length;
  },

  getNotificationMeta() {
    return { ...DEFAULT_NOTIFICATION_META };
  },

  saveNotificationMeta() {
    return undefined;
  },

  isJobSaved(id) {
    return state.savedJobs.some(job => job.id === id);
  },

  isTownSaved(id) {
    return state.savedTowns.some(town => town.id === id);
  },

  async toggleSavedJob(job) {
    if (!job?.id || !state.session?.id || this.isJobHidden(job.id)) return null;

    const client = requireClient();
    const currentRef = state.savedJobRefs.get(job.id);

    if (currentRef) {
      let query = client.from('saved_jobs').delete().eq('user_id', state.session.id);
      query = currentRef.job_id
        ? query.eq('job_id', currentRef.job_id)
        : query.eq('external_job_id', currentRef.external_job_id || job.id);

      await runQuery(query.select('id'));
      state.savedJobs = state.savedJobs.filter(item => item.id !== job.id);
      state.savedJobRefs.delete(job.id);
      return false;
    }

    const snapshot = sanitizeJobSnapshot(job);
    if (!snapshot) return null;

    const isCustomJob = state.jobs.some(item => item.id === job.id);
    const payload = {
      user_id: state.session.id,
      job_id: isCustomJob ? job.id : null,
      external_job_id: isCustomJob ? null : String(job.id),
      job_snapshot: snapshot
    };

    const row = await runQuery(
      client
        .from('saved_jobs')
        .insert(payload)
        .select('*')
        .single()
    );

    state.savedJobs.unshift(snapshot);
    state.savedJobRefs.set(job.id, row);
    return true;
  },

  async hideJob(jobId) {
    if (!jobId || !state.session?.id || !this.isAdminSession()) return false;

    const client = requireClient();
    const customJob = state.jobs.find(item => item.id === jobId);

    if (customJob) {
      await runQuery(
        client
          .from('jobs')
          .update({
            is_hidden: true,
            deleted_at: toIsoString(),
            deleted_by: state.session.id
          })
          .eq('id', jobId)
          .select('id')
          .single()
      );

      state.jobs = state.jobs.filter(item => item.id !== jobId);
    } else if (!state.hiddenJobIds.includes(jobId)) {
      await runQuery(
        client
          .from('hidden_jobs')
          .insert({
            job_id: jobId,
            hidden_by: state.session.id
          })
          .select('job_id')
          .single()
      );

      state.hiddenJobIds.unshift(jobId);
    }

    state.savedJobs = state.savedJobs.filter(item => item.id !== jobId);
    state.savedJobRefs.delete(jobId);
    return true;
  },

  async toggleSavedTown(town) {
    if (!town?.id || !state.session?.id) return null;

    const client = requireClient();
    const index = state.savedTowns.findIndex(item => item.id === town.id);

    if (index >= 0) {
      await runQuery(
        client
          .from('saved_towns')
          .delete()
          .eq('user_id', state.session.id)
          .eq('town_id', town.id)
          .select('town_id')
      );

      state.savedTowns.splice(index, 1);
      return false;
    }

    const snapshot = sanitizeTownSnapshot(town);
    if (!snapshot) return null;

    await runQuery(
      client
        .from('saved_towns')
        .upsert({
          user_id: state.session.id,
          town_id: String(town.id),
          town_name: String(town.name || town.id),
          region: town.region || null,
          country: town.country || null,
          town_snapshot: snapshot
        }, { onConflict: 'user_id,town_id' })
        .select('town_id')
    );

    state.savedTowns.unshift(snapshot);
    return true;
  },

  getLocationDataset() {
    return {
      records: state.locationRecords.slice(),
      nightlyRegistry: { ...state.nightlyRegistry }
    };
  },

  saveLocationDataset() {
    return undefined;
  },

  hasNightlyLocation(email, dateKey) {
    return Boolean(state.nightlyRegistry[`${email}__${dateKey}`]);
  },

  async recordUserLocation(entry) {
    if (!state.session?.id) return null;

    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const client = requireClient();
    const payload = {
      id: crypto.randomUUID(),
      user_id: state.session.id,
      lat,
      lon,
      accuracy_m: Number.isFinite(Number(entry?.accuracy)) ? Number(entry.accuracy) : null,
      source: String(entry?.source || 'manual'),
      nightly_date: entry?.nightlyDateKey || null,
      captured_at: toIsoString(entry?.capturedAt || Date.now())
    };

    const row = await runQuery(
      client
        .from('location_events')
        .insert(payload)
        .select('*')
        .single()
    );

    const record = mapLocationRecord(row);
    state.locationRecords.unshift(record);
    rebuildNightlyRegistry();
    return record;
  },

  getUserLocations(email) {
    return state.locationRecords
      .filter(record => record.email === email)
      .sort((a, b) => b.capturedAt - a.capturedAt);
  },

  getLatestLocationsByUser() {
    const latestByUser = new Map();

    state.locationRecords.forEach(record => {
      const current = latestByUser.get(record.email);
      if (!current || record.capturedAt > current.capturedAt) {
        latestByUser.set(record.email, record);
      }
    });

    return Array.from(latestByUser.values()).sort((a, b) => b.capturedAt - a.capturedAt);
  },

  getLocationSummaryRows() {
    const counts = new Map();
    state.locationRecords.forEach(record => {
      counts.set(record.email, (counts.get(record.email) || 0) + 1);
    });

    return this.getLatestLocationsByUser().map(record => ({
      ...record,
      recordsCount: counts.get(record.email) || 1,
      dateKey: record.nightlyDateKey || null
    }));
  }
};
