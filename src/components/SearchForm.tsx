
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { MapPin, Search, Plus } from 'lucide-react';

const businessTypes = [
  { value: 'doctor', label: 'Médicos' },
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
  const [newSegment, setNewSegment] = useState('');
  const [customBusinessTypes, setCustomBusinessTypes] = useState(businessTypes);
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState([5]);
  const [type, setType] = useState('doctor');

  const handleAddSegment = () => {
    if (newSegment.trim()) {
      const newType = {
        value: newSegment.toLowerCase().replace(/\s+/g, '_'),
        label: newSegment.trim()
      };
      setCustomBusinessTypes([...customBusinessTypes, newType]);
      setNewSegment('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(address, radius[0] * 1000, type); // Convert km to meters
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="newSegment">Novo segmento</Label>
              <div className="flex gap-2">
                <Input
                  id="newSegment"
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value)}
                  placeholder="Digite um novo segmento"
                />
                <Button type="button" onClick={handleAddSegment} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de empresa</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {customBusinessTypes.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Localização</Label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="CEP, cidade ou endereço"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius" className="pb-1.5 block">Raio de busca: {radius[0]} km</Label>
              <Slider
                id="radius"
                min={1}
                max={50}
                step={1}
                value={radius}
                onValueChange={setRadius}
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" disabled={isLoading}>
            <Search className="mr-2 h-5 w-5" />
            {isLoading ? 'Buscando...' : 'Buscar empresas'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
