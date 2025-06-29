
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, CheckCircle } from 'lucide-react';

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  phone_number: string | null;
  status: 'pending' | 'connected' | 'disconnected';
  created_at: string;
}

interface InstanceManagerProps {
  onInstanceSelect?: (instanceId: string | null) => void;
}

const InstanceManager = ({ onInstanceSelect }: InstanceManagerProps) => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);

  useEffect(() => {
    // Auto-selecionar primeira instância conectada
    const connectedInstance = instances.find(inst => inst.status === 'connected');
    if (connectedInstance && !selectedInstanceId) {
      setSelectedInstanceId(connectedInstance.instance_id);
      onInstanceSelect?.(connectedInstance.instance_id);
    }
  }, [instances, selectedInstanceId, onInstanceSelect]);

  const loadInstances = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar instâncias:', error);
      } else {
        setInstances((data as WhatsAppInstance[]) || []);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectInstance = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    onInstanceSelect?.(instanceId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Conectado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-500">Desconectado</Badge>;
      default:
        return <Badge className="bg-gray-500">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Carregando instâncias...</p>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma instância encontrada.</p>
        <p className="text-sm">Conecte seu primeiro WhatsApp para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {instances.map((instance) => (
        <div 
          key={instance.id} 
          className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-colors ${
            selectedInstanceId === instance.instance_id 
              ? 'border-primary bg-primary/5' 
              : 'hover:border-gray-300'
          }`}
          onClick={() => instance.status === 'connected' && selectInstance(instance.instance_id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {selectedInstanceId === instance.instance_id && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="font-medium text-sm">{instance.instance_id}</p>
                {instance.phone_number && (
                  <p className="text-sm text-gray-600">{instance.phone_number}</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(instance.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(instance.status)}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              disabled={instance.status !== 'connected'}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconectar
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InstanceManager;
