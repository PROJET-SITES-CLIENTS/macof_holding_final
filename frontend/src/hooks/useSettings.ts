import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export interface SiteSettings {
  // Clés publiques
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  social_twitter: string;
  whatsapp_number: string;
  // Clés d'administration / SMTP
  smtp_host?: string;
  smtp_port?: string;
  smtp_email?: string;
  smtp_password?: string;
  smtp_secure?: string;
  [key: string]: string | undefined;
}

const defaultSettings: SiteSettings = {
  contact_email: "macofholding2018@gmail.com",
  contact_phone: "+224 625 74 46 26",
  contact_address:
    "Manquepa, en face de Banc Bleu, Kaloum, Conakry, République de Guinée",
  social_facebook: "",
  social_linkedin: "",
  social_instagram: "",
  social_twitter: "",
  whatsapp_number: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_email: "",
  smtp_password: "",
  smtp_secure: "false",
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les paramètres depuis le serveur
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/settings");
      if (res.data.success && res.data.data?.map) {
        const map = res.data.data.map;
        setSettings((prev) => ({
          ...prev,
          ...map,
          // Valeurs par défaut si absentes du serveur
          contact_email: map.contact_email || defaultSettings.contact_email,
          contact_phone: map.contact_phone || defaultSettings.contact_phone,
          contact_address:
            map.contact_address || defaultSettings.contact_address,
        }));
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des paramètres", err);
      setError(
        err.response?.data?.message || "Impossible de charger les paramètres",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Sauvegarder les modifications (depuis le panneau d'administration)
  const saveSettings = async (updatedSettings: Partial<SiteSettings>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post("/api/v1/settings/bulk", {
        settings: updatedSettings,
      });

      if (res.data.success) {
        setSettings((prev) => ({ ...prev, ...updatedSettings }));
        return {
          success: true,
          message: res.data.message || "Paramètres enregistrés",
        };
      }
      throw new Error(res.data.message);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la sauvegarde";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setSaving(false);
    }
  };

  // Envoyer un e-mail de test SMTP
  const testSmtp = async (targetEmail: string) => {
    setTestingSmtp(true);
    try {
      const res = await api.post("/api/v1/settings/test-email", {
        email: targetEmail,
      });
      return {
        success: true,
        message: res.data.message || "E-mail de test envoyé",
      };
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message || "Échec de l'envoi de l'e-mail de test",
      };
    } finally {
      setTestingSmtp(false);
    }
  };

  return {
    settings,
    setSettings,
    loading,
    saving,
    testingSmtp,
    error,
    fetchSettings,
    saveSettings,
    testSmtp,
  };
}
