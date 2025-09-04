import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Gallery from "@/pages/Gallery";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";
import UploadCake from "@/pages/upload-cake";
import Voting from "@/pages/voting";
import Results from "@/pages/Results";
import Checkin from "@/pages/CheckTime";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Test3D from "@/pages/Test3D";
import Test3DSize from "@/pages/Test3DSize";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/utils";
import { createContext, useContext, useState, useEffect } from "react";
import { Web3ModalProvider } from '@/config/web3'

const queryClient = new QueryClient();

// Auth Context
const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  login: (token: string) => { },
  logout: () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());
  const [token, setToken] = useState<string | null>(getAuthToken());

  useEffect(() => {
    const authToken = getAuthToken();
    setIsAuthenticated(!!authToken);
    setToken(authToken);
  }, []);

  const login = (newToken: string) => {
    setAuthToken(newToken);
    setIsAuthenticated(true);
    setToken(newToken);
  };
  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => (
  <Web3ModalProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Placeholder routes that redirect to dashboard for now */}
                <Route path="/upload-cake" element={<UploadCake />} />
                <Route path="/voting" element={<Voting />} />
                <Route path="/results" element={<Results />} />
                <Route path="/CheckTime" element={<Checkin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/test-3d" element={<Test3D />} />
                <Route path="/test-3d-size" element={<Test3DSize />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </Web3ModalProvider>
);

export default App;
