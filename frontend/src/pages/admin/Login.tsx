import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Lock, Loader2, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.data.token) {
        localStorage.setItem('admin_token', response.data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
        toast.success('Connexion réussie !');
        navigate('/admin/dashboard');
      } else {
        const errorMsg = response.data.message || 'Erreur de connexion';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message ||
                       (err.response?.status === 401 ? 'Email ou mot de passe incorrect' :
                        err.response?.status === 429 ? 'Trop de tentatives. Réessayez dans 1 minute.' :
                        'Erreur de connexion au serveur');
      setError(errorMsg);
      // Les toasts d'erreur sont gérés par l'intercepteur de l'API
      // pas besoin d'ajouter un toast ici (évite la duplication)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1220] px-4 py-10">
      {/* Halo doré subtil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(205,164,52,0.08),transparent_60%)]" />
      {/* Grain lumineux d'accent */}
      <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#cda434]/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/[0.05] blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-slate-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
        <div className="mb-10 flex flex-col items-center text-center">
          <img
            src="/logo-macof.png"
            alt="MACOF Holding"
            className="h-14 w-auto object-contain"
          />
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.25em] text-[#cda434]">
            Espace administrateur
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            Connexion sécurisée
          </h1>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@macof-holding.com"
                autoComplete="email"
                className="rounded-xl border-white/10 bg-slate-900/60 pl-11 text-slate-100 placeholder:text-slate-500 focus-visible:border-[#cda434]/50 focus-visible:ring-[#cda434]/40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="rounded-xl border-white/10 bg-slate-900/60 pl-11 text-slate-100 placeholder:text-slate-500 focus-visible:border-[#cda434]/50 focus-visible:ring-[#cda434]/40"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="h-12 w-full text-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600">
          Accès réservé aux administrateurs MACOF Holding.
        </p>
      </div>
    </div>
  );
}
