
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
    console.log('Index - Estado da autenticação:', { user: !!user, authLoading });
    
    if (!authLoading && !user) {
      console.log('Usuário não autenticado, redirecionando para /auth');
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
      console.log('Chamando Google Maps API via Edge Function:', { address, radius, type });
      
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          address: address,
          radius: radius * 1000, // Converter km para metros
          type: type
        }
      });

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message || 'Erro ao chamar a Edge Function');
      }

      console.log('Resposta da Edge Function:', data);

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
          setError("Nenhuma empresa encontrada para os critérios informados.");
          setResults([]);
          return;
        }

        const empresasMapeadas = data.results.map((empresa: any) => ({
          name: empresa.name || '',
          address: empresa.address || '',
          phone: empresa.phone || '',
          rating: empresa.rating || 0,
          website: empresa.website || '',
          opening_hours: empresa.opening_hours,
          instagram: empresa.instagram,
          whatsapp: empresa.whatsapp,
        }));

        setResults(empresasMapeadas);
      } else {
        console.error('Formato de resposta inesperado:', data);
        setError("Recebida uma resposta inesperada da API.");
      }
    } catch (err: any) {
      setError("Erro ao executar a busca: " + String(err.message || err));
      console.error('Erro ao buscar empresas:', err);
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
          search_params: lastSearchParams as any,
          companies: results as any
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar estado de carregamento durante redirecionamento
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
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
