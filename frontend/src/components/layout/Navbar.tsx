import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CartNavbarLink } from '../restauration/CartNavbarLink';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu sur changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-700 ease-in-out border-b",
        scrolled || isMobileMenuOpen
          ? "bg-blue-950/95 backdrop-blur-md py-4 border-white/10 shadow-sm" 
          : "bg-transparent py-8 border-transparent"
      )}>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center">
            
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src="/logo-macof.png" alt="MACOF HOLDING" className="h-10 md:h-14 w-auto object-contain" />
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-12">
              <Link to="/" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">Accueil</Link>
              <Link to="/about" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">À propos</Link>
              <Link to="/domaines" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">Domaines d'Activité</Link>
              <Link to="/galerie" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">Galerie</Link>
              <Link to="/partenaires" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">Partenaires</Link>
              <Link to="/catalogues" className="text-[10px] font-sans text-white/80 hover:text-white transition-colors tracking-[0.2em] uppercase">Documents</Link>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <CartNavbarLink />
              <Link to="/contact">
                <Button variant="outline" size="sm" className="text-[10px] tracking-widest uppercase px-6 border-white/50 text-white hover:bg-white hover:text-black">
                  Contact
                </Button>
              </Link>
            </div>

            <div className="lg:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-red-500 transition-colors p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6 stroke-1" /> : <Menu className="h-6 w-6 stroke-1" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-blue-950/95 backdrop-blur-xl lg:hidden flex flex-col items-center justify-center pt-20">
            <div className="flex flex-col items-center space-y-8 w-full px-6">
            <Link to="/" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">Accueil</Link>
            <Link to="/about" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">À propos</Link>
            <Link to="/domaines" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">Domaines d'Activité</Link>
            <Link to="/galerie" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">Galerie</Link>
            <Link to="/partenaires" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">Partenaires</Link>
            <Link to="/catalogues" className="text-sm font-sans text-white hover:text-red-500 transition-colors tracking-[0.2em] uppercase w-full text-center py-4 border-b border-white/10">Documents</Link>
            
            <Link to="/contact" className="pt-8">
              <Button variant="outline" size="lg" className="text-xs tracking-widest uppercase px-12 border-white/50 text-white hover:bg-white hover:text-black">
                Contactez-nous
              </Button>
            </Link>
            <CartNavbarLink />
          </div>
        </div>
      )}
    </>
  );
}


