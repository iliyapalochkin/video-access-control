import React, { useState } from 'react';
import Icon from '@/components/ui/icon';

interface CloudVideoUploaderProps {
  onVideoSelect: (videoUrl: string) => void;
}

const CloudVideoUploader: React.FC<CloudVideoUploaderProps> = ({ onVideoSelect }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudUrl, setCloudUrl] = useState('');

  const handleCloudUrlSubmit = () => {
    if (!cloudUrl.trim()) {
      alert('Пожалуйста, введите ссылку на видео');
      return;
    }

    // Проверяем популярные облачные сервисы
    const supportedClouds = [
      'disk.yandex.ru',
      'drive.google.com',
      'dropbox.com',
      'cloud.mail.ru',
      'mega.nz',
      '1drv.ms', // OneDrive
      'storage.yandexcloud.net',
      'amazonaws.com',
      'blob.core.windows.net'
    ];

    const isCloudUrl = supportedClouds.some(cloud => 
      cloudUrl.toLowerCase().includes(cloud)
    ) || cloudUrl.includes('.mp4') || cloudUrl.includes('.mov') || cloudUrl.includes('.avi');

    if (!isCloudUrl) {
      alert('Введите прямую ссылку на видеофайл из облачного хранилища\n\nПоддерживаются:\n• Яндекс.Диск\n• Google Drive\n• Dropbox\n• Mail.ru Облако\n• OneDrive\n• Прямые ссылки на .mp4/.mov/.avi');
      return;
    }

    // Преобразуем ссылки для прямого доступа
    let directUrl = cloudUrl;

    // Яндекс.Диск - преобразуем в прямую ссылку
    if (cloudUrl.includes('disk.yandex.ru')) {
      if (cloudUrl.includes('/d/')) {
        // Уже прямая ссылка
        directUrl = cloudUrl;
      } else {
        alert('Для Яндекс.Диска используйте прямую ссылку:\n1. Откройте файл в Яндекс.Диске\n2. Нажмите "Поделиться"\n3. Скопируйте прямую ссылку (она содержит /d/)');
        return;
      }
    }

    // Google Drive - преобразуем в прямую ссылку
    if (cloudUrl.includes('drive.google.com')) {
      const fileIdMatch = cloudUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        directUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      } else {
        alert('Для Google Drive:\n1. Откройте файл\n2. Нажмите "Поделиться"\n3. Включите "Доступ по ссылке"\n4. Скопируйте ссылку');
        return;
      }
    }

    onVideoSelect(directUrl);
  };

  const getCloudInstructions = () => (
    <div className="text-left text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-4">
      <h4 className="font-medium mb-2">📋 Как получить прямую ссылку:</h4>
      
      <div className="space-y-2">
        <div>
          <strong>Яндекс.Диск:</strong>
          <ol className="list-decimal list-inside text-xs mt-1 ml-2">
            <li>Загрузите видео в Яндекс.Диск</li>
            <li>Нажмите на файл → "Поделиться"</li>
            <li>Скопируйте прямую ссылку</li>
          </ol>
        </div>
        
        <div>
          <strong>Google Drive:</strong>
          <ol className="list-decimal list-inside text-xs mt-1 ml-2">
            <li>Загрузите видео в Google Drive</li>
            <li>Правой кнопкой → "Поделиться"</li>
            <li>Включите "Доступ по ссылке"</li>
            <li>Скопируйте ссылку</li>
          </ol>
        </div>

        <div>
          <strong>Dropbox:</strong>
          <ol className="list-decimal list-inside text-xs mt-1 ml-2">
            <li>Загрузите видео в Dropbox</li>
            <li>Нажмите "Поделиться" → "Создать ссылку"</li>
            <li>Замените ?dl=0 на ?dl=1 в конце ссылки</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center">
        <Icon name="Cloud" size={48} className="mx-auto mb-4 text-blue-500" />
        
        <h3 className="text-lg font-semibold mb-2">Видео из облака</h3>
        
        <p className="text-gray-600 mb-4">
          Вставьте прямую ссылку на видеофайл из облачного хранилища
        </p>

        <div className="mb-4">
          <input
            type="url"
            placeholder="https://disk.yandex.ru/d/..."
            value={cloudUrl}
            onChange={(e) => setCloudUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <button
          onClick={handleCloudUrlSubmit}
          disabled={!cloudUrl.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Загрузить видео
        </button>

        {getCloudInstructions()}

        <div className="mt-4 text-xs text-blue-600">
          <p>💡 Преимущества облачного хранения:</p>
          <p>• Любой размер файла • Быстрая загрузка • Постоянный доступ</p>
        </div>
      </div>
    </div>
  );
};

export default CloudVideoUploader;