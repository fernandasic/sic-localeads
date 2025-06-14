
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle } from "lucide-react";

const EDGE_FUNCTION_URL = "https://cehoymbdlrypvrulmbyd.supabase.co/functions/v1/openai-gpt";

const GptChatBox = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.generatedText) {
        setResponse(data.generatedText);
      } else if (data.error) {
        setError("Erro: " + data.error);
      } else {
        setError("Nenhuma resposta recebida.");
      }
    } catch (err: any) {
      setError("Erro na requisição: " + String(err));
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-cyan-600" />
          Chat com IA (OpenAI)
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="prompt">Mensagem para IA</Label>
            <Textarea
              id="prompt"
              value={prompt}
              rows={3}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Digite sua pergunta ou solicitação..."
              disabled={loading}
              required
              className="resize-none mt-1"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
            {loading ? "Consultando IA..." : "Enviar"}
          </Button>
        </form>
        {error && <div className="text-red-600 mt-3">{error}</div>}
        {response && (
          <div className="border rounded-lg bg-gray-50 text-gray-700 p-4 mt-4 whitespace-pre-line">
            <b>Resposta IA:</b>
            <div className="mt-2">{response}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GptChatBox;
