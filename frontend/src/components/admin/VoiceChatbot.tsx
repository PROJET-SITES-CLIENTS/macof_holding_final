import { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Mic, MicOff, Loader2, Volume2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function VoiceChatbot() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substring(2, 9));

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const handleSendVoiceCommand = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) {
      toast.error("Aucun texte capturé. Réessayez de parler.");
      return;
    }

    console.log("[VoiceChatbot] Envoi vers le backend :", text);
    setIsProcessing(true);

    try {
      // Ajustez le chemin de l'URL si votre route backend Hono est différente
      const response = await api.post("/api/v1/admin/chatbot/voice", {
        sessionId,
        transcript: text,
      });

      console.log("[VoiceChatbot] Réponse backend :", response?.data);

      if (response.data?.success) {
        const replyText = response.data.data?.message || "Action exécutée avec succès";
        setLastResponse(replyText);
        speakResponse(replyText);
      } else {
        toast.error("Le serveur n'a pas pu traiter la commande.");
      }
    } catch (error: any) {
      console.error("[VoiceChatbot] Erreur réseau / API :", error);
      toast.error("Échec de l'envoi de la commande vocale.");
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleListening = async () => {
    if (listening) {
      // Arrêt de l'écoute et envoi immédiat
      SpeechRecognition.stopListening();
      console.log("[VoiceChatbot] Clic stop -> Envoi du texte :", transcript);
      if (transcript.trim().length > 0) {
        handleSendVoiceCommand(transcript);
      } else {
        toast.warning("Aucune voix détectée.");
      }
    } else {
      // Démarrage de l'écoute
      setLastResponse(null);
      resetTranscript();
      try {
        await SpeechRecognition.startListening({
          continuous: true,
          language: "fr-FR",
        });
        console.log("[VoiceChatbot] Démarrage de l'écoute...");
      } catch (err) {
        console.error("[VoiceChatbot] Erreur démarrage micro :", err);
        toast.error("Erreur lors de l'accès au microphone.");
      }
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-[#cda434]/30 bg-[#cda434]/10 px-2.5 py-1 text-xs text-[#e0b83d]">
        <MicOff className="h-3.5 w-3.5" />
        <span>Navigateur non compatible</span>
      </div>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
        <MicOff className="h-3.5 w-3.5" />
        <span>Micro indisponible</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {lastResponse && (
        <div className="hidden max-w-xs items-center gap-2 truncate rounded-xl border border-[#cda434]/30 bg-[#cda434]/10 px-3 py-1.5 text-xs text-slate-300 md:flex">
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#cda434]" />
          <span className="truncate">{lastResponse}</span>
        </div>
      )}

      {/* Texte capturé en temps réel */}
      {listening && (
        <div className="flex items-center gap-2 rounded-xl border border-[#cda434]/30 bg-[#cda434]/10 px-3 py-1">
          <span className="max-w-[200px] truncate text-xs font-medium text-[#e0b83d]">
            {transcript ? transcript : "Parlez..."}
          </span>
          {transcript.trim().length > 0 && (
            <button
              onClick={() => {
                SpeechRecognition.stopListening();
                handleSendVoiceCommand(transcript);
              }}
              className="rounded-lg bg-gradient-to-r from-[#cda434] to-[#e0b83d] p-1 text-[#1a1405] transition-all duration-300 hover:brightness-110"
              title="Envoyer la commande"
            >
              <Send className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleListening}
        disabled={isProcessing}
        title={listening ? "Cliquez pour arrêter et envoyer" : "Démarrer l'enregistrement"}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
          listening
            ? "animate-pulse border border-[#cda434]/30 bg-[#cda434]/10 text-[#e0b83d] ring-2 ring-[#cda434]/40"
            : isProcessing
            ? "border border-[#cda434]/30 bg-[#cda434]/10 text-[#e0b83d]"
            : "border border-[#cda434]/30 bg-[#cda434]/10 text-[#e0b83d] hover:bg-[#cda434]/20"
        }`}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : listening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}