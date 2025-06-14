
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, MapPin, Clock, Globe } from 'lucide-react';

export interface Business {
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  opening_hours?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
}

interface ResultsListProps {
  results: Business[];
}

const ResultsList = ({ results }: ResultsListProps) => {
  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>Nenhum resultado encontrado. Tente uma nova busca.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <h2 className="text-2xl font-semibold">Resultados da Busca</h2>
      {results.map((business, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription className="flex items-center pt-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  {business.address}
                </CardDescription>
              </div>
              {business.rating && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {business.rating.toFixed(1)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {business.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.opening_hours && (
               <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>{business.opening_hours}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center text-sm">
                <Globe className="h-4 w-4 mr-2" />
                <a
                  href={business.website}
                  target="_blank"
                  className="text-cyan-700 underline"
                  rel="noopener noreferrer"
                >
                  Site
                </a>
              </div>
            )}
            {business.instagram && (
              <div className="flex items-center text-sm">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" className="h-4 w-4 mr-2" />
                <a
                  href={business.instagram}
                  target="_blank"
                  className="text-pink-600 underline"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </div>
            )}
            {business.whatsapp && (
              <div className="flex items-center text-sm">
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg" alt="WhatsApp" className="h-4 w-4 mr-2" />
                <a
                  href={business.whatsapp}
                  target="_blank"
                  className="text-green-600 underline"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ResultsList;
