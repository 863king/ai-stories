#!/usr/bin/env python3
"""
ConvertKit 自动发送文章脚本
当网站发布新文章时，自动发送邮件给订阅者
"""

import requests
import json
import os
from datetime import datetime

CONVERTKIT_API_SECRET = "T5t2AncwxOTuFedvZ9mBRSqqL0PEAlTwo17MlGs3B-w"
CONVERTKIT_API_URL = "https://api.convertkit.com/v3"
POSTS_FILE = "/root/.openclaw/workspace/ai-stories/posts/posts.json"
SENT_FILE = "/root/.openclaw/workspace/ai-stories/posts/sent_emails.json"
TAG_ID = 17560155  # AI Stories Subscribers

def get_subscribers():
    """获取所有订阅者"""
    response = requests.get(
        f"{CONVERTKIT_API_URL}/tags/{TAG_ID}/subscriptions",
        params={"api_secret": CONVERTKIT_API_SECRET}
    )
    if response.status_code == 200:
        data = response.json()
        # 返回所有激活的订阅者
        return data.get("subscriptions", [])
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

def create_broadcast(subject, content, html_content=None):
    """
    创建广播（广播会发送给所有 tag 订阅者）
    """
    # ConvertKit broadcast 内容
    broadcast_data = {
        "api_secret": CONVERTKIT_API_SECRET,
        "email_address": "ai-stories-bot@convertkit.com",  # 虚拟地址
        "broadcast": {
            "subject": subject,
            "content": html_content if html_content else content,
            "tags": [TAG_ID]
        }
    }
    
    # ConvertKit v3 API 创建 broadcast
    response = requests.post(
        f"{CONVERTKIT_API_URL}/broadcasts",
        json=broadcast_data
    )
    
    if response.status_code in [200, 201]:
        print(f"✅ 广播已创建: {subject}")
        return response.json()
    else:
        print(f"❌ 广播创建失败: {response.status_code} - {response.text}")
        return None

def main():
    """主函数：检查新文章并发送"""
    print(f"=== ConvertKit 邮件发送 ===")
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
        
        # 构建邮件内容
        content = f"""{post.get('content', '')}

---
📖 阅读全文：https://ai2091.com

这是 AI Stories 的每日更新。如果你喜欢，请分享给朋友！
"""
        
        # 创建广播
        result = create_broadcast(title, content)
        
        if result:
            sent_emails.append({
                "title": title,
                "date": datetime.now().isoformat(),
                "broadcast_id": result.get("id")
            })
            save_sent_emails(sent_emails)
            print(f"已记录发送: {title}")

if __name__ == "__main__":
    main()
