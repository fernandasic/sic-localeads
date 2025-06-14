
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Eye } from 'lucide-react';

interface SavedList {
  id: string;
  name: string;
  created_at: string;
  companies: any[];
  search_params: any;
}

interface SavedListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadList: (companies: any[]) => void;
}

const SavedListsModal = ({ isOpen, onClose, onLoadList }: SavedListsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSavedLists();
    }
  }, [isOpen, user]);

  const loadSavedLists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar listas salvas: " + error.message,
          variant: "destructive",
        });
      } else {
        setSavedLists(data || []);
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado: " + String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao deletar lista: " + error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Lista deletada com sucesso!",
        });
        loadSavedLists();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado: " + String(err),
        variant: "destructive",
      });
    }
  };

  const handleLoadList = (list: SavedList) => {
    onLoadList(list.companies);
    onClose();
    toast({
      title: "Sucesso",
      description: "Lista carregada com sucesso!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Listas Salvas</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : savedLists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma lista salva encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {savedLists.map((list) => (
              <div key={list.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{list.name}</h3>
                  <p className="text-sm text-gray-500">
                    {list.companies.length} empresas • {new Date(list.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadList(list)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Carregar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteList(list.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedListsModal;
