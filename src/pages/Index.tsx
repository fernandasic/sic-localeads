
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ApiKeyModal from '@/components/ApiKeyModal';
import SearchForm from '@/components/SearchForm';
import ResultsList, { Business } from '@/components/ResultsList';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data para simular a resposta da API
const mockResults: Business[] = [
  {
    name: 'Contabilidade Exemplo Alfa',
    address: 'Rua das Flores, 123, São Paulo, SP',
    phone: '(11) 98765-4321',
    rating: 4.5,
    opening_hours: 'Aberto agora',
  },
  {
    name: 'Pet Shop Amigo Fiel',
    address: 'Av. dos Animais, 456, São Paulo, SP',
    phone: '(11) 12345-6789',
    rating: 4.8,
    opening_hours: 'Fechado',
  },
];

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleMapsApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('googleMapsApiKey', key);
    setApiKey(key);
    setIsModalOpen(false);
  };

  const handleSearch = (address: string, radius: number, type: string) => {
    if (!apiKey) {
      setIsModalOpen(true);
      return;
    }
    console.log('Buscando por:', { address, radius, type, apiKey });

    // Lógica de chamada à API do Google Maps virá aqui.
    // Por enquanto, vamos simular uma chamada.
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setTimeout(() => {
      // Aqui você substituiria mockResults pelos dados reais da API
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };
  
  const LoadingSkeletons = () => (
    <div className="w-full max-w-4xl space-y-4">
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
    <div className="min-h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setIsModalOpen(true)} />
      <main className="container mx-auto py-8 flex flex-col items-center gap-8">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        {isLoading && <LoadingSkeletons />}
        {!isLoading && hasSearched && <ResultsList results={results} />}
      </main>
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApiKey}
      />
    </div>
  );
};

export default Index;
