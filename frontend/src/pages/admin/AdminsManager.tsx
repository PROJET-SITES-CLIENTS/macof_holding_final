import { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface AdminUser {
  id: number;
  nom: string;
  email: string;
  avatar_url?: string | null;
  role: 'admin' | 'gestionnaire';
  filiale_attribuee?: number | null;
  filiale_nom?: string | null;
  archived?: boolean;
  created_at?: string;
}

interface Filiale {
  id: number;
  nom: string;
}

const inputClass =
  'w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all';
const labelClass = 'block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2';

export default function AdminsManager() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'gestionnaire' as 'admin' | 'gestionnaire',
    filiale_attribuee: '',
  });
  const [newPassword, setNewPassword] = useState('');

  const { data: admins = [], isLoading: loading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/administrateurs');
      return res.data?.success ? (res.data.data as AdminUser[]) : [];
    },
  });

  const { data: filiales = [] } = useQuery({
    queryKey: ['filialesForAdmins'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/filiales');
      return res.data?.success ? (res.data.data as Filiale[]) : [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', email: '', password: '', role: 'gestionnaire', filiale_attribuee: '' });
    setModalOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setEditing(admin);
    setForm({
      nom: admin.nom,
      email: admin.email,
      password: '',
      role: admin.role,
      filiale_attribuee: admin.filiale_attribuee ? String(admin.filiale_attribuee) : '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.nom.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/v1/admin/administrateurs/${editing.id}`, {
          nom: form.nom.trim(),
          role: form.role,
          filiale_attribuee: form.filiale_attribuee ? Number(form.filiale_attribuee) : null,
        });
      } else {
        if (form.password.length < 8) return;
        await api.post('/api/v1/admin/administrateurs', {
          nom: form.nom.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          filiale_attribuee: form.filiale_attribuee ? Number(form.filiale_attribuee) : null,
        });
      }
      setModalOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget || newPassword.length < 8) return;
    setSaving(true);
    try {
      await api.put(`/api/v1/admin/administrateurs/${resetTarget.id}/password`, {
        new_password: newPassword,
      });
      setResetTarget(null);
      setNewPassword('');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async () => {
    if (!archiveTarget) return;
    setSaving(true);
    try {
      await api.put(`/api/v1/admin/administrateurs/${archiveTarget.id}`, {
        archived: !archiveTarget.archived,
      });
      setArchiveTarget(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role: string) =>
    role === 'admin' ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cda434]/30 bg-[#cda434]/10 px-2.5 py-0.5 text-xs font-medium text-[#e0b83d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cda434]" />
        Administrateur
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
        Gestionnaire
      </span>
    );

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
              Sécurité
            </p>
            <h2 className="mt-1.5 flex items-center gap-3 text-2xl font-bold text-slate-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#cda434]/20 bg-gradient-to-br from-[#cda434]/20 to-transparent text-[#cda434]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Administrateurs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gérez les comptes, les rôles et les accès au tableau de bord.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-[#cda434]/10 transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
          <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Utilisateur</th>
                  <th className="px-6 py-3.5 font-medium">Rôle</th>
                  <th className="px-6 py-3.5 font-medium">Filiale attribuée</th>
                  <th className="px-6 py-3.5 font-medium">Statut</th>
                  <th className="px-6 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#cda434]/20 bg-gradient-to-br from-[#cda434]/15 to-transparent text-sm font-bold text-[#e0b83d]">
                          {a.nom?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <div>
                          <p className="font-medium text-slate-200">{a.nom}</p>
                          <p className="text-xs text-slate-500">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{roleBadge(a.role)}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {a.filiale_nom || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {a.archived ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          <UserX className="h-3 w-3" />
                          Désactivé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <UserCheck className="h-3 w-3" />
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        title="Modifier"
                        onClick={() => openEdit(a)}
                        className="mr-1 rounded-lg p-2 text-slate-400 transition-all hover:bg-[#cda434]/10 hover:text-[#e0b83d]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Réinitialiser le mot de passe"
                        onClick={() => setResetTarget(a)}
                        className="mr-1 rounded-lg p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-slate-200"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        title={a.archived ? 'Réactiver' : 'Désactiver'}
                        onClick={() => setArchiveTarget(a)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                      >
                        {a.archived ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16">
                      <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
                          <ShieldCheck className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">Aucun utilisateur</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Créez un administrateur ou un gestionnaire pour partager l'accès au tableau de bord.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modale création / édition */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e1626] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <h3 className="text-lg font-semibold text-slate-100">
                  {editing ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Fermer"
                >
                  <span className="text-lg leading-none">✕</span>
                </button>
              </div>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className={labelClass}>Nom complet *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex : Fatoumata Camara"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Adresse e-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="exemple@macof-holding.com"
                    className={inputClass}
                    disabled={!!editing}
                  />
                  {editing && (
                    <p className="mt-1.5 text-xs text-slate-600">L'e-mail ne peut pas être modifié.</p>
                  )}
                </div>
                {!editing && (
                  <div>
                    <label className={labelClass}>Mot de passe provisoire * (min. 8 caractères)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Rôle</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'gestionnaire' })}
                      className={inputClass}
                    >
                      <option value="gestionnaire">Gestionnaire</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Filiale attribuée</label>
                    <select
                      value={form.filiale_attribuee}
                      onChange={(e) => setForm({ ...form, filiale_attribuee: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">— Aucune —</option>
                      {filiales.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-xs leading-relaxed text-sky-300/90">
                  Un <strong>gestionnaire</strong> peut gérer les contenus mais pas les paramètres,
                  les suppressions sensibles ni les utilisateurs. Un <strong>administrateur</strong> a tous les droits.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-white/[0.06] px-6 py-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                >
                  Annuler
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.nom.trim() || !form.email.trim() || (!editing && form.password.length < 8)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editing ? 'Enregistrer' : 'Créer l’utilisateur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale réinitialisation mot de passe */}
        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e1626] shadow-2xl">
              <div className="border-b border-white/[0.06] px-6 py-5">
                <h3 className="text-lg font-semibold text-slate-100">
                  Réinitialiser le mot de passe
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Nouveau mot de passe pour <strong className="text-slate-300">{resetTarget.nom}</strong> ({resetTarget.email})
                </p>
              </div>
              <div className="px-6 py-6">
                <label className={labelClass}>Nouveau mot de passe (min. 8 caractères)</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-white/[0.06] px-6 py-5">
                <button
                  onClick={() => {
                    setResetTarget(null);
                    setNewPassword('');
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                >
                  Annuler
                </button>
                <button
                  onClick={resetPassword}
                  disabled={saving || newPassword.length < 8}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={archiveTarget !== null}
          title={archiveTarget?.archived ? 'Réactiver cet utilisateur ?' : 'Désactiver cet utilisateur ?'}
          message={
            archiveTarget?.archived
              ? `${archiveTarget?.nom} pourra de nouveau se connecter au tableau de bord.`
              : `${archiveTarget?.nom} ne pourra plus se connecter au tableau de bord.`
          }
          confirmText={archiveTarget?.archived ? 'Réactiver' : 'Désactiver'}
          onConfirm={toggleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      </div>
    </AdminPage>
  );
}
