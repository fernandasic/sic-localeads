
import { Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/UserMenu';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenApiKeyModal?: () => void;
}

const Header = ({ onOpenApiKeyModal }: HeaderProps) => {
  const { user, loading } = useAuth();

  return (
    <header className="py-4 border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary">Sic-Localeads</h1>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Empresas
          </Link>
          <Link to="/whatsapp" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            WhatsApp
          </Link>
          <Link to="/disparador" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Disparador
          </Link>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Como funciona
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Preços
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {onOpenApiKeyModal && user && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenApiKeyModal}
              title="Configurar API Key do Google Maps"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {loading ? (
            <div className="h-9 w-20 bg-gray-200 animate-pulse rounded" />
          ) : user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">Registrar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
