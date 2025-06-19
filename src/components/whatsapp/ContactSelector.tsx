import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SavedListsModal from '@/components/SavedListsModal';
import { Upload, FolderOpen, Users } from 'lucide-react';

interface ContactSelectorProps {
  selectedContacts: any[];
  onContactsChange: (contacts: any[]) => void;
}

const ContactSelector = ({ selectedContacts, onContactsChange }: ContactSelectorProps) => {
  const [savedListsModalOpen, setSavedListsModalOpen] = useState(false);

  const handleLoadSavedList = (companies: any[]) => {
    const contacts = companies.map(company => ({
      name: company.name,
      phone: company.phone || company.formatted_phone_number,
      source: 'saved_list'
    })).filter(contact => contact.phone);
    
    onContactsChange(contacts);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const contacts = lines.slice(1).map(line => {
        const [name, phone] = line.split(',');
        return { name: name?.trim(), phone: phone?.trim(), source: 'csv' };
      }).filter(contact => contact.name && contact.phone);
      
      onContactsChange([...selectedContacts, ...contacts]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="saved">Listas Salvas</TabsTrigger>
          <TabsTrigger value="upload">Upload CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4">
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Usar Listas Salvas</h3>
            <p className="text-gray-600 mb-4">
              Selecione contatos das suas listas de empresas já salvas
            </p>
            <Button onClick={() => setSavedListsModalOpen(true)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Escolher Lista Salva
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="text-center py-8">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload de Contatos</h3>
            <p className="text-gray-600 mb-4">
              Faça upload de um arquivo CSV com nome e telefone
            </p>
            <div className="max-w-xs mx-auto">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Arquivo CSV
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Formato: nome,telefone (uma linha por contato)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedContacts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contatos Selecionados
              <Badge variant="secondary">{selectedContacts.length}</Badge>
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onContactsChange([])}
            >
              Limpar Todos
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            {selectedContacts.map((contact, index) => (
              <div key={index} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                </div>
                <Badge variant={contact.source === 'csv' ? 'default' : 'secondary'}>
                  {contact.source === 'csv' ? 'CSV' : 'Lista'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <SavedListsModal 
        isOpen={savedListsModalOpen}
        onClose={() => setSavedListsModalOpen(false)}
        onLoadList={handleLoadSavedList}
      />
    </div>
  );
};

export default ContactSelector;
