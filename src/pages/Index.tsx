
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ApiKeyModal from '@/components/ApiKeyModal';
import SearchForm from '@/components/SearchForm';
import ResultsList, { Business } from '@/components/ResultsList';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.location.origin.includes("localhost")
  ? import.meta.env.VITE_SUPABASE_URL
  : "https://cehoymbdlrypvrulmbyd.supabase.co";
const supabaseAnonKey = window.location.origin.includes("localhost")
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : "YOUR_SUPABASE_ANON_KEY"; // troque por variáveis de ambiente se necessário

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

const Index = () => {
  // removemos apiKey pois não é mais necessário  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de API Key não é mais necessário, mas mantido para compatibilidade/opção futura.
  useEffect(() => {}, []);

  const handleSearch = async (address: string, radius: number, type: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { address, radius, type },
      });
      if (funcError) {
        setError("Erro: " + funcError.message);
        return;
      }
      if (data?.results) {
        // Adicione informações opcionais: website, instagram (caso venha, pouco provável), whatsapp (caso venha)
        setResults(data.results);
      } else if (data?.error) {
        setError("Erro: " + data.error);
      } else {
        setError("Nenhum resultado encontrado.");
      }
    } catch (err: any) {
      setError("Erro ao buscar empresas: " + String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSkeletons = () => (
    <div className="w-full max-w-4xl space-y-4 mt-8">
      <h2 className="text-2xl font-semibold">Buscando...</h2>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-foreground">
      <Header />
      <main>
        <section className="bg-sky-100/80 pt-16 pb-24">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-800">
              Encontre empresas locais para prospecção
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Defina o tipo de negócio e a localização para encontrar potenciais clientes para sua estratégia de vendas.
            </p>
          </div>
        </section>
        
        <section className="container mx-auto -mt-16">
          <div className="flex flex-col items-center gap-8">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
            {isLoading && <LoadingSkeletons />}
            {error && (
              <div className="w-full max-w-4xl mt-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                {error}
              </div>
            )}
            {!isLoading && hasSearched && !error && <ResultsList results={results} />}
          </div>
        </section>
      </main>
      {/* ApiKeyModal mantido, mas não usado mais */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Index;
