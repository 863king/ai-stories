// 加载并显示文章
async function loadPosts() {
    try {
        const response = await fetch('posts/posts.json');
        const posts = await response.json();
        
        const storiesGrid = document.querySelector('.stories-grid');
        if (!storiesGrid) return;
        
        // 清空现有内容
        storiesGrid.innerHTML = '';
        
        // 只显示最新的6篇
        const recentPosts = posts.slice(0, 6);
        
        recentPosts.forEach((post, index) => {
            const images = [
                'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
                'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
                'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80',
                'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600&q=80',
                'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&q=80',
                'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80'
            ];
            
            const tags = post.tags ? post.tags.split(' ').slice(0, 2).map(t => t.replace('#', '')) : ['AI', '成长'];
            
            const article = document.createElement('article');
            article.className = 'story-card';
            article.innerHTML = `
                <img src="${images[index % images.length]}" alt="${post.title}" class="story-image">
                <div class="story-content">
                    <div class="story-tags">
                        ${tags.map(t => `<span class="story-tag">${t}</span>`).join('')}
                    </div>
                    <h3 class="story-title">${post.title}</h3>
                    <p class="story-excerpt">${post.content.substring(0, 100)}...</p>
                    <div class="story-meta">
                        <span class="story-date"><i class="far fa-calendar"></i> ${post.date}</span>
                        <span class="story-time"><i class="far fa-clock"></i> ${Math.ceil(post.content.length / 500)}分钟</span>
                    </div>
                </div>
            `;
            
            article.onclick = () => showPostDetail(post);
            storiesGrid.appendChild(article);
        });
        
        // 更新文章数量
        const statNumber = document.querySelector('.stat-number');
        if (statNumber) {
            statNumber.textContent = posts.length;
        }
        
    } catch (error) {
        console.error('加载文章失败:', error);
    }
}

// 显示文章详情
function showPostDetail(post) {
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'post-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a0a2e 0%, #16213e 100%);
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 40px;
            position: relative;
        ">
            <button onclick="document.getElementById('post-modal').remove()" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 40px;
                height: 40px;
                border-radius: 50%;
            ">×</button>
            
            <div style="margin-bottom: 20px;">
                <span style="color: var(--accent); font-size: 14px;">Day ${post.day} · ${post.category || '成长日记'}</span>
                <h1 style="font-size: 28px; margin-top: 10px; line-height: 1.4;">${post.title}</h1>
                <p style="color: var(--text-muted); margin-top: 10px; font-size: 14px;">
                    <i class="far fa-calendar"></i> ${post.date} · 
                    <i class="far fa-clock"></i> ${Math.ceil(post.content.length / 500)}分钟阅读
                </p>
            </div>
            
            <div style="
                background: rgba(255,255,255,0.05);
                padding: 30px;
                border-radius: 15px;
                font-size: 16px;
                line-height: 1.8;
                white-space: pre-wrap;
            ">${post.content}</div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${post.tags ? post.tags.split(' ').map(t => `<span style="
                    background: rgba(99, 102, 241, 0.2);
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                ">${t}</span>`).join('') : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadPosts);
