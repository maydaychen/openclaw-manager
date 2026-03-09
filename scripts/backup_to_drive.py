#!/usr/bin/env python3
"""
Backup OpenClaw workspace to Google Drive
Usage: python3 backup_to_drive.py [workspace_name] [--config /path/to/config.json]
"""

import os
import sys
import json
import pickle
import tarfile
import argparse
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Default config path
DEFAULT_CONFIG_PATH = '/home/chenyi/.openclaw/workspace/projects/openclaw-manager/config.json'

def load_config(config_path=None):
    """Load configuration from config file"""
    if config_path is None:
        config_path = DEFAULT_CONFIG_PATH
    
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config.get('backup', {})
    except Exception as e:
        print(f'Warning: Could not load config from {config_path}: {e}')
        return {}

def get_credentials(token_path):
    """Load and refresh Google credentials from token.pickle"""
    try:
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
        
        # Refresh if expired
        if hasattr(creds, 'expired') and creds.expired and hasattr(creds, 'refresh_token'):
            print('Token expired, refreshing...')
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            # Save refreshed token
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
            print('Token refreshed and saved')
        
        return creds
    except Exception as e:
        print(f'Error loading credentials: {e}')
        return None

def get_or_create_folder(drive_service, folder_name):
    """Get or create folder in Google Drive"""
    try:
        # Search for existing folder
        results = drive_service.files().list(
            q=f"mimeType='application/vnd.google-apps.folder' and name='{folder_name}' and trashed=false",
            spaces='drive',
            fields='files(id, name)'
        ).execute()
        
        if results['files']:
            return results['files'][0]['id']
        
        # Create new folder
        print(f"Creating folder: {folder_name}")
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(body=folder_metadata, fields='id').execute()
        return folder['id']
    except Exception as e:
        print(f'Error with folder: {e}')
        return None

def upload_to_drive(file_path, folder_id, drive_service):
    """Upload file to Google Drive"""
    try:
        file_name = os.path.basename(file_path)
        file_metadata = {
            'name': file_name,
            'parents': [folder_id]
        }
        media = MediaFileUpload(file_path, resumable=True)
        file = drive_service.files().create(body=file_metadata, media_body=media, fields='id, name').execute()
        print(f"Uploaded: {file_name} (ID: {file.get('id')})")
        return True
    except Exception as e:
        print(f'Error uploading: {e}')
        return False

def main():
    parser = argparse.ArgumentParser(description='Backup OpenClaw workspace to Google Drive')
    parser.add_argument('workspace', nargs='?', default='default', help='Workspace name')
    parser.add_argument('--config', default=DEFAULT_CONFIG_PATH, help='Path to config.json')
    parser.add_argument('--backup-path', help='Override backup file path')
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Check if Google Drive backup is enabled
    gd_config = config.get('googleDrive', {})
    if not gd_config.get('enabled', False):
        print('Google Drive backup is disabled in config')
        return 1
    
    token_path = gd_config.get('tokenPath')
    if not token_path:
        print('Error: tokenPath not configured')
        return 1
    
    folder_name = gd_config.get('folderName', 'OpenClaw备份')
    
    # Get credentials
    creds = get_credentials(token_path)
    if not creds:
        print(f'Error: Could not load credentials from {token_path}')
        print('Please run: gogcli auth')
        return 1
    
    # Build Drive service
    try:
        drive_service = build('drive', 'v3', credentials=creds)
    except Exception as e:
        print(f'Error building Drive service: {e}')
        return 1
    
    # Get or create folder
    folder_id = get_or_create_folder(drive_service, folder_name)
    if not folder_id:
        print('Error: Could not get or create folder')
        return 1
    
    # Upload backup file
    if args.backup_path and os.path.exists(args.backup_path):
        print(f'Uploading {args.backup_path} to Google Drive...')
        if upload_to_drive(args.backup_path, folder_id, drive_service):
            print('Backup uploaded successfully!')
            return 0
        else:
            print('Failed to upload backup')
            return 1
    else:
        print(f'Error: Backup file not found: {args.backup_path}')
        return 1

if __name__ == '__main__':
    sys.exit(main())
