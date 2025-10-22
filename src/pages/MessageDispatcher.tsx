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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save } from "lucide-react";
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
  const [instanceName, setInstanceName] = useState("");
  const [instanceStatus, setInstanceStatus] = useState<'idle' | 'checking' | 'active' | 'refused'>('idle');
  const [instanceMessage, setInstanceMessage] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [minDelay, setMinDelay] = useState("2");
  const [maxDelay, setMaxDelay] = useState("5");
  const [messageCount, setMessageCount] = useState(1);
  const [messages, setMessages] = useState<Message[]>([{ type: "texto", content: "" }]);
  const [useAI, setUseAI] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [savedLists, setSavedLists] = useState<Array<{id: string, name: string, companies: any[]}>>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const newMessages = Array.from({ length: messageCount }, (_, i) => 
      messages[i] || { type: "texto" as const, content: "" }
    );
    setMessages(newMessages);
  }, [messageCount]);

  useEffect(() => {
    if (user) {
      loadSavedLists();
    }
  }, [user]);

  const loadSavedLists = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("saved_lists")
        .select("id, name, companies")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setSavedLists((data || []).map(item => ({
        id: item.id,
        name: item.name,
        companies: Array.isArray(item.companies) ? item.companies : []
      })));
    } catch (error: any) {
      console.error("Erro ao carregar listas:", error);
    }
  };

  const validateInstance = async () => {
    if (!instanceName.trim()) {
      setInstanceStatus('idle');
      setInstanceMessage("");
      return;
    }

    setInstanceStatus('checking');
    setInstanceMessage("Verificando instância...");

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-manager", {
        body: {
          action: "validate-instance",
          instanceName: instanceName.trim()
        }
      });

      if (error) throw error;

      if (data.valid) {
        setInstanceStatus('active');
        setInstanceMessage("Instância ativa");
      } else {
        setInstanceStatus('refused');
        setInstanceMessage(data.message || "Instância recusada");
      }
    } catch (error: any) {
      setInstanceStatus('refused');
      setInstanceMessage("Erro ao verificar instância");
      console.error(error);
    }
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

  const handleLoadListFromSelect = (listId: string) => {
    setSelectedListId(listId);
    
    const selectedList = savedLists.find(list => list.id === listId);
    if (!selectedList) return;
    
    const phones = selectedList.companies.map((company: any) => company.phone || "").filter(Boolean);
    setPhoneNumbers(phones.join("\n"));
    
    toast.success(`Lista "${selectedList.name}" carregada com ${phones.length} números`);
  };

  const updateMessage = (index: number, field: "type" | "content", value: string) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setMessages(newMessages);
  };

  const getRandomDelay = (min: number, max: number) => {
    return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      toast.error("Digite um nome para a lista");
      return;
    }

    const numbers = phoneNumbers.trim().split("\n").filter((n) => n);
    if (!numbers.length) {
      toast.error("Adicione números antes de salvar a lista");
      return;
    }

    try {
      const companies = numbers.map((phone, index) => ({
        name: `Contato ${index + 1}`,
        phone: phone.trim()
      }));

      const { error } = await supabase
        .from("saved_lists")
        .insert({
          user_id: user?.id,
          name: listName.trim(),
          companies: companies
        });

      if (error) throw error;

      toast.success("Lista salva com sucesso!");
      setIsDialogOpen(false);
      setListName("");
      loadSavedLists();
    } catch (error: any) {
      console.error("Erro ao salvar lista:", error);
      toast.error("Erro ao salvar lista: " + error.message);
    }
  };

  const handleDispatch = async () => {
    const numbers = phoneNumbers.trim().split("\n").filter((n) => n);
    
    if (!numbers.length || !minDelay || !maxDelay) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (instanceStatus !== 'active') {
      toast.error("Por favor, insira uma instância ativa antes de disparar");
      return;
    }

    setIsSending(true);
    setProgress(0);
    const total = numbers.length;
    const logs: string[] = [];

    for (let i = 0; i < total; i++) {
      for (const msg of messages) {
        if (!msg.content.trim()) continue;

        try {
          const { data, error } = await supabase.functions.invoke("whatsapp-manager", {
            body: {
              action: "send-message",
              instanceId: instanceName,
              number: numbers[i],
              message: msg.content,
              messageType: msg.type,
            },
          });

          if (error) throw error;

          logs.push(`✅ ${numbers[i]} via ${instanceName} - ${msg.type}: OK`);
        } catch (error: any) {
          logs.push(`❌ ${numbers[i]} via ${instanceName} - Erro: ${error.message}`);
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
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onBlur={validateInstance}
                placeholder="Digite o nome da instância"
                className="mt-2"
              />
              {instanceStatus === 'checking' && (
                <p className="text-blue-500 mt-2 text-sm">🔍 Verificando instância...</p>
              )}
              {instanceStatus === 'active' && (
                <p className="text-green-500 mt-2 text-sm font-semibold">✅ Instância ativa</p>
              )}
              {instanceStatus === 'refused' && (
                <p className="text-red-500 mt-2 text-sm font-semibold">❌ {instanceMessage}</p>
              )}
            </div>

            <div>
              <Label htmlFor="selectList">Carregar Lista Salva</Label>
              <Select value={selectedListId} onValueChange={handleLoadListFromSelect}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione uma lista salva" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {savedLists.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhuma lista salva
                    </SelectItem>
                  ) : (
                    savedLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.companies?.length || 0} contatos)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="numeros">Números de telefone (1 por linha)</Label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Lista
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar Lista de Contatos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="listName">Nome da Lista</Label>
                        <Input
                          id="listName"
                          value={listName}
                          onChange={(e) => setListName(e.target.value)}
                          placeholder="Digite o nome da lista"
                          className="mt-2"
                        />
                      </div>
                      <Button onClick={handleSaveList} className="w-full">
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                id="numeros"
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                placeholder="Ex: 5599999999999"
                rows={5}
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
