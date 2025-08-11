import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Cake } from "lucide-react";
import { useAuth } from "@/App"; // Assuming useAuth hook is defined in this file

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const publicNavItems = [
    { path: isAuthenticated ? "/dashboard" : "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/gallery", label: "Gallery" },
    // { path: "/voting", label: "Voting" }, // Commented out for documentation
    { path: "/results", label: "Results" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={publicNavItems[0].path} className="flex items-center space-x-2">
              <Cake className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                Cake Picnic
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {publicNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-smooth ${isActive(item.path)
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center space-x-2">
              {/* [MARKER] Header Join Picnic Button */}
              {isAuthenticated ? (
                <Button variant="cake" size="sm" onClick={logout}>
                  Logout
                </Button>
              ) : (
                <Button variant="cake" size="sm" asChild>
                  <Link to="/register">Join Picnic</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border/40">
            {publicNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-smooth ${isActive(item.path)
                  ? "text-primary font-semibold bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {/* [MARKER] Mobile Header Logout Button */}
            <div className="px-3 py-2 space-y-2">
              {isAuthenticated ? (
                <Button variant="cake" size="sm" className="w-full" onClick={logout}>
                  Logout
                </Button>
              ) : (
                <Button variant="cake" size="sm" className="w-full" asChild>
                  <Link to="/register" onClick={() => setIsOpen(false)}>Join Picnic</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;