import { createClient } from '@supabase/supabase-js';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  reminder_days: number;
  email_notifications: boolean;
  is_premium: boolean;
  avatar_url?: string;
}

export interface RecurringInvoice {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number; // 1-31
  category: string;
  icon: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  recurring_id: string | null;
  name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  is_paid: boolean;
  category: string;
  icon: string;
  notes?: string;
}

// Suppress typescript warning for import.meta.env
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Detect Supabase config
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helpers
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const formatDayDate = (year: number, month: number, day: number): string => {
  const paddedMonth = String(month).padStart(2, '0');
  const daysInMonth = getDaysInMonth(year, month);
  const safeDay = Math.min(day, daysInMonth);
  const paddedDay = String(safeDay).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
};

// ----------------------------------------------------
// LOCAL STORAGE SIMULATION
// ----------------------------------------------------
const LS_KEYS = {
  USER: 'payvo_user',
  PROFILES: 'payvo_profiles',
  RECURRING: 'payvo_recurring',
  INVOICES: 'payvo_invoices',
};

const getLS = <T>(key: string, defaultVal: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setLS = <T>(key: string, val: T): void => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Seed mock data if empty
const seedMockData = (userId: string) => {
  // Profiles
  const profiles = getLS<Profile[]>(LS_KEYS.PROFILES, []);
  if (!profiles.some(p => p.id === userId)) {
    profiles.push({
      id: userId,
      name: 'Användare',
      email: '',
      reminder_days: 3,
      email_notifications: true,
      is_premium: false, // Start as free so they can upgrade!
      avatar_url: '',
    });
    setLS(LS_KEYS.PROFILES, profiles);
  }

  // Recurring Invoices (Fasta)
  const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []);
  if (!recurring.some(r => r.user_id === userId)) {
    recurring.push(
      {
        id: 'rec-1',
        user_id: userId,
        name: 'Hyra - Maj', // Standard name template
        amount: 12400,
        due_day: 31,
        category: 'Boende',
        icon: 'Hus',
        notes: 'Hyra för lägenheten inkl. parkeringsplats.',
      },
      {
        id: 'rec-2',
        user_id: userId,
        name: 'Telia Bredband',
        amount: 499,
        due_day: 10,
        category: 'Telekom',
        icon: 'Wifi',
        notes: '1000/1000 fiberanslutning.',
      }
    );
    setLS(LS_KEYS.RECURRING, recurring);
  }

  // Invoices (Instances + Variable)
  const invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []);
  if (!invoices.some(i => i.user_id === userId)) {
    // Let's seed for current month (June 2026) and previous month (May 2026)
    invoices.push(
      // May 2026
      {
        id: 'inv-may-1',
        user_id: userId,
        recurring_id: 'rec-1',
        name: 'Hyra - Maj',
        amount: 12400,
        due_date: '2026-05-31',
        is_paid: true,
        category: 'Boende',
        icon: 'Hus',
      },
      {
        id: 'inv-may-2',
        user_id: userId,
        recurring_id: 'rec-2',
        name: 'Telia Bredband',
        amount: 499,
        due_date: '2026-05-10',
        is_paid: true,
        category: 'Telekom',
        icon: 'Wifi',
      },
      {
        id: 'inv-may-3',
        user_id: userId,
        recurring_id: null,
        name: 'E.ON Elnät',
        amount: 840,
        due_date: '2026-05-12',
        is_paid: true,
        category: 'El',
        icon: 'Blixt',
      },
      // June 2026
      {
        id: 'inv-june-1',
        user_id: userId,
        recurring_id: 'rec-1',
        name: 'Hyra - Maj', // Name as instantiated
        amount: 12400,
        due_date: '2026-06-30',
        is_paid: false,
        category: 'Boende',
        icon: 'Hus',
      },
      {
        id: 'inv-june-2',
        user_id: userId,
        recurring_id: null,
        name: 'Klarna',
        amount: 2150,
        due_date: '2026-06-07', // Due tomorrow (June 6 is local date)
        is_paid: false,
        category: 'Shopping',
        icon: 'Shopping',
      },
      {
        id: 'inv-june-3',
        user_id: userId,
        recurring_id: null,
        name: 'E.ON Elnät',
        amount: 840,
        due_date: '2026-06-12',
        is_paid: true,
        category: 'El',
        icon: 'Blixt',
      },
      {
        id: 'inv-june-4',
        user_id: userId,
        recurring_id: 'rec-2',
        name: 'Telia Bredband',
        amount: 499,
        due_date: '2026-06-10',
        is_paid: true,
        category: 'Telekom',
        icon: 'Wifi',
      }
    );
    setLS(LS_KEYS.INVOICES, invoices);
  }
};

