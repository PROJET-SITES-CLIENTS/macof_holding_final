import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Lenis from "@studio-freight/lenis";
import { AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Toaster } from "sonner";

import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Domaines from "./pages/Domaines";
import Galerie from "./pages/Galerie";
import Contact from "./pages/Contact";
import Catalogues from "./pages/Catalogues";
import Partenaires from "./pages/Partenaires";

import Immobilier from "./pages/filiales/Immobilier";
import Restauration from "./pages/filiales/Restauration";
import Transit from "./pages/filiales/Transit";
import Mining from "./pages/filiales/Mining";
import Fishing from "./pages/filiales/Fishing";
import Print from "./pages/filiales/Print";
import ProductDetails from "./pages/filiales/ProductDetails";
import Checkout from "./pages/filiales/Checkout";
import { CartProvider } from "./components/restauration/CartContext";

// ─── Pages chargées à la demande (allège le bundle du site public) ─────────
const Promo = lazy(() => import("./pages/Promo"));
const NotFound = lazy(() => import("./components/NotFound"));

// Toute la partie administration est exclue du bundle public
const Login = lazy(() => import("./pages/admin/Login"));
const DashboardLayout = lazy(() => import("./pages/admin/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Leads = lazy(() => import("./pages/admin/Leads"));
const GalerieManager = lazy(() => import("./pages/admin/GalerieManager"));
const CataloguesManager = lazy(() => import("./pages/admin/CataloguesManager"));
const FilialesManager = lazy(() => import("./pages/admin/FilialesManager"));
const PagesEditor = lazy(() => import("./pages/admin/PagesEditor"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const StatsManager = lazy(() => import("./pages/admin/StatsManager"));
const PartenairesManager = lazy(() => import("./pages/admin/PartenairesManager"));
const NotificationsManager = lazy(() => import("./pages/admin/NotificationsManager"));
const TemoignagesManager = lazy(() => import("./pages/admin/TemoignagesManager"));
const RealisationsManager = lazy(() => import("./pages/admin/RealisationsManager"));
const CommandesManager = lazy(() => import("./pages/admin/CommandesManager"));
const AdminsManager = lazy(() => import("./pages/admin/AdminsManager"));
const MenuProduitsPage = lazy(() => import("./pages/admin/RestaurationManager"));

import { AnimatedPage } from "./components/layout/AnimatedPage";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { InstallPWAButton } from "./components/pwa/InstallPWAButton";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// ─── Titres de pages (SEO) ──────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/": "MACOF Holding — L'Excellence Sans Compromis",
  "/about": "À propos — MACOF Holding",
  "/domaines": "Nos domaines d'activité — MACOF Holding",
  "/galerie": "Galerie de réalisations — MACOF Holding",
  "/catalogues": "Catalogues & documents — MACOF Holding",
  "/partenaires": "Nos partenaires — MACOF Holding",
  "/contact": "Contact & devis — MACOF Holding",
  "/immobilier": "MACOF Immobilier — Promotion immobilière en Guinée",
  "/restauration": "MACOF Restauration — Traiteur & menu SEBA",
  "/transit": "MACOF Transit & Logistics — Transport et logistique",
  "/mining": "MACOF Mining — Extraction minière en Guinée",
  "/fishing": "MACOF Fishing — Pêche industrielle",
  "/print": "MACOF Print — Impression & communication visuelle",
  "/checkout": "Votre commande — MACOF Restauration",
  "/admin/login": "Administration — MACOF Holding",
};

function TitleManager() {
  const location = useLocation();
  useEffect(() => {
    if (PAGE_TITLES[location.pathname]) {
      document.title = PAGE_TITLES[location.pathname];
    } else if (location.pathname.startsWith("/admin")) {
      document.title = "Tableau de bord — MACOF Holding";
    } else if (location.pathname.startsWith("/promo")) {
      document.title = "Annonce — MACOF Holding";
    } else {
      document.title = "MACOF Holding — L'Excellence Sans Compromis";
    }
  }, [location.pathname]);
  return null;
}

// Écran d'attente pendant le chargement d'une page à la demande
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#0b1220]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#cda434]/30 border-t-[#cda434]" />
    </div>
  );
}

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.defaults({
  toggleActions: "play none none reverse",
});

// ─── Guard Authentification Admin ──────────────────────────────────────────

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  const location = useLocation();

  const isLoginPage =
    location.pathname === "/admin" || location.pathname === "/admin/login";

  if (!token && !isLoginPage) {
    return <Navigate to="/admin/login" replace />;
  }

  if (token && isLoginPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

function AdminLayout() {
  return (
    <AdminRoute>
      <Outlet />
    </AdminRoute>
  );
}

// ─── Composant des Routes Animées ──────────────────────────────────────────

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        // Ancre (#section) : on amène l'utilisateur à la cible au lieu du haut de page
        if (location.hash) {
          window.setTimeout(() => {
            document
              .querySelector(location.hash)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
            ScrollTrigger.refresh();
          }, 60);
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          ScrollTrigger.refresh();
        }
      }}
    >
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <AnimatedPage>
              <Home />
            </AnimatedPage>
          }
        />
        <Route
          path="/about"
          element={
            <AnimatedPage>
              <About />
            </AnimatedPage>
          }
        />
        <Route
          path="/domaines"
          element={
            <AnimatedPage>
              <Domaines />
            </AnimatedPage>
          }
        />
        <Route
          path="/galerie"
          element={
            <AnimatedPage>
              <Galerie />
            </AnimatedPage>
          }
        />
        <Route
          path="/catalogues"
          element={
            <AnimatedPage>
              <Catalogues />
            </AnimatedPage>
          }
        />
        <Route
          path="/partenaires"
          element={
            <AnimatedPage>
              <Partenaires />
            </AnimatedPage>
          }
        />
        <Route
          path="/contact"
          element={
            <AnimatedPage>
              <Contact />
            </AnimatedPage>
          }
        />

        {/* Filiales */}
        <Route
          path="/immobilier"
          element={
            <AnimatedPage>
              <Immobilier />
            </AnimatedPage>
          }
        />
        <Route
          path="/restauration"
          element={
            <AnimatedPage>
              <Restauration />
            </AnimatedPage>
          }
        />
        <Route
          path="/restauration/produit/:id"
          element={
            <AnimatedPage>
              <ProductDetails />
            </AnimatedPage>
          }
        />
        <Route
          path="/checkout"
          element={
            <AnimatedPage>
              <Checkout />
            </AnimatedPage>
          }
        />
        <Route
          path="/transit"
          element={
            <AnimatedPage>
              <Transit />
            </AnimatedPage>
          }
        />
        <Route
          path="/mining"
          element={
            <AnimatedPage>
              <Mining />
            </AnimatedPage>
          }
        />
        <Route
          path="/fishing"
          element={
            <AnimatedPage>
              <Fishing />
            </AnimatedPage>
          }
        />
        <Route
          path="/print"
          element={
            <AnimatedPage>
              <Print />
            </AnimatedPage>
          }
        />

        {/* Publicité ouverte depuis une notification push */}
        <Route
          path="/promo/:id"
          element={
            <AnimatedPage>
              <Promo />
            </AnimatedPage>
          }
        />

        {/* Page 404 pour les URLs publiques inconnues */}
        <Route
          path="*"
          element={
            <AnimatedPage>
              <NotFound />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// ─── Layout Public ─────────────────────────────────────────────────────────

function PublicLayout() {
  // Smooth scroll (Lenis) réservé au site public : jamais sur l'admin,
  // où il entre en conflit avec les zones de défilement du tableau de bord.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.off("scroll", onScroll);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        {/* Un crash de rendu d'une page publique affiche un message propre
            au lieu d'un écran blanc */}
        <ErrorBoundary>
          <AnimatedRoutes /> {/* 👈 Intégration des routes animées ici */}
        </ErrorBoundary>
      </main>
      <Footer />
      <InstallPWAButton /> {/* Installation de l'app mobile (PWA) */}
    </div>
  );
}

