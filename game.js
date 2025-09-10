class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = {
            x: 100,
            y: 100,
            width: 40,
            height: 60,
            speed: 3,
            direction: 'front'
        };
        
        this.images = {};
        this.mapImage = null;
        this.keys = {};
        
        // 第一层的5个交互区域定义
        this.interactionAreas = [
            {
                name: '八国联军侵华',
                x: 650, y: 200, width: 120, height: 80,
                description: '1900年，八国联军侵华战争爆发，这是中国近代史上的一次重大屈辱事件。八个帝国主义国家联合入侵中国，攻占北京，烧杀抢掠，给中华民族带来了深重的灾难。',
                folder: '八国联军侵华'
            },
            {
                name: '帝国末路',
                x: 400, y: 130, width: 120, height: 80,
                description: '清朝末年，封建帝制已经走到了历史的尽头。政治腐败、经济凋敝、民不聊生，各种社会矛盾日益尖锐，为辛亥革命的爆发创造了条件。',
                folder: '帝国末路'
            },
            {
                name: '救亡图存',
                x: 100, y: 250, width: 120, height: 80,
                description: '面对民族危机，无数仁人志士开始探索救国救民的道路。从洋务运动到维新变法，从太平天国到义和团运动，中华民族在黑暗中寻找光明。',
                folder: '救亡图存'
            },
            {
                name: '甲午海战',
                x: 250, y: 350, width: 120, height: 80,
                description: '1894年甲午中日战争，北洋海军全军覆没，《马关条约》的签订标志着洋务运动的失败，也进一步激发了中国民族的觉醒。',
                folder: '甲午海战'
            },
            {
                name: '革命原起',
                x: 450, y: 450, width: 120, height: 80,
                description: '孙中山先生创立兴中会、同盟会，提出三民主义，发动了一系列武装起义。辛亥革命的思想基础和组织基础逐步形成。',
                folder: '革命原起'
            }
        ];
        
        this.currentArea = null;
        this.currentImageIndex = 0;
        this.currentImages = [];
        this.isModalOpen = false;
        this.init();
    }
    
    async init() {
        await this.loadImages();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    async loadImages() {
        const imagePromises = [
            this.loadImage('playerFront', 'character_front.png'),
            this.loadImage('playerBack', 'character_back.png'),
            this.loadImage('map', '第一层/Map.png')
        ];
        
        await Promise.all(imagePromises);
    }
    
    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 关闭模态框
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.closeItemModal();
        });
        
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') {
                this.closeItemModal();
            }
        });
        
        // 图片轮播控制
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.showPreviousImage();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.showNextImage();
        });
        
        // 键盘控制轮播
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('itemModal').style.display === 'flex') {
                if (e.key === 'ArrowLeft') {
                    this.showPreviousImage();
                } else if (e.key === 'ArrowRight') {
                    this.showNextImage();
                } else if (e.key === 'Escape') {
                    this.closeItemModal();
                }
            }
        });
    }
    
    update() {
        this.handleInput();
        this.checkCollisions();
    }
    
    handleInput() {
        if (this.isModalOpen) return;
        let moved = false;
        
        if (this.keys['w'] || this.keys['arrowup']) {
            this.player.y -= this.player.speed;
            this.player.direction = 'back';
            moved = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.player.y += this.player.speed;
            this.player.direction = 'front';
            moved = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.x -= this.player.speed;
            moved = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.x += this.player.speed;
            moved = true;
        }
        
        // 边界检测
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }
    
    checkCollisions() {
        // If a modal is open, player movement is paused, so no need to check collisions.
        if (this.isModalOpen) return;

        let collidingArea = null;
        for (const area of this.interactionAreas) {
            if (this.isColliding(this.player, area)) {
                collidingArea = area;
                break;
            }
        }

        // If the player is in an area...
        if (collidingArea) {
            // ...and it's a new area they've just entered...
            if (this.currentArea !== collidingArea) {
                // ...show the modal.
                this.showItemModal(collidingArea);
            }
            // Update the current area tracker.
            this.currentArea = collidingArea;
        } else {
            // If the player is not in any area, reset the tracker.
            this.currentArea = null;
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    async showItemModal(area) {
        const modal = document.getElementById('itemModal');
        const title = document.getElementById('itemTitle');
        const description = document.getElementById('itemDescription');
        const imageSlider = document.getElementById('imageSlider');
        
        title.textContent = area.name;
        description.textContent = area.description;
        
        // 清空之前的图片
        imageSlider.innerHTML = '';
        
        // 加载该区域的图片
        try {
            const images = await this.loadAreaImages(area.folder);
            this.currentImages = images;
            this.currentImageIndex = 0;
            
            // 创建所有图片元素并预加载
            const imagePromises = images.map((imgSrc, index) => {
                return new Promise((resolve, reject) => {
                    const slide = document.createElement('div');
                    slide.className = 'carousel-slide';

                    const img = document.createElement('img');
                    img.className = 'carousel-image';
                    img.alt = `${area.name} - 图片 ${index + 1}`;
                    img.onload = () => {
                        slide.appendChild(img);
                        imageSlider.appendChild(slide);
                        resolve(img);
                    };
                    img.onerror = () => {
                        console.error(`无法加载图片: ${imgSrc}`);
                        reject();
                    };
                    img.src = imgSrc;
                });
            });

            // 等待所有图片加载完成
            const results = await Promise.allSettled(imagePromises);
            this.currentImages = results.filter(r => r.status === 'fulfilled').map(r => r.value.src);

            modal.style.display = 'flex';
            this.isModalOpen = true;
            
            // 更新轮播状态
            this.updateCarouselState();
            
        } catch (error) {
            console.error('加载图片失败:', error);
            modal.style.display = 'none';
            this.isModalOpen = false;
        }
    }
    
    async loadAreaImages(folderName) {
        // 根据文件夹名称加载对应的所有图片
        const imageFiles = {
            '八国联军侵华': [
                'wechat_31.jpg', 'wechat_32.jpg', 'wechat_33.jpg', 'wechat_34.jpg', 'wechat_35.jpg',
                'wechat_36.jpg', 'wechat_37.jpg', 'wechat_38.jpg', 'wechat_39.jpg', 'wechat_40.jpg',
                'wechat_41.jpg', 'wechat_42.jpg', 'wechat_43.jpg', 'wechat_44.jpg', 'wechat_45.jpg',
                'wechat_46.jpg', 'wechat_47.jpg', 'wechat_48.jpg'
            ],
            '帝国末路': [
                'wechat_17.jpg', 'wechat_18.jpg', 'wechat_19.jpg', 'wechat_20.jpg', 'wechat_21.jpg', 'wechat_22.jpg'
            ],
            '救亡图存': [
                'wechat_49.jpg', 'wechat_50.jpg', 'wechat_51.jpg', 'wechat_52.jpg', 'wechat_53.jpg',
                'wechat_54.jpg', 'wechat_55.jpg', 'wechat_56.jpg', 'wechat_57.jpg', 'wechat_58.jpg',
                'wechat_59.jpg', 'wechat_60.jpg', 'wechat_61.jpg', 'wechat_62.jpg', 'wechat_63.jpg',
                'wechat_64.jpg', 'wechat_65.jpg', 'wechat_66.jpg', 'wechat_67.jpg', 'wechat_68.jpg',
                'wechat_69.jpg', 'wechat_70.jpg', 'wechat_71.jpg', 'wechat_72.jpg', 'wechat_73.jpg'
            ],
            '甲午海战': [
                'wechat_23.jpg', 'wechat_24.jpg', 'wechat_25.jpg', 'wechat_26.jpg', 'wechat_27.jpg',
                'wechat_28.jpg', 'wechat_29.jpg', 'wechat_30.jpg'
            ],
            '革命原起': [
                'wechat_74.jpg', 'wechat_75.jpg', 'wechat_76.jpg', 'wechat_77.jpg', 'wechat_78.jpg',
                'wechat_79.jpg', 'wechat_80.jpg', 'wechat_81.jpg', 'wechat_82.jpg', 'wechat_83.jpg',
                'wechat_84.jpg', 'wechat_85.jpg', 'wechat_86.jpg', 'wechat_87.jpg', 'wechat_88.jpg',
                'wechat_89.jpg', 'wechat_90.jpg', 'wechat_91.jpg', 'wechat_92.jpg', 'wechat_93.jpg',
                'wechat_94.jpg', 'wechat_95.jpg', 'wechat_96.jpg', 'wechat_97.jpg', 'wechat_98.jpg',
                'wechat_99.jpg', 'wechat_100.jpg', 'wechat_101.jpg', 'wechat_102.jpg', 'wechat_103.jpg',
                'wechat_104.jpg', 'wechat_105.jpg', 'wechat_106.jpg', 'wechat_107.jpg', 'wechat_108.jpg',
                'wechat_109.jpg', 'wechat_110.jpg', 'wechat_111.jpg', 'wechat_112.jpg', 'wechat_113.jpg',
                'wechat_114.jpg', 'wechat_115.jpg', 'wechat_116.jpg', 'wechat_117.jpg', 'wechat_118.jpg',
                'wechat_119.jpg', 'wechat_120.jpg', 'wechat_121.jpg', 'wechat_122.jpg', 'wechat_123.jpg',
                'wechat_124.jpg', 'wechat_125.jpg', 'wechat_126.jpg'
            ]
        };
        
        const files = imageFiles[folderName] || [];
        return files.map(file => `第一层/${folderName}/${file}`);
    }
    
    showPreviousImage() {
        if (this.currentImages.length <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentImages.length) % this.currentImages.length;
        this.updateCarouselState();
    }
    
    showNextImage() {
        if (this.currentImages.length <= 1) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
        this.updateCarouselState();
    }
    
    updateCarouselState() {
        const imageSlider = document.getElementById('imageSlider');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const counter = document.getElementById('imageCounter');
        
        const slides = imageSlider.children;
        
        if (slides.length > 0) {
            const containerWidth = imageSlider.parentElement.clientWidth;
            imageSlider.style.transform = `translateX(-${this.currentImageIndex * containerWidth}px)`;
        }
        
        // 更新按钮状态
        const hasMultipleImages = this.currentImages.length > 1;
        prevBtn.style.display = hasMultipleImages ? 'block' : 'none';
        nextBtn.style.display = hasMultipleImages ? 'block' : 'none';
        
        // 更新计数器
        if (hasMultipleImages) {
            counter.textContent = `${this.currentImageIndex + 1} / ${this.currentImages.length}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }
    
    closeItemModal() {
        document.getElementById('itemModal').style.display = 'none';
        this.currentImageIndex = 0;
        this.currentImages = [];
        this.isModalOpen = false;
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地图背景
        if (this.images.map) {
            this.ctx.drawImage(this.images.map, 0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 绘制交互区域（调试用，可以注释掉）
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        for (let area of this.interactionAreas) {
            this.ctx.strokeRect(area.x, area.y, area.width, area.height);
            
            // 绘制区域名称
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(area.x, area.y - 25, area.width, 20);
            this.ctx.fillStyle = 'black';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(area.name, area.x + 5, area.y - 10);
        }
        
        // 绘制玩家
        const playerImage = this.player.direction === 'front' ? this.images.playerFront : this.images.playerBack;
        if (playerImage) {
            this.ctx.drawImage(playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            // 如果图片未加载，绘制一个简单的矩形
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 追加：AI 聊天窗口逻辑（不创建新的 Game 实例）
window.addEventListener('load', () => {
    // DOM 引用
    const chatToggle = document.getElementById('aiChatToggle');
    const chatWindow = document.getElementById('aiChatWindow');
    const chatMessages = document.getElementById('aiChatMessages');
    const chatText = document.getElementById('aiChatText');
    const sendBtn = document.getElementById('aiSendBtn');
    const closeBtn = document.getElementById('aiCloseBtn');
    const openSettingsBtn = document.getElementById('aiOpenSettings');
    const settingsPanel = document.getElementById('aiSettingsPanel');
    const baseUrlInput = document.getElementById('aiBaseUrl');
    const modelInput = document.getElementById('aiModel');
    const apiKeyInput = document.getElementById('aiApiKey');
    const saveSettingsBtn = document.getElementById('aiSaveSettings');

    if (!chatToggle || !chatWindow) {
        // 页面未包含聊天窗口UI时直接返回
        return;
    }

    // 默认值
    if (baseUrlInput && !baseUrlInput.value) baseUrlInput.value = 'https://api.deepseek.com/v1/chat/completions';
    if (modelInput && !modelInput.value) modelInput.value = 'deepseek-chat';

    // 读取本地保存的设置
    const loadSettings = () => {
        try {
            const savedBase = localStorage.getItem('ai_base_url');
            const savedModel = localStorage.getItem('ai_model');
            const savedKey = localStorage.getItem('ai_api_key');
            if (savedBase && baseUrlInput) baseUrlInput.value = savedBase;
            if (savedModel && modelInput) modelInput.value = savedModel;
            if (savedKey && apiKeyInput) apiKeyInput.value = savedKey;
        } catch (e) {
            console.warn('无法读取本地设置：', e);
        }
    };
    loadSettings();

    const saveSettings = () => {
        try {
            if (baseUrlInput) localStorage.setItem('ai_base_url', baseUrlInput.value.trim());
            if (modelInput) localStorage.setItem('ai_model', modelInput.value.trim());
            if (apiKeyInput) localStorage.setItem('ai_api_key', apiKeyInput.value.trim());
        } catch (e) {
            console.warn('无法保存本地设置：', e);
        }
    };

    const appendMsg = (role, text) => {
        const wrap = document.createElement('div');
        wrap.className = `chat-msg ${role === 'user' ? 'user' : 'ai'}`;
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        wrap.appendChild(bubble);
        chatMessages.appendChild(wrap);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const setSending = (sending) => {
        if (sendBtn) {
            sendBtn.disabled = sending;
            sendBtn.textContent = sending ? '发送中...' : '发送';
        }
    };

    const toggleChat = (open) => {
        chatWindow.style.display = open ? 'flex' : 'none';
        if (open) {
            chatText && chatText.focus();
            if (!chatMessages.dataset.welcomed) {
                appendMsg('ai', '你好！我是AI导览员。欢迎就辛亥革命相关主题提问。');
                chatMessages.dataset.welcomed = '1';
            }
        }
    };

    // 历史对话（包含系统提示）
    const chatHistory = [
        { role: 'system', content: '你是一名博物馆AI导览员，请用简体中文回答，主题围绕辛亥革命与中国近代史，保持准确、中立、易懂。' }
    ];

    const sendMessage = async () => {
        const text = (chatText && chatText.value || '').trim();
        if (!text) return;

        // 优先使用本地硬编码的密钥（config.local.js 注入）
        let apiKey = '';
        try {
            if (typeof window !== 'undefined' && (window.DS_API_KEY || window.DEEPSEEK_API_KEY)) {
                apiKey = String(window.DS_API_KEY || window.DEEPSEEK_API_KEY).trim();
            } else {
                apiKey = ((apiKeyInput && apiKeyInput.value) || '').trim();
                if (!apiKey) {
                    try { apiKey = (localStorage.getItem('ai_api_key') || '').trim(); } catch (e) {}
                }
            }
        } catch (e) {}

        if (!apiKey) {
            if (settingsPanel) settingsPanel.style.display = 'block';
            appendMsg('ai', '请先在设置中粘贴 API Key。');
            return;
        }
        const baseUrl = (baseUrlInput && baseUrlInput.value || '').trim() || 'https://api.deepseek.com/v1/chat/completions';
        const model = (modelInput && modelInput.value || '').trim() || 'deepseek-chat';

        appendMsg('user', text);
        chatHistory.push({ role: 'user', content: text });
        if (chatText) chatText.value = '';
        setSending(true);

        try {
            const body = {
                model,
                messages: chatHistory,
                temperature: 0.7
            };
            const resp = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(`请求失败：${resp.status} ${errText}`);
            }
            const data = await resp.json();
            const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
                ? String(data.choices[0].message.content).trim()
                : '抱歉，我没有获得可用的回复。';
            appendMsg('ai', content);
            chatHistory.push({ role: 'assistant', content });
        } catch (err) {
            console.error(err);
            appendMsg('ai', `调用失败：${(err && err.message) || err}`);
        } finally {
            setSending(false);
        }
    };

    // 打开/关闭窗口
    chatToggle.addEventListener('click', () => toggleChat(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleChat(false));

    // 设置面板
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
        if (!settingsPanel) return;
        settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
    });
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
        saveSettings();
        if (settingsPanel) settingsPanel.style.display = 'none';
        appendMsg('ai', '设置已保存，可以开始提问了。');
        chatText && chatText.focus();
    });

    // 输入与发送
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (chatText) {
        chatText.addEventListener('keydown', (e) => {
            // 输入框内按键不传递给游戏按键监听
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        chatText.addEventListener('keyup', (e) => e.stopPropagation());
    }

    // 捕获 ESC 关闭聊天，防止传递到游戏键盘处理
    document.addEventListener('keydown', (e) => {
        if (chatWindow.style.display === 'flex' && e.key === 'Escape') {
            e.stopPropagation();
            toggleChat(false);
        }
    }, true);
});

// 启动游戏 + 初始化AI聊天（已在上方追加AI事件监听，此处仅创建游戏实例）
window.addEventListener('load', () => {
    new Game();
});