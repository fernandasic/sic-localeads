
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const businessTypes = [
  { value: 'accounting', label: 'Escritórios de Contabilidade' },
  { value: 'clinic', label: 'Clínicas' },
  { value: 'pet_store', label: 'Pet Shops' },
  { value: 'restaurant', label: 'Restaurantes' },
  { value: 'gym', label: 'Academias' },
  { value: 'lawyer', label: 'Escritórios de Advocacia' },
];

interface SearchFormProps {
  onSearch: (address: string, radius: number, type: string) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState('5');
  const [type, setType] = useState('accounting');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(address, Number(radius) * 1000, type); // Convert km to meters
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Encontrar Potenciais Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço ou Localidade</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. Paulista, 1578, São Paulo"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radius">Raio (km)</Label>
              <Input
                id="radius"
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                min="1"
                max="50"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Setor ou Nicho</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar Negócios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
