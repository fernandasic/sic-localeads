
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Image, FileText } from 'lucide-react';

const MessageComposer = () => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const characterCount = message.length;
  const isLongMessage = characterCount > 1000;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mensagem</label>
          <Textarea
            placeholder="Digite sua mensagem aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${isLongMessage ? 'text-red-500' : 'text-gray-500'}`}>
              {characterCount} caracteres
            </span>
            {isLongMessage && (
              <Badge variant="destructive">Mensagem muito longa</Badge>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Anexos (Opcional)</label>
          <div className="space-y-2">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="attachment-upload"
            />
            <label htmlFor="attachment-upload">
              <Button variant="outline" asChild className="w-full">
                <span>
                  <Image className="mr-2 h-4 w-4" />
                  Adicionar Anexos
                </span>
              </Button>
            </label>
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Ocultar' : 'Visualizar'} Prévia
          </Button>
        </div>
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prévia da Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
              <div className="space-y-2">
                {message && (
                  <div className="whitespace-pre-wrap text-sm">
                    {message}
                  </div>
                )}
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        📎 {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessageComposer;
