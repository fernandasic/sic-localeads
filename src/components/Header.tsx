
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header = ({ onSettingsClick }: HeaderProps) => {
  return (
    <header className="py-4 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Prospecção de Negócios</h1>
        <Button variant="outline" size="icon" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configurações</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
