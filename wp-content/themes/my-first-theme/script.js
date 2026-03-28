document.addEventListener('DOMContentLoaded', function() {
    console.log("Script Loaded - V47 (Fix Dark Mode Toggle)");

    const body = document.body;
    
    // 1. 初始化主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        updateAllToggleIcons('ri-sun-line');
    } else {
        updateAllToggleIcons('ri-moon-line');
    }

    // 2. 绑定切换事件 (支持页面上任何ID为theme-toggle的按钮)
    // 使用事件委托，防止动态加载或ID冲突问题
    document.addEventListener('click', function(e) {
        // 查找是否点击了 ID 为 theme-toggle 的按钮，或者其内部的图标
        const btn = e.target.closest('#theme-toggle');
        
        if (btn) {
            e.preventDefault();
            body.classList.toggle('light-mode');
            
            const isLight = body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            
            // 更新页面上所有切换按钮的图标
            updateAllToggleIcons(isLight ? 'ri-sun-line' : 'ri-moon-line');
        }
    });

    function updateAllToggleIcons(iconClass) {
        const btns = document.querySelectorAll('#theme-toggle i');
        btns.forEach(icon => {
            icon.className = iconClass;
        });
    }

    // 3. 点赞逻辑
    function handleLike(btn, actionName, idName) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute(idName);
            const countSpan = this.querySelector('.like-count');
            const icon = this.querySelector('i');
            
            if(!my_ajax_obj || !my_ajax_obj.ajax_url) return;

            const formData = new FormData();
            formData.append('action', actionName);
            formData.append('id', id);
            formData.append('nonce', my_ajax_obj.nonce);

            fetch(my_ajax_obj.ajax_url, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (countSpan) countSpan.innerText = data.count > 0 ? data.count : '';
                if (data.status === 'liked') {
                    this.classList.add('liked');
                    if(icon) {
                        icon.className = icon.className.replace('line', 'fill').replace('heart-line', 'heart-3-fill');
                        icon.style.color = '#ff4d4f';
                    }
                } else {
                    this.classList.remove('liked');
                    if(icon) {
                        icon.className = icon.className.replace('fill', 'line').replace('heart-3-fill', 'heart-line');
                        icon.style.color = '';
                    }
                }
            });
        });
    }
    document.querySelectorAll('.comment-like-btn').forEach(btn => handleLike(btn, 'my_comment_like', 'data-comment-id'));
    document.querySelectorAll('.post-like-btn').forEach(btn => handleLike(btn, 'my_post_like', 'data-post-id'));

    // 4. AI 聊天逻辑
    const chatInput = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatHistory = document.getElementById('ai-chat-history');

    if (chatInput && sendBtn && chatHistory) {
        function appendMessage(sender, text) {
            const msgDiv = document.createElement('div');
            if (sender === 'ai') {
                msgDiv.className = 'chat-msg ai-msg';
                msgDiv.innerHTML = `<div class="msg-avatar"><i class="ri-robot-2-line"></i></div><div class="msg-bubble">${text}</div>`;
            } else {
                msgDiv.className = 'chat-msg user-msg';
                msgDiv.innerHTML = `<div class="msg-bubble"></div>`;
                msgDiv.querySelector('.msg-bubble').textContent = text;
            }
            chatHistory.appendChild(msgDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            return msgDiv;
        }

        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMessage('user', text);
            chatInput.value = '';
            sendBtn.disabled = true;
            
            // 添加加载动画
            const loadingId = 'loading-' + Date.now();
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'chat-msg ai-msg';
            loadingDiv.id = loadingId;
            loadingDiv.innerHTML = `<div class="msg-avatar"><i class="ri-robot-2-line"></i></div><div class="msg-bubble">...</div>`;
            chatHistory.appendChild(loadingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;

            const formData = new FormData();
            formData.append('action', 'chat_with_ai'); 
            formData.append('message', text);
            formData.append('nonce', my_ajax_obj.nonce);

            fetch(my_ajax_obj.ajax_url, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                const loader = document.getElementById(loadingId);
                if(loader) loader.remove();
                
                if (data.success) appendMessage('ai', data.data);
                else appendMessage('ai', '⚠️ ' + (data.data || '未知错误'));
            })
            .catch(err => {
                const loader = document.getElementById(loadingId);
                if(loader) loader.remove();
                appendMessage('ai', '⚠️ 网络错误，请重试');
            })
            .finally(() => {
                sendBtn.disabled = false;
                chatInput.focus();
            });
        }
        
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !sendBtn.disabled) sendMessage();
        });
    }
});