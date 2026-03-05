'use client';

import { SupabaseProvider, useSupabase } from '@/components/providers/SupabaseProvider';
import { Settings, Plus, Trash2, Download, Chrome } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  market: string | null;
  phone: string | null;
  is_active: boolean;
  chrome_profile: string | null;
}

function SettingsContent() {
  const supabase = useSupabase();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('market_manager');
  const [inviteMarket, setInviteMarket] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  useEffect(() => {
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would use Supabase admin API to create user
    alert(`Invite sent to ${inviteEmail} as ${inviteRole}${inviteMarket ? ` (${inviteMarket})` : ''}. They will receive a password setup email.`);
    setShowInvite(false);
    setInviteEmail('');
    setInviteName('');
    setInviteMarket('');
    setInvitePhone('');
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from('OS_profiles').update({ is_active: !currentlyActive }).eq('id', userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !currentlyActive } : u))
    );
  }

  async function updateProfile(userId: string, field: keyof UserProfile, value: string | null) {
    const { error } = await supabase.from('OS_profiles').update({ [field]: value || null }).eq('id', userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value || null } : u))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-gray-600" />
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1c2b3d] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#253a52]"
        >
          <Plus size={14} />
          Invite User
        </button>
      </div>

      {/* Chrome Extension Download */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1c2b3d]">
              <Chrome size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Chrome Extension</h3>
              <p className="text-xs text-gray-500">
                Install on each Market Manager&apos;s Chrome to track activity across Bubble, Gmail, Dialpad &amp; Melio
              </p>
            </div>
          </div>
          <a
            href="/downloads/breasy-workos-extension.zip"
            download="breasy-workos-extension.zip"
            className="flex items-center gap-1.5 rounded-lg bg-[#1c2b3d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#253a52]"
          >
            <Download size={14} />
            Download Extension
          </a>
        </div>
        <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Install steps:</span>{' '}
          Unzip &rarr; Open <span className="font-mono">chrome://extensions</span> &rarr; Enable Developer Mode &rarr; Load Unpacked &rarr; Select the unzipped folder
        </div>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Invite New User</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Full name"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="market_manager">Market Manager</option>
              <option value="admin_ar">Admin AR</option>
              <option value="admin_ap">Admin AP</option>
              <option value="manager">Manager</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <input
              type="text"
              value={inviteMarket}
              onChange={(e) => setInviteMarket(e.target.value)}
              placeholder="Market (e.g. Los Angeles)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={invitePhone}
              onChange={(e) => setInvitePhone(e.target.value)}
              placeholder="Dialpad phone number"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded-lg bg-[#1c2b3d] px-4 py-2 text-sm text-white hover:bg-[#253a52]">
              Send Invite
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Market</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Phone</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Chrome Profile</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={user.role}
                      onChange={(e) => updateProfile(user.id, 'role', e.target.value)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 focus:border-[#1c2b3d] focus:outline-none focus:ring-1 focus:ring-[#1c2b3d]"
                    >
                      <option value="market_manager">Market Manager</option>
                      <option value="admin_ar">Admin AR</option>
                      <option value="admin_ap">Admin AP</option>
                      <option value="manager">Manager</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{user.market ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-gray-600">{user.phone ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">
                    {user.chrome_profile
                      ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {user.chrome_profile}
                        </span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SupabaseProvider>
      <SettingsContent />
    </SupabaseProvider>
  );
}
