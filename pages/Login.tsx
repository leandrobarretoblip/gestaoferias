import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CalendarRange, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { BlipLogo } from '../components/BlipLogo';

const Login: React.FC = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
        
        {/* Left Side: Public Access */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-10 flex flex-col justify-center items-center text-center text-white relative">
          <div className="absolute top-8 left-8">
            <BlipLogo className="h-8 w-auto" variant="white" />
          </div>

          <div className="bg-white/10 p-4 rounded-full mb-6 backdrop-blur-sm mt-8">
            <CalendarRange size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Visão Geral</h2>
          <p className="text-blue-100 mb-8 max-w-xs leading-relaxed">
            Consulte a linha do tempo de férias, folgas e licenças de todo o time de forma rápida e transparente.
          </p>
          <Link 
            to="/public" 
            className="group flex items-center gap-2 px-8 py-3 bg-white text-blue-700 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Acessar como Visitante
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="absolute bottom-6 text-blue-200 text-xs">
            Acesso somente leitura. Não requer senha.
          </div>
        </div>

        {/* Right Side: Admin Login */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center bg-white relative">
          <div className="flex flex-col items-center mb-8">
            <BlipLogo className="h-10 w-auto mb-6" variant="color" />
            <h1 className="text-2xl font-bold text-gray-800">Área Restrita</h1>
            <p className="text-gray-500 text-sm mt-2">Login exclusivo para gestores e analistas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@blip.ai"
                className="w-full border-gray-300 rounded-lg shadow-sm p-3 border bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-gray-300 rounded-lg shadow-sm p-3 border bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-xs text-gray-400">
               Seu acesso é monitorado. Utilize apenas e-mails autorizados na whitelist.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
