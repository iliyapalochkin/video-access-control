import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get list of uploaded videos available for all users
    Args: event - dict with httpMethod
          context - object with request_id, function_name
    Returns: HTTP response with list of videos
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'isBase64Encoded': False,
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
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
        
        # Get active videos
        cur.execute("""
            SELECT id, filename, original_name, file_size, upload_date, video_url
            FROM t_p59440252_video_access_control.videos 
            WHERE is_active = true 
            ORDER BY upload_date DESC
        """)
        
        videos = []
        for row in cur.fetchall():
            videos.append({
                'id': row[0],
                'filename': row[1],
                'originalName': row[2],
                'fileSize': row[3],
                'uploadDate': row[4].isoformat() if row[4] else None,
                'videoUrl': row[5]
            })
        
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
                'videos': videos,
                'count': len(videos)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Failed to get videos: {str(e)}'})
        }