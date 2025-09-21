document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    let conversations = [[], [], []]; // 每个窗口的对话历史
    let activeConversationIndex = [0, 0, 0]; // 每个窗口当前活跃的对话索引
    let apiKeys = ['', '', '']; // 每个窗口的API密钥
    
    // DOM元素
    const settingsBtn = document.querySelector('.settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.querySelector('.close-btn');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInputs = [
        document.getElementById('api-key-1'),
        document.getElementById('api-key-2'),
        document.getElementById('api-key-3')
    ];
    const themeToggle = document.getElementById('theme-toggle');
    const modelSelectors = document.querySelectorAll('.model-selector select');
    const temperatureSliders = document.querySelectorAll('.parameter input[type="range"]');
    const temperatureValues = document.querySelectorAll('.parameter .value');
    const inputFields = document.querySelectorAll('.input-field');
    const masterInput = document.getElementById('master-input');
    const newChatBtns = document.querySelectorAll('.new-chat-btn');
    const deleteChatBtns = document.querySelectorAll('.delete-chat-btn');
    const conversationsLists = document.querySelectorAll('.conversations-list');
    const sendButtons = document.querySelectorAll('.send-btn');
    const masterSendButton = document.getElementById('master-send-btn');
    const imageUploads = document.querySelectorAll('.image-upload');
    
    // 合并的上传元素
    const masterUpload = document.getElementById('master-upload');
    
    // 存储窗口1上传的文件
    let window1UploadedFile = null;
    
    // 从localStorage读取API密钥
    for (let i = 0; i < 3; i++) {
        const savedKey = localStorage.getItem(`apiKey${i+1}`);
        if (savedKey) {
            apiKeys[i] = savedKey;
            apiKeyInputs[i].value = savedKey;
        }
    }
    
    // 从localStorage读取主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
    }
    
    // 从localStorage读取模型选择设置
    for (let i = 0; i < modelSelectors.length; i++) {
        const savedModel = localStorage.getItem(`selectedModel${i+1}`);
        if (savedModel) {
            modelSelectors[i].value = savedModel;
        }
    }
    
    // 设置按钮点击事件
    settingsBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
    });
    
    // 关闭按钮点击事件
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 保存设置按钮点击事件
    saveSettingsBtn.addEventListener('click', function() {
        for (let i = 0; i < 3; i++) {
            apiKeys[i] = apiKeyInputs[i].value;
            localStorage.setItem(`apiKey${i+1}`, apiKeys[i]);
        }
        modal.style.display = 'none';
    });
    
    // 主题切换事件
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // 模型选择器事件监听器
    modelSelectors.forEach((selector, index) => {
        selector.addEventListener('change', function() {
            localStorage.setItem(`selectedModel${index+1}`, this.value);
        });
    });
    
    // 温度滑块事件
    temperatureSliders.forEach((slider, index) => {
        slider.addEventListener('input', function() {
            temperatureValues[index].textContent = this.value;
        });
    });
    
    // 为每个输入框添加事件监听器
    inputFields.forEach((inputField, index) => {
        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(index);
            }
        });
        
        // 添加焦点和失焦事件
        inputField.addEventListener('focus', function() {
            this.setAttribute('placeholder', '按Enter发送，Shift+Enter换行');
        });
        
        inputField.addEventListener('blur', function() {
            this.setAttribute('placeholder', '输入消息...');
        });
    });
    
    // 为每个发送按钮添加事件监听器
    sendButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            sendMessage(index);
        });
    });
    
    // 主输入框事件监听器
    masterInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToAllWindows();
        }
    });
    
    // 主发送按钮事件监听器
    masterSendButton.addEventListener('click', function() {
        sendToAllWindows();
    });
    
    // 图片上传事件监听器
    imageUploads.forEach((upload, index) => {
        upload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                handleImageUpload(file, index);
                
                // 如果是窗口1，保存文件以供其他窗口复制
                if (index === 0) {
                    window1UploadedFile = file;
                }
                
                // 清空文件输入，确保可以重复上传相同文件
                e.target.value = '';
            }
        });
    });
    
    // 合并的上传事件监听器
    masterUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // 自动执行窗口1上传功能
            handleImageUpload(file, 0);
            window1UploadedFile = file;
            
            // 自动执行窗口2复制上传功能
            handleImageUpload(file, 1);
            
            // 自动执行窗口3复制上传功能
            handleImageUpload(file, 2);
            
            // 清空文件输入，确保可以重复上传相同文件
            e.target.value = '';
        }
    });
    
    // 新对话按钮事件
    newChatBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            createNewConversation(index);
        });
    });
    
    // 删除对话按钮事件
    deleteChatBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            deleteCurrentConversation(index);
        });
    });
    
    // 保存对话到localStorage
    function saveConversations() {
        for (let i = 0; i < 3; i++) {
            localStorage.setItem(`conversations_${i}`, JSON.stringify(conversations[i]));
            localStorage.setItem(`activeConversationIndex_${i}`, activeConversationIndex[i]);
        }
    }
    
    // 从localStorage加载对话
    function loadConversations() {
        for (let i = 0; i < 3; i++) {
            const savedConversations = localStorage.getItem(`conversations_${i}`);
            const savedActiveIndex = localStorage.getItem(`activeConversationIndex_${i}`);
            
            if (savedConversations) {
                conversations[i] = JSON.parse(savedConversations);
                if (conversations[i].length === 0) {
                    conversations[i].push([]);
                }
            }
            
            if (savedActiveIndex !== null) {
                activeConversationIndex[i] = parseInt(savedActiveIndex);
                if (activeConversationIndex[i] >= conversations[i].length) {
                    activeConversationIndex[i] = 0;
                }
            }
            
            updateConversationsList(i);
            displayConversation(i);
        }
    }
    
    // 创建新对话
    function createNewConversation(windowIndex) {
        conversations[windowIndex].push([]);
        activeConversationIndex[windowIndex] = conversations[windowIndex].length - 1;
        updateConversationsList(windowIndex);
        clearMessages(windowIndex);
        saveConversations(); // 保存到localStorage
    }
    
    // 删除当前对话
    function deleteCurrentConversation(windowIndex) {
        if (conversations[windowIndex].length > 0) {
            conversations[windowIndex].splice(activeConversationIndex[windowIndex], 1);
            if (conversations[windowIndex].length === 0) {
                conversations[windowIndex].push([]);
                activeConversationIndex[windowIndex] = 0;
            } else if (activeConversationIndex[windowIndex] >= conversations[windowIndex].length) {
                activeConversationIndex[windowIndex] = conversations[windowIndex].length - 1;
            }
            updateConversationsList(windowIndex);
            displayConversation(windowIndex);
            saveConversations(); // 保存到localStorage
        }
    }
    
    // 更新对话列表
    function updateConversationsList(windowIndex) {
        const list = conversationsLists[windowIndex];
        list.innerHTML = '';
        
        conversations[windowIndex].forEach((conversation, index) => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (index === activeConversationIndex[windowIndex]) {
                item.classList.add('active');
            }
            
            // 获取对话的第一条消息作为标题，如果没有则使用默认标题
            let title = '新对话';
            if (conversation.length > 0 && conversation[0].content) {
                title = conversation[0].content.substring(0, 30) + (conversation[0].content.length > 30 ? '...' : '');
            }
            
            // 创建对话标题元素
            const titleElement = document.createElement('span');
            titleElement.className = 'conversation-title';
            titleElement.textContent = title;
            
            // 创建删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.className = 'conversation-delete-btn';
            deleteButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteButton.title = '删除此对话';
            
            // 删除按钮点击事件
            deleteButton.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                if (confirm('确定要删除这个对话吗？')) {
                    deleteConversation(windowIndex, index);
                }
            });
            
            // 对话项点击事件
            item.addEventListener('click', function() {
                activeConversationIndex[windowIndex] = index;
                updateConversationsList(windowIndex);
                displayConversation(windowIndex);
            });
            
            item.appendChild(titleElement);
            item.appendChild(deleteButton);
            list.appendChild(item);
        });
    }
    
    // 删除指定对话
    function deleteConversation(windowIndex, conversationIndex) {
        if (conversations[windowIndex].length > 1) {
            conversations[windowIndex].splice(conversationIndex, 1);
            
            // 调整当前活动对话索引
            if (activeConversationIndex[windowIndex] >= conversationIndex) {
                activeConversationIndex[windowIndex] = Math.max(0, activeConversationIndex[windowIndex] - 1);
            }
        } else {
            // 如果只有一个对话，清空它而不是删除
            conversations[windowIndex][0] = [];
        }
        
        updateConversationsList(windowIndex);
        displayConversation(windowIndex);
        saveConversations(); // 保存到localStorage
    }
    
    // 显示当前对话
    function displayConversation(windowIndex) {
        const messagesContainer = document.querySelectorAll('.messages-container')[windowIndex];
        messagesContainer.innerHTML = '';
        
        const currentConversation = conversations[windowIndex][activeConversationIndex[windowIndex]];
        if (currentConversation) {
            currentConversation.forEach(message => {
                addMessageToUI(message, windowIndex);
            });
        }
    }
    
    // 清除消息
    function clearMessages(windowIndex) {
        const messagesContainer = document.querySelectorAll('.messages-container')[windowIndex];
        messagesContainer.innerHTML = '';
    }
    
    // 发送消息
    function sendMessage(windowIndex) {
        const inputField = inputFields[windowIndex];
        const message = inputField.value.trim();
        
        if (message) {
            // 添加用户消息到UI
            const userMessage = { role: 'user', content: message };
            addMessageToUI(userMessage, windowIndex);
            
            // 添加到对话历史
            conversations[windowIndex][activeConversationIndex[windowIndex]].push(userMessage);
            
            // 保存对话到localStorage
            saveConversations();
            
            // 清空输入框
            inputField.value = '';
            
            // 获取选中的模型和温度
            const model = modelSelectors[windowIndex].value;
            const temperature = parseFloat(temperatureSliders[windowIndex].value);
            
            // 发送到API并获取响应
            sendToAPI(windowIndex, model, temperature);
            
            // 更新对话列表（可能需要更新标题）
            updateConversationsList(windowIndex);
        }
    }
    
    // 发送到所有窗口
    function sendToAllWindows() {
        const message = masterInput.value.trim();
        
        if (message) {
            for (let i = 0; i < 3; i++) {
                // 设置每个窗口的输入框
                inputFields[i].value = message;
                
                // 发送消息
                sendMessage(i);
            }
            
            // 清空主输入框
            masterInput.value = '';
        }
    }
    
    // 处理文件上传
    function handleImageUpload(file, windowIndex) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileUrl = e.target.result;
            let fileMessage;
            
            // 根据文件类型创建不同的消息内容
            if (file.type.startsWith('image/')) {
                // 图片文件
                fileMessage = { 
                    role: 'user', 
                    content: `<div class="uploaded-file-container">
                        <img src="${fileUrl}" alt="上传的图片" style="max-width: 100%; max-height: 300px;">
                    </div>` 
                };
            } else if (file.type === 'application/pdf') {
                // PDF文件
                fileMessage = { 
                    role: 'user', 
                    content: `<div class="uploaded-file-container">
                        <div class="file-upload">
                            <i class="fas fa-file-pdf"></i> 上传的PDF文件: ${file.name}
                        </div>
                    </div>` 
                };
            } else if (file.type.startsWith('text/')) {
                // 文本文件
                fileMessage = { 
                    role: 'user', 
                    content: `<div class="uploaded-file-container">
                        <div class="file-upload">
                            <i class="fas fa-file-alt"></i> 上传的文本文件: ${file.name}
                        </div>
                    </div>` 
                };
            } else {
                // 其他类型文件
                fileMessage = { 
                    role: 'user', 
                    content: `<div class="uploaded-file-container">
                        <div class="file-upload">
                            <i class="fas fa-file"></i> 上传的文件: ${file.name}
                        </div>
                    </div>` 
                };
            }
            
            // 添加到UI
            addMessageToUI(fileMessage, windowIndex);
            
            // 添加到对话历史 - 为API请求创建纯文本版本
            const apiMessage = { 
                role: 'user', 
                content: `我上传了一个文件: ${file.name}，文件类型: ${file.type}，请分析这个文件。` 
            };
            conversations[windowIndex][activeConversationIndex[windowIndex]].push(apiMessage);
            
            // 保存对话到localStorage
            saveConversations();
            
            // 更新对话列表
            updateConversationsList(windowIndex);
            
            // 不再自动发送到API处理，等待用户点击发送按钮
        };
        reader.readAsDataURL(file);
    }
    
    // 发送到API
    function sendToAPI(windowIndex, model, temperature, retryCount = 0) {
        const apiKey = apiKeys[windowIndex];
        if (!apiKey) {
            addErrorMessage("请在设置中添加API密钥", windowIndex);
            return;
        }
        
        // 显示加载指示器（仅在首次尝试时显示）
        let loadingElement;
        if (retryCount === 0) {
            const loadingMessage = { role: 'assistant', content: '思考中...' };
            loadingElement = addMessageToUI(loadingMessage, windowIndex);
        } else {
            // 获取现有的加载指示器
            loadingElement = document.querySelectorAll('.messages-container')[windowIndex].querySelector('.message.assistant:last-child');
        }
        
        // 准备发送到API的消息历史
        const messageHistory = conversations[windowIndex][activeConversationIndex[windowIndex]].map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // API请求配置
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messageHistory,
                temperature: temperature
            })
        };
        
        // 发送请求到OpenRouter API
        fetch('https://openrouter.ai/api/v1/chat/completions', requestOptions)
            .then(response => {
                if (!response.ok) {
                    // 针对429错误特殊处理
                    if (response.status === 429) {
                        throw new Error(`API错误: 429 - 请求过多，请稍后再试或更换模型`);
                    }
                    throw new Error(`API错误: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 移除加载消息
                if (loadingElement && loadingElement.parentNode) {
                    loadingElement.parentNode.removeChild(loadingElement);
                }
                
                // 获取AI响应
                const assistantMessage = { 
                    role: 'assistant', 
                    content: data.choices[0].message.content 
                };
                
                // 添加到UI
                addMessageToUI(assistantMessage, windowIndex);
                
                // 添加到对话历史
                conversations[windowIndex][activeConversationIndex[windowIndex]].push(assistantMessage);
                
                // 保存对话到localStorage
                saveConversations();
            })
            .catch(error => {
                // 窗口3使用10次重试，其他窗口使用5次重试
                const maxRetries = windowIndex === 2 ? 10 : 5;
                const maxRetryAttempts = windowIndex === 2 ? 9 : 4;
                
                console.error(`Error (attempt ${retryCount + 1}/${maxRetries}):`, error);
                
                // 检查是否需要重试
                if (retryCount < maxRetryAttempts) { // 窗口3最多重试9次，总共10次尝试
                    
                    // 更新加载消息内容，显示重试信息
                    if (loadingElement) {
                        loadingElement.querySelector('.message-content').textContent = `思考中... (重试 ${retryCount + 2}/${maxRetries})`;
                    }
                    
                    // 延迟一段时间后重试，每次重试增加延迟
                    setTimeout(() => {
                        sendToAPI(windowIndex, model, temperature, retryCount + 1);
                    }, 1000 * (retryCount + 1)); // 递增延迟：1秒、2秒、3秒...
                } else {
                    // 所有重试都失败，移除加载消息并显示错误
                    if (loadingElement && loadingElement.parentNode) {
                        loadingElement.parentNode.removeChild(loadingElement);
                    }
                    
                    // 显示错误消息
                    addErrorMessage(`API请求失败: ${error.message}`, windowIndex);
                }
            });
    }
    
    // 添加消息到UI
    function addMessageToUI(message, windowIndex) {
        const messagesContainer = document.querySelectorAll('.messages-container')[windowIndex];
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        // 创建消息内容元素
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        // 处理markdown格式（简单实现，实际应用可能需要使用markdown库）
        const formattedContent = message.content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        contentElement.innerHTML = formattedContent;
        messageElement.appendChild(contentElement);
        
        messagesContainer.appendChild(messageElement);
        
        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageElement;
    }
    
    // 添加错误消息
    function addErrorMessage(errorText, windowIndex) {
        const messagesContainer = document.querySelectorAll('.messages-container')[windowIndex];
        const errorElement = document.createElement('div');
        errorElement.className = 'message error';
        errorElement.textContent = errorText;
        messagesContainer.appendChild(errorElement);
        
        // 滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // 首先加载保存的对话
    loadConversations();
    
    // 如果没有保存的对话，则初始化每个窗口的对话列表
    for (let i = 0; i < 3; i++) {
        if (conversations[i].length === 0) {
            createNewConversation(i);
        }
    }
});

// 此处移除了删除上传文件的功能