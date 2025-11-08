import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from '@/components/UserMenu';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

const Header = () => {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Empresas' },
    { to: '/whatsapp', label: 'WhatsApp' },
    { to: '/disparador', label: 'Disparador' },
    { href: '#', label: 'Como funciona' },
    { href: '#', label: 'Preços' },
  ];

  return (
    <header className="py-3 border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <Search className="h-5 w-5 text-primary md:h-6 md:w-6" />
            <h1 className="text-lg font-bold text-primary md:text-2xl">Sic-Localeads</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => 
              link.to ? (
                <Link 
                  key={link.label}
                  to={link.to} 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a 
                  key={link.label}
                  href={link.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            ) : user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button>Registrar</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button and User */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && user && <UserMenu />}
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => 
                    link.to ? (
                      <Link 
                        key={link.label}
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className="text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors py-3 px-3 rounded-md"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a 
                        key={link.label}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors py-3 px-3 rounded-md"
                      >
                        {link.label}
                      </a>
                    )
                  )}
                  {!user && (
                    <div className="flex flex-col gap-2 mt-6 pt-6 border-t">
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">Registrar</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
