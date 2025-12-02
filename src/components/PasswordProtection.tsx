import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const CORRECT_PASSWORD = 'password123';
const STORAGE_KEY = 'site_access_granted';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem(STORAGE_KEY);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setError('');
    } else {
      setError('Неверный пароль');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Icon name="Lock" size={40} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
          Упс, вы опять кого-то упустили
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Введите пароль для продолжения
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Пароль сохраняется только на время текущей сессии
        </p>
      </div>
    </div>
  );
}