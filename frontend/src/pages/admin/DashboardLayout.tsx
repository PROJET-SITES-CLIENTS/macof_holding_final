import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LogOut,
  LayoutDashboard,
  Mail,
  Building2,
  Image,
  FileText,
  FileEdit,
  Settings,
  Menu,
  X,
  BarChart3,
  Users,
  MessageSquareQuote,
  Briefcase,
  UtensilsCrossed,
  ChevronDown,
  Camera,
  X as CloseIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { VoiceChatbot } from '@/components/admin/VoiceChatbot';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../../lib/utils';

interface AdminUser {
  name?: string;
  email?: string;
  nom?: string;
  avatar_url?: string | null;
}

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Demandes', icon: Mail, path: '/admin/demandes' },
  { label: 'Filiales', icon: Building2, path: '/admin/filiales' },
  { label: 'Réalisations', icon: Briefcase, path: '/admin/realisations' },
  {
    label: 'Menu',
    icon: UtensilsCrossed,
    children: [
      { label: 'Produits', path: '/admin/menu/produits' },
      { label: 'Commandes', path: '/admin/menu/commandes' },
    ],
  },
  { label: 'Galerie', icon: Image, path: '/admin/galerie' },
  { label: 'Catalogues', icon: FileText, path: '/admin/catalogues' },
  { label: 'Chiffres & Stats', icon: BarChart3, path: '/admin/stats' },
  { label: 'Partenaires', icon: Users, path: '/admin/partenaires' },
  { label: 'Témoignages', icon: MessageSquareQuote, path: '/admin/temoignages' },
  { label: 'Contenus', icon: FileEdit, path: '/admin/pages' },
  { label: 'Paramètres', icon: Settings, path: '/admin/settings' },
];

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/demandes': 'Demandes reçues',
  '/admin/filiales': 'Filiales',
  '/admin/realisations': 'Réalisations par filiale',
  '/admin/menu/produits': 'Produits du menu',
  '/admin/menu/commandes': 'Commandes',
  '/admin/galerie': 'Galerie',
  '/admin/catalogues': 'Catalogues',
  '/admin/stats': 'Chiffres & Statistiques',
  '/admin/partenaires': 'Partenaires',
  '/admin/temoignages': 'Témoignages clients',
  '/admin/pages': 'Contenus',
  '/admin/settings': 'Paramètres',
};

const activeItemClasses =
  'relative bg-gradient-to-r from-[#cda434]/15 to-transparent text-[#e0b83d] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-[#cda434] before:to-[#e0b83d]';
const idleItemClasses =
  'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]">
      {count}
    </span>
  );
}

