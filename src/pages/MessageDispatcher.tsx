import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Header from "@/components/Header";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone_number: string | null;
  status: string;
}

interface Message {
  type: "texto" | "imagem" | "audio" | "video";
  content: string;
}

export default function MessageDispatcher() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [minDelay, setMinDelay] = useState("2");
  const [maxDelay, setMaxDelay] = useState("5");
  const [messageCount, setMessageCount] = useState(1);
  const [messages, setMessages] = useState<Message[]>([{ type: "texto", content: "" }]);
  const [useAI, setUseAI] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);

  useEffect(() => {
    const newMessages = Array.from({ length: messageCount }, (_, i) => 
      messages[i] || { type: "texto" as const, content: "" }
    );
    setMessages(newMessages);
  }, [messageCount]);

  const loadInstances = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao carregar instâncias");
      return;
    }

    // Filter only connected instances
    const connected = (data || []).filter(inst => inst.status === "connected");
    setInstances(connected);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      const lines = csvContent.split("\n").map((l) => l.trim()).filter((l) => l);

      const phones: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(";");
        if (i === 0 && (parts[0].toLowerCase().includes("empresa") || parts[1]?.toLowerCase().includes("telefone"))) {
          continue;
        }
        if (parts.length > 1) {
          phones.push(parts[1].trim());
        }
      }

      setPhoneNumbers(phones.join("\n"));
    };
    reader.readAsText(file);
  };

  const updateMessage = (index: number, field: "type" | "content", value: string) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setMessages(newMessages);
  };

  const getRandomDelay = (min: number, max: number) => {
    return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
  };

  const getRandomInstance = () => {
    const index = Math.floor(Math.random() * selectedInstances.length);
    return selectedInstances[index];
  };

  const handleDispatch = async () => {
    const numbers = phoneNumbers.trim().split("\n").filter((n) => n);
    
    if (!numbers.length || !minDelay || !maxDelay || !selectedInstances.length) {
      toast.error("Preencha todos os campos e selecione pelo menos uma instância");
      return;
    }

    setIsSending(true);
    setProgress(0);
    const total = numbers.length;
    const logs: string[] = [];

    for (let i = 0; i < total; i++) {
      const instanceId = getRandomInstance();

      for (const msg of messages) {
        if (!msg.content.trim()) continue;

        try {
          const { data, error } = await supabase.functions.invoke("whatsapp-manager", {
            body: {
              action: "send-message",
              instanceId,
              number: numbers[i],
              message: msg.content,
              messageType: msg.type,
            },
          });

          if (error) throw error;

          logs.push(`✅ ${numbers[i]} via ${instanceId} - ${msg.type}: OK`);
        } catch (error: any) {
          logs.push(`❌ ${numbers[i]} via ${instanceId} - Erro: ${error.message}`);
        }
      }

      const pct = Math.floor(((i + 1) / total) * 100);
      setProgress(pct);
      setStatusText(`Enviando ${i + 1}/${total} (${pct}%)`);

      if (i < total - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, getRandomDelay(parseInt(minDelay), parseInt(maxDelay)))
        );
      }
    }

    setStatusText("✅ Todos os envios foram concluídos!");
    setIsSending(false);

    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "log-disparos.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleInstance = (instanceId: string) => {
    setSelectedInstances((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary">Disparador de Mensagens</h1>
          </div>

          <div className="space-y-6">
            <div>
              <Label>Selecione as Instâncias (será aleatório por número)</Label>
              <div className="border rounded-lg p-4 mt-2 space-y-2 max-h-48 overflow-y-auto">
                {instances.map((inst) => (
                  <div key={inst.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedInstances.includes(inst.id)}
                      onChange={() => toggleInstance(inst.id)}
                      className="rounded"
                    />
                    <span>{inst.instance_name} {inst.phone_number && `(${inst.phone_number})`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="numeros">Números de telefone (1 por linha)</Label>
              <Textarea
                id="numeros"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder="Ex: 5599999999999"
                rows={5}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="arquivoCsv">Ou envie um arquivo CSV (colunas: empresa;telefone)</Label>
              <Input
                id="arquivoCsv"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempoMin">Tempo mínimo (segundos)</Label>
                <Input
                  id="tempoMin"
                  type="number"
                  value={minDelay}
                  onChange={(e) => setMinDelay(e.target.value)}
                  placeholder="Ex: 2"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="tempoMax">Tempo máximo (segundos)</Label>
                <Input
                  id="tempoMax"
                  type="number"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  placeholder="Ex: 5"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qtdMensagens">Quantidade de mensagens por número</Label>
              <Input
                id="qtdMensagens"
                type="number"
                value={messageCount}
                onChange={(e) => setMessageCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="mt-2"
              />
            </div>

            {messages.map((msg, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <Label>Mensagem {index + 1}</Label>
                <Select
                  value={msg.type}
                  onValueChange={(value: any) => updateMessage(index, "type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="imagem">Imagem</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={msg.content}
                  onChange={(e) => updateMessage(index, "content", e.target.value)}
                  placeholder={msg.type === "texto" ? "Digite o texto" : "Cole o link do arquivo"}
                />
                {msg.content && msg.type === "imagem" && /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content) && (
                  <img src={msg.content} alt="preview" className="max-w-full max-h-48 rounded object-contain" />
                )}
              </div>
            ))}

            <div className="flex items-center gap-3">
              <Switch id="usarIA" checked={useAI} onCheckedChange={setUseAI} />
              <Label htmlFor="usarIA">Usar IA para ajustes automáticos no texto</Label>
            </div>

            <Button
              onClick={handleDispatch}
              disabled={isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? "Enviando..." : "🚀 Disparar"}
            </Button>

            {isSending && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-center font-semibold">{statusText}</p>
              </div>
            )}

            {!isSending && statusText && (
              <p className="text-center font-semibold text-green-500">{statusText}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
