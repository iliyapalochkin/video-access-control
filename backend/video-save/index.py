import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Сохранение URL видео в базу данных для всех пользователей
    Args: event - dict с httpMethod, body (video_url), headers
          context - объект с request_id, function_name и др.
    Returns: HTTP response с результатом сохранения
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Получаем DSN из переменных окружения
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database URL not configured'})
        }
    
    try:
        # Подключаемся к базе данных
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        if method == 'GET':
            # Получаем текущее видео
            cursor.execute(
                "SELECT setting_value FROM site_settings WHERE setting_key = 'current_video_url'"
            )
            result = cursor.fetchone()
            current_url = result[0] if result else ''
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'current_video_url': current_url,
                    'message': 'Current video URL retrieved'
                })
            }
        
        elif method == 'POST':
            # Сохраняем новое видео
            body_data = json.loads(event.get('body', '{}'))
            video_url = body_data.get('video_url', '')
            filename = body_data.get('filename', 'uploaded_video.mp4')
            file_size = body_data.get('file_size', 0)
            
            if not video_url:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'video_url is required'})
                }
            
            # Сохраняем видео в таблицу videos
            cursor.execute(
                "INSERT INTO videos (filename, original_name, file_size, video_url) VALUES (%s, %s, %s, %s) RETURNING id",
                (filename, filename, file_size, video_url)
            )
            video_id = cursor.fetchone()[0]
            
            # Обновляем текущее видео в настройках
            cursor.execute(
                "UPDATE site_settings SET setting_value = %s, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'current_video_url'",
                (video_url,)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'video_id': video_id,
                    'video_url': video_url,
                    'message': 'Video URL saved successfully. All users will now see this video.'
                })
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'})
        }
    finally:
        if 'conn' in locals():
            conn.close()