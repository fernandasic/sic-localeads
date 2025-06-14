
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="py-4 border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">LeadLocal</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Como funciona
          </a>
          <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Preços
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline">Login</Button>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">Registrar</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
