import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Mail, Trash2, 
  RefreshCw, CheckCircle2, Clock, MoreVertical, Key, Eye, Wrench
} from 'lucide-react';

interface TeamMembersViewProps {
  app: any;
  currentUser: any;
  showToast: (msg: string) => void;
}

interface TeamMember {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  status: 'active' | 'invited';
  joined_at: number;
  is_owner?: boolean;
}

export const TeamMembersView: React.FC<TeamMembersViewProps> = ({ app, currentUser, showToast }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal: Invite
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [isInviting, setIsInviting] = useState(false);

  // Modal: Permission Matrix
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const appId = app?.client_id || app?.id || 'default_app';
  const apiKey = app?.api_key || app?.client_secret || appId;

  useEffect(() => {
    fetchMembers();
  }, [app]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/members', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.warn('Fetch team members error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Please provide an email address.');
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole
        })
      });

      const data = await res.json();
      if (res.ok && data.member) {
        setMembers(prev => [...prev, data.member]);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        showToast(data.message || 'Invitation sent successfully!');
      } else {
        showToast(data.error || 'Failed to send invite');
      }
    } catch (err: any) {
      showToast(err.message || 'Invite error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'developer' | 'viewer') => {
    try {
      const res = await fetch('/api/v1/team/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ member_id: memberId, role: newRole })
      });

      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        showToast(`Updated member role to ${newRole.toUpperCase()}`);
      } else {
        showToast('Failed to update role');
      }
    } catch (e) {
      showToast('Network error updating role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this application team?`)) return;

    try {
      const res = await fetch('/api/v1/team/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ member_id: memberId })
      });

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        showToast(`${memberName} removed from team.`);
      } else {
        showToast('Failed to remove member');
      }
    } catch (e) {
      showToast('Error removing collaborator');
    }
  };

  const adminCount = members.filter(m => m.role === 'admin').length;
  const devCount = members.filter(m => m.role === 'developer').length;
  const viewerCount = members.filter(m => m.role === 'viewer').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Team Members & Collaborators
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage developer team access with fine-grained role-based permissions (Admin, Developer, Viewer).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMatrixModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            Role Permissions
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Team</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{members.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active & invited members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">Admins</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">{adminCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Full billing & credentials access</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">Developers</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{devCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">APIs, templates, & webhooks</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Viewers</span>
          <div className="text-2xl font-extrabold text-slate-600 mt-1">{viewerCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Read-only logs & monitoring</span>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Application Collaborators</h3>
            <p className="text-xs text-slate-500 mt-0.5">People with authorized console access to this application.</p>
          </div>
          <button
            onClick={fetchMembers}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
            title="Refresh team list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3">Collaborator</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Joined Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {member.name || member.username}
                          {member.is_owner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800">
                              Owner
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">@{member.username}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {member.email}
                  </td>

                  <td className="py-3.5 px-3">
                    {member.is_owner ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        Admin (Owner)
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={e => handleUpdateRole(member.id, e.target.value as any)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border outline-none cursor-pointer ${
                          member.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : member.role === 'developer'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="admin">Admin</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      member.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {member.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {member.status === 'active' ? 'Active' : 'Invited'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-500">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    {!member.is_owner && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name || member.username)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Invite Collaborator */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Send an invitation to join this application.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="sarah@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Assignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', desc: 'Full access' },
                    { id: 'developer', label: 'Developer', desc: 'API & webhooks' },
                    { id: 'viewer', label: 'Viewer', desc: 'Read-only' },
                  ].map(r => (
                    <div
                      key={r.id}
                      onClick={() => setInviteRole(r.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                        inviteRole === r.id 
                          ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900 block">{r.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isInviting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Role Permission Matrix */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Role Permission Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Granular feature breakdown across roles.</p>
              </div>
              <button onClick={() => setShowMatrixModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2">Capability</th>
                    <th className="py-2 text-center text-purple-600">Admin</th>
                    <th className="py-2 text-center text-indigo-600">Developer</th>
                    <th className="py-2 text-center text-slate-600">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 font-semibold">View Live API Logs & Metrics</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Create & Edit Message Templates</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Configure Webhooks & Test Pings</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">View & Rotate API Client Secrets</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Billing, Credits Top-up & Plan Switch</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">Invite & Manage Team Members</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                    <td className="py-2.5 text-center text-slate-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
