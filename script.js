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
    });
    
    // 主输入框事件监听器
    masterInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToAllWindows();
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
    
    // 创建新对话
    function createNewConversation(windowIndex) {
        conversations[windowIndex].push([]);
        activeConversationIndex[windowIndex] = conversations[windowIndex].length - 1;
        updateConversationsList(windowIndex);
        clearMessages(windowIndex);
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
            
            item.textContent = title;
            item.addEventListener('click', function() {
                activeConversationIndex[windowIndex] = index;
                updateConversationsList(windowIndex);
                displayConversation(windowIndex);
            });
            
            list.appendChild(item);
        });
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
    
    // 发送到API
    function sendToAPI(windowIndex, model, temperature) {
        const apiKey = apiKeys[windowIndex];
        if (!apiKey) {
            addErrorMessage("请在设置中添加API密钥", windowIndex);
            return;
        }
        
        // 显示加载指示器
        const loadingMessage = { role: 'assistant', content: '思考中...' };
        const loadingElement = addMessageToUI(loadingMessage, windowIndex);
        
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
            })
            .catch(error => {
                console.error('Error:', error);
                
                // 移除加载消息
                if (loadingElement && loadingElement.parentNode) {
                    loadingElement.parentNode.removeChild(loadingElement);
                }
                
                // 显示错误消息
                addErrorMessage(`API请求失败: ${error.message}`, windowIndex);
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
    
    // 初始化每个窗口的对话列表
    for (let i = 0; i < 3; i++) {
        createNewConversation(i);
    }
});