// ─── App Principal ─────────────────────────────────────────────────────────

function App() {
  useRealtimeSync();

  return (
    <BrowserRouter>
      <TitleManager />
      <Toaster position="top-right" richColors closeButton />
      <CartProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin routes avec protection */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Login />} />
              <Route path="login" element={<Login />} />
              <Route element={<DashboardLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="demandes" element={<Leads />} />
                <Route path="commandes" element={<CommandesManager />} />
                <Route path="notifications" element={<NotificationsManager />} />
                <Route path="galerie" element={<GalerieManager />} />
                <Route path="catalogues" element={<CataloguesManager />} />
                <Route path="filiales" element={<FilialesManager />} />
                <Route path="pages" element={<PagesEditor />} />
                <Route path="stats" element={<StatsManager />} />
                <Route path="partenaires" element={<PartenairesManager />} />
                <Route path="temoignages" element={<TemoignagesManager />} />
                <Route path="realisations" element={<RealisationsManager />} />
                {/* <Route path="restauration" element={<RestaurationManager />} /> */}
                <Route path="menu">
                  <Route index element={<Navigate to="produits" replace />} />
                  <Route path="produits" element={<MenuProduitsPage />} />
                </Route>
                <Route path="settings" element={<Settings />} />
                <Route path="administrateurs" element={<AdminsManager />} />
              </Route>
            </Route>

            {/* Public routes avec layout partagé */}
            <Route path="/*" element={<PublicLayout />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
