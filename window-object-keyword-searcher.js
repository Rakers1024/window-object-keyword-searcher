// ==UserScript==
// @name         Window Object Keyword Searcher
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  用于在window对象中递归搜索关键字，默认深度500层。支持数组和对象中键名及值的关键字查询。
// @author       Rakers1024
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建面板样式
    const style = document.createElement('style');
    style.textContent = `
        #window-searcher-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 99999;
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        #window-searcher-header {
            background: #007acc;
            color: white;
            padding: 10px;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #window-searcher-content {
            padding: 10px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        }
        #window-searcher-content.expanded {
            display: block;
        }
        #keyword-input {
            width: 100%;
            padding: 5px;
            margin-bottom: 5px;
            box-sizing: border-box;
        }
        #depth-input {
            width: 50px;
            padding: 5px;
            margin-right: 5px;
        }
        #search-btn {
            padding: 5px 10px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #search-btn:hover {
            background: #005a9e;
        }
        #results {
            margin-top: 10px;
            white-space: pre-wrap;
            background: white;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
        }
        .toggle-icon::after {
            content: '▼';
            font-size: 12px;
        }
        .toggle-icon.collapsed::after {
            content: '▶';
        }
    `;
    document.head.appendChild(style);

    // 创建面板
    const panel = document.createElement('div');
    panel.id = 'window-searcher-panel';
    panel.innerHTML = `
        <div id="window-searcher-header" class="toggle-icon">
            <span>Window 搜索器</span>
            <span></span>
        </div>
        <div id="window-searcher-content">
            <input type="text" id="keyword-input" placeholder="输入关键字...">
            <label>深度: </label>
            <input type="number" id="depth-input" value="500" min="1" max="10">
            <button id="search-btn">搜索</button>
            <div id="results"></div>
        </div>
    `;
    document.body.appendChild(panel);

    // 折叠/展开逻辑
    const header = panel.querySelector('#window-searcher-header');
    const content = panel.querySelector('#window-searcher-content');
    const toggleIcon = header.classList;

    header.addEventListener('click', () => {
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggleIcon.add('collapsed');
        } else {
            content.classList.add('expanded');
            toggleIcon.remove('collapsed');
        }
    });

    // 搜索函数：递归遍历对象，支持数组和对象中键名及值的关键字查询
    function searchObject(obj, keyword, path = '', depth = 0, maxDepth = 500, visited = new WeakSet()) {
        if (depth > maxDepth || typeof obj !== 'object' || obj === null || visited.has(obj)) {
            return [];
        }
        visited.add(obj);

        const results = [];

        if (Array.isArray(obj)) {
            // 处理数组
            for (let i = 0; i < obj.length; i++) {
                const keyStr = i.toString();
                const fullPath = path ? `${path}[${i}]` : `[${i}]`;

                // 检查键名（索引）
                if (keyStr.includes(keyword)) {
                    results.push(`${fullPath}: 键名匹配`);
                }

                const value = obj[i];

                // 检查值（如果值是字符串）
                if (typeof value === 'string' && value.includes(keyword)) {
                    results.push(`${fullPath}: "${value.substring(0, 100)}..."`);
                }

                // 递归子对象
                if (typeof value === 'object' && value !== null) {
                    results.push(...searchObject(value, keyword, fullPath, depth + 1, maxDepth, visited));
                }
            }
        } else {
            // 处理普通对象
            const keys = Object.keys(obj);
            for (const key of keys) {
                const fullPath = path ? `${path}.${key}` : key;

                // 检查键名
                if (key.toString().includes(keyword)) {
                    results.push(`${fullPath}: 键名匹配`);
                }

                const value = obj[key];

                // 检查值（如果值是字符串）
                if (typeof value === 'string' && value.includes(keyword)) {
                    results.push(`${fullPath}: "${value.substring(0, 100)}..."`);
                }

                // 递归子对象
                if (typeof value === 'object' && value !== null) {
                    results.push(...searchObject(value, keyword, fullPath, depth + 1, maxDepth, visited));
                }
            }
        }

        return results;
    }

    // 搜索按钮事件
    const searchBtn = panel.querySelector('#search-btn');
    const keywordInput = panel.querySelector('#keyword-input');
    const depthInput = panel.querySelector('#depth-input');
    const resultsDiv = panel.querySelector('#results');

    searchBtn.addEventListener('click', () => {
        const keyword = keywordInput.value.trim();
        if (!keyword) {
            resultsDiv.textContent = '请输入关键字';
            return;
        }

        const maxDepth = parseInt(depthInput.value) || 500;
        resultsDiv.textContent = '搜索中...';

        try {
            const results = searchObject(window, keyword, '', 0, maxDepth);
            if (results.length === 0) {
                resultsDiv.textContent = '未找到匹配项';
            } else {
                resultsDiv.textContent = results.join('\n');
            }
        } catch (error) {
            resultsDiv.textContent = `搜索出错: ${error.message}`;
        }
    });

    // 回车搜索
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

})();