export default function DashboardLayout() {
  const [token] = useState(() => localStorage.getItem('admin_token'));
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        setAdminUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const activeGroup = navItems.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.path))
    );
    if (activeGroup && !openGroups[activeGroup.label]) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const { data: badges = {} } = useQuery({
    queryKey: ['dashboardBadges'],
    queryFn: async () => {
      if (!token) return {};
      try {
        const response = await api.get('/api/v1/admin/dashboard/stats');
        if (response.data.success) {
          const nouveauCount = response.data.data?.nouvelles_demandes ?? 0;
          const nouvellesCommandes = response.data.data?.nouvelles_commandes ?? 0;
          return {
            '/admin/demandes': nouveauCount,
            '/admin/menu/commandes': nouvellesCommandes,
          };
        }
      } catch {
        // ignore
      }
      return {};
    },
    enabled: !!token,
  });

  // Indexation typée des compteurs de notifications par chemin
  const badgeMap = badges as Record<string, number>;

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogoutConfirm = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    toast.success('Déconnexion réussie');
    setShowLogoutModal(false);
    navigate('/admin/login');
  };

  const adminName = adminUser.name || adminUser.nom || adminUser.email || 'Admin';
  const currentPageTitle = pageTitles[location.pathname] || 'Tableau de bord';

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const openProfileModal = () => {
    setProfileImage(null);
    setProfilePreview(adminUser.avatar_url || null);
    setShowProfileModal(true);
  };

  const saveProfileImage = async () => {
    if (!profileImage || profileSaving) return;
    setProfileSaving(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', profileImage);
      uploadData.append('folder', 'administrateurs');
      const uploadResponse = await api.post('/api/v1/admin/upload', uploadData);
      const avatarUrl = uploadResponse.data?.data?.url;
      if (!avatarUrl) throw new Error('URL image manquante');
      const profileResponse = await api.put('/api/v1/admin/profile', { avatar_url: avatarUrl });
      if (!profileResponse.data?.success || !profileResponse.data?.data) {
        throw new Error(profileResponse.data?.message || 'Profil non mis à jour');
      }
      const updatedUser = { ...adminUser, ...(profileResponse.data?.data || {}), avatar_url: avatarUrl };
      setAdminUser(updatedUser);
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      setShowProfileModal(false);
    } catch (error) {
      console.error('Erreur photo profil:', error);
      alert('Impossible de mettre à jour la photo de profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const groupBadgeTotal = (item: NavItem) =>
    (item.children || []).reduce((sum, child) => sum + (badgeMap[child.path] || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#0b1220]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#0e1626] transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:z-20 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img src="/logo-macof.png" alt="MACOF Holding" className="h-9 w-auto object-contain" />
            <span className="rounded-full border border-[#cda434]/30 bg-[#cda434]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#cda434]">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.path) {
              const isActive = location.pathname === item.path;
              const badgeCount = badgeMap[item.path] || 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isActive ? activeItemClasses : idleItemClasses
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] flex-shrink-0 ${
                      isActive ? 'text-[#cda434]' : 'text-slate-500'
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  <CountBadge count={badgeCount} />
                </Link>
              );
            }

            const children = item.children || [];
            const isGroupActive = children.some((child) =>
              location.pathname.startsWith(child.path)
            );
            const isOpen = !!openGroups[item.label];
            const badgeTotal = groupBadgeTotal(item);

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    isGroupActive ? activeItemClasses : idleItemClasses
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] flex-shrink-0 ${
                      isGroupActive ? 'text-[#cda434]' : 'text-slate-500'
                    }`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  <CountBadge count={badgeTotal} />
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 mt-1 space-y-1 border-l border-white/[0.08] pl-4">
                      {children.map((child) => {
                        const isActive = location.pathname === child.path;
                        const badgeCount = badgeMap[child.path] || 0;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`relative flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
                              isActive
                                ? 'bg-[#cda434]/10 text-[#e0b83d] before:absolute before:-left-4 before:top-1/2 before:h-4 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-[#cda434]'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="flex-1">{child.label}</span>
                            <CountBadge count={badgeCount} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Pied de barre */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
              {adminUser.avatar_url ? (
                <img
                  src={getImageUrl(adminUser.avatar_url)}
                  alt={adminName}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                  }}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#cda434]/30 to-[#e0b83d]/10 text-sm font-bold text-[#e0b83d]">
                  {adminName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{adminName}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Administrateur</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-400/90 transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0e1626]/80 px-6 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80 sm:block">
                Administration
              </p>
              <h1 className="text-lg font-semibold text-slate-100">{currentPageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <VoiceChatbot />
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openProfileModal}
                className="group relative h-10 w-10 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10 transition duration-300 hover:ring-[#cda434]/60"
                title="Modifier la photo de profil"
                aria-label="Modifier la photo de profil"
              >
                {adminUser.avatar_url ? (
                  <img
                    src={getImageUrl(adminUser.avatar_url)}
                    alt={adminName}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    <Camera className="h-4 w-4" />
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition duration-300 group-hover:opacity-100">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <span className="hidden text-sm font-medium text-slate-300 sm:inline">{adminName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Modale de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-slate-900/90 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
                <LogOut className="h-5 w-5 text-red-400" />
              </span>
              <h2 className="text-lg font-semibold text-white">Confirmer la déconnexion</h2>
            </div>
            <p className="mb-7 text-sm leading-relaxed text-slate-400">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour
              accéder à l'administration.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
              >
                Annuler
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)] transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale photo de profil */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative border-b border-white/[0.06] bg-gradient-to-br from-[#cda434]/[0.07] via-transparent to-transparent px-7 py-6">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
                aria-label="Fermer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#cda434]">
                Espace administrateur
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Photo de profil</h2>
              <p className="mt-1 text-sm text-slate-400">
                Personnalisez votre identité dans le tableau de bord.
              </p>
            </div>
            <div className="space-y-6 p-7">
              <label className="group relative mx-auto flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/15 bg-slate-900/60 transition duration-300 hover:border-[#cda434]">
                {profilePreview ? (
                  <img
                    src={profilePreview.startsWith('blob:') ? profilePreview : getImageUrl(profilePreview)}
                    alt="Aperçu du profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-slate-500" />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs text-white opacity-0 transition duration-300 group-hover:opacity-100">
                  Choisir une photo
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setProfileImage(file);
                      setProfilePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveProfileImage}
                  disabled={!profileImage || profileSaving}
                  className="rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-[#1a1405] shadow-[0_8px_24px_-8px_rgba(205,164,52,0.55)] transition-all duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
                >
                  {profileSaving ? 'Enregistrement…' : 'Enregistrer la photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
