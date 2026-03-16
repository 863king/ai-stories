#!/usr/bin/env python3
"""
AI Stories 订阅管理工具
查询、导出订阅者列表
"""

import requests
import json
from datetime import datetime

WORKER_URL = "https://ai-stories-subscribe.lisa155188.workers.dev"
SECRET = "9527king"

def get_subscribers():
    """获取所有订阅者"""
    response = requests.get(f"{WORKER_URL}/list?secret={SECRET}")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return []

def export_emails():
    """导出邮箱列表"""
    subscribers = get_subscribers()
    if not subscribers:
        print("No subscribers")
        return
    
    print(f"=== AI Stories 订阅者列表 ({len(subscribers)} 人) ===\n")
    
    # 导出纯邮箱列表
    emails = [s['email'] for s in subscribers]
    print("邮箱列表:")
    for email in emails:
        print(f"  - {email}")
    
    # 保存到文件
    filename = f"subscribers_{datetime.now().strftime('%Y%m%d')}.txt"
    with open(filename, 'w') as f:
        f.write('\n'.join(emails))
    print(f"\n已保存到: {filename}")
    
    # JSON 格式
    json_file = f"subscribers_{datetime.now().strftime('%Y%m%d')}.json"
    with open(json_file, 'w') as f:
        json.dump(subscribers, f, indent=2, ensure_ascii=False)
    print(f"JSON 格式: {json_file}")

if __name__ == "__main__":
    export_emails()
