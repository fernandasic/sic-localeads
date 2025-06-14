import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import ResultsList, { Business } from '@/components/ResultsList';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Save, FolderOpen, Download } from 'lucide-react';
import SavedListsModal from '@/components/SavedListsModal';
import { downloadCSV } from '@/utils/csvDownload';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{
    address: string;
    radius: number;
    type: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedListsModalOpen, setSavedListsModalOpen] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSearch = async (address: string, radius: number, type: string) => {
    if (!user) {
      setError('Você precisa estar logado para fazer pesquisas');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setError(null);
    setLastSearchParams({ address, radius, type });

    try {
      const { data, error: funcError } = await supabase.functions.invoke("google-maps-proxy", {
        body: { address, radius, type },
      });

      if (funcError) {
        setError("Erro na comunicação com o servidor: " + funcError.message);
        return;
      }

      if (data?.error) {
        setError("Erro: " + data.error);
      } else if (data?.results) {
        setResults(data.results);
        
        // Temporariamente removido o salvamento de histórico devido a problemas de tipos
        // será restaurado quando os tipos do Supabase forem atualizados

        if (data.results.length === 0) {
          // ResultsList já lida com isso
        }
      } else {
        setError("Recebida uma resposta inesperada do servidor.");
      }
    } catch (err: any) {
      setError("Erro ao executar a busca: " + String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!user || !lastSearchParams || results.length === 0) {
      toast({
        title: "Erro",
        description: "Não há resultados para salvar",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const listName = `Lista ${lastSearchParams.type} - ${new Date().toLocaleDateString('pt-BR')}`;
      
      const { error: saveError } = await supabase
        .from('saved_lists')
        .insert({
          user_id: user.id,
          name: listName,
          search_params: lastSearchParams,
          companies: results
        });

      if (saveError) {
        toast({
          title: "Erro",
          description: "Erro ao salvar lista: " + saveError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Lista salva com sucesso como "${listName}"!`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar: " + String(err),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedList = (companies: any[]) => {
    setResults(companies);
    setHasSearched(true);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) {
      toast({
        title: "Erro",
        description: "Não há resultados para fazer download",
        variant: "destructive",
      });
      return;
    }

    const filename = lastSearchParams 
      ? `empresas_${lastSearchParams.type}_${lastSearchParams.address.replace(/\s+/g, '_')}`
      : 'empresas';
    
    downloadCSV(results, filename);
    
    toast({
      title: "Sucesso",
      description: "Download do CSV iniciado!",
    });
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

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!user) {
    return null;
  }

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
            {!isLoading && hasSearched && !error && (
              <div className="w-full max-w-4xl">
                {results.length > 0 && (
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSavedListsModalOpen(true)}
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Ver Listas Salvas
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleDownloadCSV}
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                      <Button 
                        onClick={handleSaveResults}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Lista'}
                      </Button>
                    </div>
                  </div>
                )}
                <ResultsList results={results} />
              </div>
            )}
          </div>
        </section>
      </main>
      
      <SavedListsModal 
        isOpen={savedListsModalOpen}
        onClose={() => setSavedListsModalOpen(false)}
        onLoadList={handleLoadSavedList}
      />
    </div>
  );
};

export default Index;
