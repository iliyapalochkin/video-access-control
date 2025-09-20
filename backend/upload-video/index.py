import json
import base64
import os
import hashlib
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload video files to cloud storage for public access
    Args: event - dict with httpMethod, body containing base64 video data
          context - object with request_id, function_name
    Returns: HTTP response with public video URL
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        video_url = body_data.get('videoUrl', '')
        video_type = body_data.get('videoType', 'file')
        filename = body_data.get('filename', 'video.mp4')
        
        if not video_url:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'No video URL provided'})
            }
        
        # Connect to database
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Database not configured'})
            }
            
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Generate unique filename based on URL hash
        video_hash = hashlib.md5(video_url.encode()).hexdigest()
        file_extension = filename.split('.')[-1] if '.' in filename else 'mp4'
        unique_filename = f"{video_hash}.{file_extension}"
        
        # Insert video record into database
        cur.execute("""
            INSERT INTO t_p59440252_video_access_control.videos 
            (filename, original_name, video_url, is_active) 
            VALUES (%s, %s, %s, %s) 
            RETURNING id
        """, (unique_filename, filename, video_url, True))
        
        video_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'videoId': video_id,
                'videoUrl': video_url,
                'filename': unique_filename,
                'message': 'Video saved successfully'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }