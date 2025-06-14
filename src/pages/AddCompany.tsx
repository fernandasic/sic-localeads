
import { useState } from 'react';
import CompanyForm from '@/components/CompanyForm';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AddCompany = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (values: any) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('companies').insert([values]);

    if (error) {
      toast.error('Erro ao cadastrar empresa: ' + error.message);
    } else {
      toast.success('Empresa cadastrada com sucesso!');
      navigate('/');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-foreground">
      <Header />
      <main className="container mx-auto py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Cadastrar Nova Empresa</h1>
            <p className="text-muted-foreground mt-2">
              Preencha os dados abaixo para adicionar uma nova empresa ao banco de dados.
            </p>
          </div>
          <CompanyForm onSave={handleSave} isSubmitting={isSubmitting} />
        </div>
      </main>
    </div>
  );
};

export default AddCompany;
