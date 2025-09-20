-- Создаем таблицу для хранения видео
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    video_url TEXT
);

-- Создаем таблицу для настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем настройку для текущего видео
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('current_video_url', '') 
ON CONFLICT (setting_key) DO NOTHING;