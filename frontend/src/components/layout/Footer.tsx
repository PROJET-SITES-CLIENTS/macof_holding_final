import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { useSettings } from "../../hooks/useSettings";

function socialHref(value?: string) {
  const url = value?.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function Footer() {
  const { settings } = useSettings();
  const emails = (settings.contact_email || "")
    .split(/[;,\n]+/)
    .map((email) => email.trim())
    .filter(Boolean);
  const socialLinks = {
    linkedin: socialHref(settings.social_linkedin),
    facebook: socialHref(settings.social_facebook),
    instagram: socialHref(settings.social_instagram),
    twitter: socialHref(settings.social_twitter),
  };

  return (
    <footer className="bg-[#050b14] border-t border-white/10 relative overflow-hidden">
      {/* Background Image */}
      {/* Background Image */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://media.istockphoto.com/id/1127533037/photo/attractive-smiling-people-are-in-the-street-festival.jpg?s=612x612&w=0&k=20&c=qw0cf3q7lR0uSEfLTMa1_L-aAQ8H4YGko-O5ESm-8Jg=')] bg-cover bg-center mix-blend-overlay opacity-10" />

      {/* Background decorative element */}
      <div className="absolute top-0 left-0 w-full h-px pointer-events-none bg-gradient-to-r from-transparent via-[#0A4287]/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-[#0A4287]/5 blur-[120px] pointer-events-none" />

      {/* Main Footer Content */}
      <div className="relative z-10 max-w-[100rem] mx-auto px-6 lg:px-12 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <img
                src="/logo-macof.png"
                alt="MACOF HOLDING"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-white/60 font-light text-sm leading-relaxed mb-8 max-w-sm">
              Construire, développer et transformer durablement des secteurs
              stratégiques de l'économie à travers six filiales spécialisées.
            </p>
            <div className="space-y-3 text-sm font-sans">
              {settings.contact_phone && (
                <a
                  href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                >
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287]">
                    <Phone size={15} />
                  </span>
                  {settings.contact_phone}
                </a>
              )}
              {emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                >
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287]">
                    <Mail size={15} />
                  </span>
                  {email}
                </a>
              ))}
              {settings.contact_address && (
                <div className="flex items-start gap-3 text-white/70">
                  <span className="w-8 h-8 rounded-full border border-[#0A4287]/50 flex items-center justify-center text-[#0A4287] flex-shrink-0">
                    <MapPin size={15} />
                  </span>
                  <span>{settings.contact_address}</span>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Réseaux sociaux</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "LinkedIn", url: socialLinks.linkedin, icon: <FaLinkedinIn size={18} /> },
                    { label: "Facebook", url: socialLinks.facebook, icon: <FaFacebookF size={18} /> },
                    { label: "Instagram", url: socialLinks.instagram, icon: <FaInstagram size={18} /> },
                    { label: "Twitter (X)", url: socialLinks.twitter, icon: <FaTwitter size={18} /> },
                  ].map((social) => social.url ? (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="inline-flex items-center gap-2 px-3 h-10 text-white/75 border border-white/15 hover:text-white hover:border-[#0A4287] transition-colors"
                    >
                      {social.icon}
                      <span className="text-xs">{social.label}</span>
                    </a>
                  ) : (
                    <span
                      key={social.label}
                      title={`Lien ${social.label} non configuré`}
                      className="inline-flex items-center gap-2 px-3 h-10 text-white/30 border border-white/10 cursor-not-allowed"
                    >
                      {social.icon}
                      <span className="text-xs">{social.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Nos Filiales */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">
              Nos Filiales
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/immobilier"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  MACOF Immobilier
                </Link>
              </li>
              <li>
                <Link
                  to="/restauration"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  SEBA International
                </Link>
              </li>
              <li>
                <Link
                  to="/print"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  MACOF Print & Com
                </Link>
              </li>
              <li>
                <Link
                  to="/mining"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  MACOF Mining
                </Link>
              </li>
              <li>
                <Link
                  to="/transit"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  MACOF Transit
                </Link>
              </li>
              <li>
                <Link
                  to="/fishing"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-[#0A4287] rounded-full" />
                  MACOF Fishing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigation */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />À
                  propos
                </Link>
              </li>
              <li>
                <Link
                  to="/domaines"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Domaines d'activité
                </Link>
              </li>
              <li>
                <Link
                  to="/galerie"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Galerie
                </Link>
              </li>
              <li>
                <Link
                  to="/partenaires"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Partenaires
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogues"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Documents
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-white/60 font-light text-sm hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter / CTA */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.3em] text-[#b8142b] uppercase mb-8">
              Restons en Contact
            </h4>
            <p className="text-white/60 font-light text-sm leading-relaxed mb-6">
              Vous avez un projet ou une question ? N'hésitez pas à nous
              contacter directement.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#0A4287] text-white text-sm tracking-widest uppercase font-sans hover:bg-[#0A4287]/80 transition-colors"
            >
              Nous contacter
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <div className="mt-8">
              <p className="text-white/40 text-xs font-light">
                Lun - Ven : 08h00 - 18h00
                <br />
                Sam : 09h00 - 13h00
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-light tracking-wider">
            © {new Date().getFullYear()} MACOF Holding — L'art de façonner
            l'avenir. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link
              to="/contact"
              className="text-white/40 text-xs font-light hover:text-white/70 transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              to="/contact"
              className="text-white/40 text-xs font-light hover:text-white/70 transition-colors"
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