// ----------------------------------------------------
// DATABASE API INTERFACE
// ----------------------------------------------------
export const dbAPI = {
  // Auth Functions
  auth: {
    async getCurrentUser(): Promise<User | null> {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return { id: user.id, email: user.email || '' };
      } else {
        const user = getLS<User | null>(LS_KEYS.USER, null);
        if (user) {
          seedMockData(user.id);
        }
        return user;
      }
    },

    async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { user: null, error: error.message };
        return {
          user: data.user ? { id: data.user.id, email: data.user.email || '' } : null,
          error: null,
        };
      } else {
        // Mock simple auth
        const profiles = getLS<Profile[]>(LS_KEYS.PROFILES, []);
        const matchingProfile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
        const userId = matchingProfile ? matchingProfile.id : 'user-' + Math.random().toString(36).substr(2, 9);
        const user: User = { id: userId, email };
        setLS(LS_KEYS.USER, user);
        seedMockData(userId);
        return { user, error: null };
      }
    },

    async register(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) return { user: null, error: error.message };
        return {
          user: data.user ? { id: data.user.id, email: data.user.email || '' } : null,
          error: null,
        };
      } else {
        // Mock register
        const userId = 'user-' + Math.random().toString(36).substr(2, 9);
        const user: User = { id: userId, email };
        setLS(LS_KEYS.USER, user);

        // Add to profiles
        const profiles = getLS<Profile[]>(LS_KEYS.PROFILES, []);
        profiles.push({
          id: userId,
          name,
          email,
          reminder_days: 3,
          email_notifications: true,
          is_premium: false,
          avatar_url: ``
        });
        setLS(LS_KEYS.PROFILES, profiles);

        seedMockData(userId);
        return { user, error: null };
      }
    },

    async logout(): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem(LS_KEYS.USER);
      }
    },

    async requestPasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { success: !error, error: error ? error.message : null };
      } else {
        // Always succeed mock
        return { success: true, error: null };
      }
    }
  },

  // Profile management
  profile: {
    async get(userId: string): Promise<Profile | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) return null;
        return data;
      } else {
        const profiles = getLS<Profile[]>(LS_KEYS.PROFILES, []);
        return profiles.find(p => p.id === userId) || null;
      }
    },

    async update(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
        if (error) return null;
        return data;
      } else {
        const profiles = getLS<Profile[]>(LS_KEYS.PROFILES, []);
        const index = profiles.findIndex(p => p.id === userId);
        if (index === -1) return null;

        profiles[index] = { ...profiles[index], ...updates };
        setLS(LS_KEYS.PROFILES, profiles);
        return profiles[index];
      }
    }
  },

  // Recurring Invoices (Fasta)
  recurring: {
    async list(userId: string): Promise<RecurringInvoice[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('recurring_invoices').select('*').eq('user_id', userId);
        if (error) return [];
        return data;
      } else {
        const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []);
        return recurring.filter(r => r.user_id === userId);
      }
    },

    async create(userId: string, item: Omit<RecurringInvoice, 'id' | 'user_id'>): Promise<RecurringInvoice | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('recurring_invoices').insert({
          ...item,
          user_id: userId
        }).select().single();
        if (error) return null;
        return data;
      } else {
        const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []);
        const newItem: RecurringInvoice = {
          ...item,
          id: 'rec-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
        };
        recurring.push(newItem);
        setLS(LS_KEYS.RECURRING, recurring);
        return newItem;
      }
    },

    async update(userId: string, id: string, updates: Partial<Omit<RecurringInvoice, 'id' | 'user_id'>>): Promise<RecurringInvoice | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('recurring_invoices')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) return null;
        return data;
      } else {
        const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []);
        const idx = recurring.findIndex(r => r.id === id && r.user_id === userId);
        if (idx === -1) return null;
        recurring[idx] = { ...recurring[idx], ...updates };
        setLS(LS_KEYS.RECURRING, recurring);
        return recurring[idx];
      }
    },

    async delete(userId: string, id: string): Promise<boolean> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('recurring_invoices').delete().eq('id', id).eq('user_id', userId);
        return !error;
      } else {
        let recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []);
        const initialLen = recurring.length;
        recurring = recurring.filter(r => !(r.id === id && r.user_id === userId));
        setLS(LS_KEYS.RECURRING, recurring);
        return recurring.length < initialLen;
      }
    }
  },

  // Invoices (Monthly + Variable)
  invoices: {
    async list(userId: string, month: string): Promise<Invoice[]> {
      // Month format: "YYYY-MM"
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);

      if (isSupabaseConfigured && supabase) {
        // Query instances in this month range
        const startDate = `${month}-01`;
        const daysInM = getDaysInMonth(year, monthNum);
        const endDate = `${month}-${String(daysInM).padStart(2, '0')}`;

        // First, fetch recurring configurations
        const { data: recConfigs } = await supabase.from('recurring_invoices').select('*').eq('user_id', userId);

        // Fetch current invoice entries
        const { data: currentInvoices, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .gte('due_date', startDate)
          .lte('due_date', endDate);

        if (error) return [];

        // Generate missing recurring instances for this month
        if (recConfigs && recConfigs.length > 0) {
          const missingInstances: Omit<Invoice, 'id'>[] = [];
          for (const rec of recConfigs) {
            const hasInstance = currentInvoices?.some(i => i.recurring_id === rec.id);
            if (!hasInstance) {
              const expectedDueDate = formatDayDate(year, monthNum, rec.due_day);
              missingInstances.push({
                user_id: userId,
                recurring_id: rec.id,
                name: rec.name,
                amount: rec.amount,
                due_date: expectedDueDate,
                is_paid: false,
                category: rec.category,
                icon: rec.icon,
                notes: rec.notes || '',
              });
            }
          }

          if (missingInstances.length > 0) {
            const { data: newInstances } = await supabase.from('invoices').insert(missingInstances).select();
            if (newInstances) {
              return [...(currentInvoices || []), ...newInstances].sort((a, b) => a.due_date.localeCompare(b.due_date));
            }
          }
        }

        return (currentInvoices || []).sort((a, b) => a.due_date.localeCompare(b.due_date));
      } else {
        // Localstorage logic
        const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []).filter(r => r.user_id === userId);
        const invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []);

        // Filter invoices belonging to user in target month
        let userMonthInvoices = invoices.filter(i => {
          return i.user_id === userId && i.due_date.startsWith(month);
        });

        // Generate missing recurring instances
        let updated = false;
        for (const rec of recurring) {
          const hasInstance = userMonthInvoices.some(i => i.recurring_id === rec.id);
          if (!hasInstance) {
            const targetDate = formatDayDate(year, monthNum, rec.due_day);
            const newInst: Invoice = {
              id: 'inv-' + Math.random().toString(36).substr(2, 9),
              user_id: userId,
              recurring_id: rec.id,
              name: rec.name,
              amount: rec.amount,
              due_date: targetDate,
              is_paid: false,
              category: rec.category,
              icon: rec.icon,
              notes: rec.notes,
            };
            invoices.push(newInst);
            userMonthInvoices.push(newInst);
            updated = true;
          }
        }

        if (updated) {
          setLS(LS_KEYS.INVOICES, invoices);
        }

        // Sort by due date
        return userMonthInvoices.sort((a, b) => a.due_date.localeCompare(b.due_date));
      }
    },

    async countTotalInvoices(userId: string): Promise<number> {
      // Counts all custom/fixed entries to enforce the 5-item limit for free accounts.
      if (isSupabaseConfigured && supabase) {
        // Count total active unique configurations (recurring + variables)
        // For Postgres, we can sum the recurring count + non-recurring invoices count.
        const { count: recCount } = await supabase
          .from('recurring_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const { count: varCount } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('recurring_id', null);

        return (recCount || 0) + (varCount || 0);
      } else {
        const recurring = getLS<RecurringInvoice[]>(LS_KEYS.RECURRING, []).filter(r => r.user_id === userId);
        const invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []).filter(i => i.user_id === userId && i.recurring_id === null);
        return recurring.length + invoices.length;
      }
    },

    async create(userId: string, item: Omit<Invoice, 'id' | 'user_id'>): Promise<Invoice | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('invoices').insert({
          ...item,
          user_id: userId
        }).select().single();
        if (error) return null;
        return data;
      } else {
        const invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []);
        const newInvoice: Invoice = {
          ...item,
          id: 'inv-' + Math.random().toString(36).substr(2, 9),
          user_id: userId,
        };
        invoices.push(newInvoice);
        setLS(LS_KEYS.INVOICES, invoices);
        return newInvoice;
      }
    },

    async update(userId: string, id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error) return null;
        return data;
      } else {
        const invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []);
        const index = invoices.findIndex(i => i.id === id && i.user_id === userId);
        if (index === -1) return null;

        invoices[index] = { ...invoices[index], ...updates };
        setLS(LS_KEYS.INVOICES, invoices);
        return invoices[index];
      }
    },

    async delete(userId: string, id: string): Promise<boolean> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', userId);
        return !error;
      } else {
        let invoices = getLS<Invoice[]>(LS_KEYS.INVOICES, []);
        const initialLen = invoices.length;
        invoices = invoices.filter(i => !(i.id === id && i.user_id === userId));
        setLS(LS_KEYS.INVOICES, invoices);
        return invoices.length < initialLen;
      }
    },

    async togglePaid(userId: string, id: string, isPaid: boolean): Promise<Invoice | null> {
      return this.update(userId, id, { is_paid: isPaid });
    }
  }
};
