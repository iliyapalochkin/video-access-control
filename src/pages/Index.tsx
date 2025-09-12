import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [accessTime, setAccessTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);

  useEffect(() => {
    const storedAccessTime = localStorage.getItem('video_access_time');
    const currentTime = Date.now();
    
    if (storedAccessTime) {
      const accessTimestamp = parseInt(storedAccessTime);
      const timePassed = currentTime - accessTimestamp;
      const tenHoursInMs = 10 * 60 * 60 * 1000; // 10 часов в миллисекундах
      
      if (timePassed >= tenHoursInMs) {
        setHasAccess(false);
        setTimeRemaining(0);
      } else {
        setHasAccess(true);
        setTimeRemaining(tenHoursInMs - timePassed);
      }
    } else {
      // Первый визит - сохраняем время
      localStorage.setItem('video_access_time', currentTime.toString());
      setAccessTime(currentTime);
      setTimeRemaining(10 * 60 * 60 * 1000); // 10 часов
    }
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            setHasAccess(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayVideo = () => {
    if (hasAccess) {
      setVideoPlaying(true);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <Icon name="Lock" size={64} className="mx-auto mb-6 text-gray-400" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Доступ к видео истёк
          </h1>
          <p className="text-gray-600 mb-6">
            Время доступа к этому видео закончилось. Для повторного просмотра перейдите по ссылке заново.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('video_access_time');
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Обновить доступ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Сделай это и твой трек услышат ТЫСЯЧИ человек
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            В этом видео я рассказываю про систему, благодаря которой этот мир сможет тебя услышать
          </p>
        </div>

        {/* Видеоплеер */}
        <div className="relative mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <img 
                src="/img/18d73cf1-04da-4a9b-bcf3-36352fa41069.jpg" 
                alt="Video preview"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative z-10 text-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <Icon name="Play" size={40} className="text-white ml-1" />
                </div>
                <h3 className="text-white text-xl font-bold mb-4">Демо видео</h3>
                <a 
                  href="https://drive.google.com/file/d/1nQSqIPcATdmdCvmjLyRMY0-D81-tPeo5/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Icon name="ExternalLink" size={20} className="mr-2" />
                  Посмотреть видео
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка CTA */}
        <div className="text-center mb-8">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl px-12 py-4 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-xl">
            СТАТЬ АРТИСТОМ
          </button>
        </div>

        {/* Таймер */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-gray-700 mb-2">
            Доступ к этому видео будет закрыт через
          </p>
          <div className="text-4xl font-mono font-bold text-red-600">
            {formatTime(timeRemaining)}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Index;