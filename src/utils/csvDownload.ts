
import { Business } from '@/components/ResultsList';

export const downloadCSV = (results: Business[], filename: string = 'empresas') => {
  if (results.length === 0) {
    return;
  }

  // Cabeçalhos do CSV
  const headers = [
    'Nome',
    'Endereço',
    'Telefone',
    'Website',
    'Instagram',
    'WhatsApp',
    'Avaliação',
    'Horário de Funcionamento'
  ];

  // Converter dados para CSV
  const csvContent = [
    headers.join(','),
    ...results.map(business => [
      `"${(business.name || '').replace(/"/g, '""')}"`,
      `"${(business.address || '').replace(/"/g, '""')}"`,
      `"${(business.phone || '').replace(/"/g, '""')}"`,
      `"${(business.website || '').replace(/"/g, '""')}"`,
      `"${(business.instagram || '').replace(/"/g, '""')}"`,
      `"${(business.whatsapp || '').replace(/"/g, '""')}"`,
      business.rating ? business.rating.toString() : '',
      `"${(business.opening_hours || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  // Criar blob e fazer download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
