#!/usr/bin/env python3
"""
Buttondown 自动发送文章脚本
当网站发布新文章时，自动发送邮件给订阅者
"""

import requests
import json
import os
from datetime import datetime

BUTTONDOWN_API_KEY = "c8b9ac08-5a50-43c0-a1d8-61986ca05710"
BUTTONDOWN_API_URL = "https://api.buttondown.email/v1"
POSTS_FILE = "/root/.openclaw/workspace/ai-stories/posts/posts.json"
SENT_FILE = "/root/.openclaw/workspace/ai-stories/posts/sent_emails.json"

def get_headers():
    return {
        "Authorization": f"Token {BUTTONDOWN_API_KEY}",
        "Content-Type": "application/json"
    }

def get_subscribers():
    """获取所有订阅者"""
    response = requests.get(
        f"{BUTTONDOWN_API_URL}/subscribers",
        headers=get_headers()
    )
    if response.status_code == 200:
        data = response.json()
        # 返回所有订阅者（包括未激活的）
        return data.get("results", [])
    return []

def get_sent_emails():
    """获取已发送的文章"""
    if os.path.exists(SENT_FILE):
        with open(SENT_FILE, "r") as f:
            return json.load(f)
    return []

def save_sent_emails(sent_list):
    """保存已发送的文章"""
    os.makedirs(os.path.dirname(SENT_FILE), exist_ok=True)
    with open(SENT_FILE, "w") as f:
        json.dump(sent_list, f, indent=2)

def send_email(title, content):
    """发送邮件给所有订阅者"""
    # 设置发布时间为5分钟后
    from datetime import datetime, timezone, timedelta
    publish_time = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    
    # 创建邮件并定时发布
    email_data = {
        "subject": title,
        "body": content,
        "status": "scheduled",
        "publish_date": publish_time,
    }
    
    response = requests.post(
        f"{BUTTONDOWN_API_URL}/emails",
        headers=get_headers(),
        json=email_data
    )
    
    if response.status_code in [200, 201]:
        print(f"✅ 邮件已定时发布: {title}")
        print(f"   发布时间: {publish_time}")
        return response.json()
    else:
        print(f"❌ 邮件发送失败: {response.text}")
        return None

def main():
    """主函数：检查新文章并发送"""
    print(f"=== Buttondown 邮件发送 ===")
    print(f"时间: {datetime.now()}")
    
    # 获取订阅者数量
    subscribers = get_subscribers()
    print(f"订阅者数量: {len(subscribers)}")
    
    if len(subscribers) == 0:
        print("没有订阅者，跳过发送")
        return
    
    # 获取文章
    if not os.path.exists(POSTS_FILE):
        print("文章文件不存在")
        return
    
    with open(POSTS_FILE, "r") as f:
        posts = json.load(f)
    
    # 获取已发送的文章
    sent_emails = get_sent_emails()
    sent_titles = [e.get("title") for e in sent_emails]
    
    # 发送未发送的文章（只发最新一篇）
    for post in posts[:1]:  # 只处理最新一篇
        title = post.get("title", "")
        
        if title in sent_titles:
            print(f"已发送过: {title}")
            continue
        
        # 发送邮件
        content = post.get("content", "")
        result = send_email(title, content)
        
        if result:
            sent_emails.append({
                "title": title,
                "date": datetime.now().isoformat(),
                "email_id": result.get("id")
            })
            save_sent_emails(sent_emails)
            print(f"已记录发送: {title}")

if __name__ == "__main__":
    main()
