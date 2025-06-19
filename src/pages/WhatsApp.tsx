
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeManager from '@/components/whatsapp/QRCodeManager';
import InstanceManager from '@/components/whatsapp/InstanceManager';
import MessageComposer from '@/components/whatsapp/MessageComposer';
import ContactSelector from '@/components/whatsapp/ContactSelector';
import { Smartphone, MessageSquare, Users, Send } from 'lucide-react';

const WhatsApp = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instances');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            WhatsApp Marketing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conecte seu número do WhatsApp e envie mensagens em massa para suas listas de contatos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instances" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Instâncias
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagem
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Conectar Número
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QRCodeManager />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Instâncias Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <InstanceManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Selecionar Contatos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactSelector />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="message" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Compor Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MessageComposer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Envio em Massa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Pronto para Enviar</h3>
                  <p className="text-gray-600 mb-4">
                    Configure sua instância, selecione contatos e componha sua mensagem para continuar
                  </p>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Iniciar Campanha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WhatsApp;
