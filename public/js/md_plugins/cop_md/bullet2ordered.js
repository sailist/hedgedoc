// markdown-it plugin

// 添加处理无序列表转有序列表的插件
function bullet2orderedPlugin(md) {
    // 在 core 规则中添加转换逻辑
    md.core.ruler.after('inline', 'bullet2ordered', state => {
        state.tokens.forEach((token, idx) => {
            if (token.type === 'bullet_list_open') {
                // 将 bullet_list 转换为 ordered_list
                token.type = 'ordered_list_open';
                token.tag = 'ol';
                // 查找对应的 close token 并转换
                for (let i = idx + 1; i < state.tokens.length; i++) {
                    if (state.tokens[i].type === 'bullet_list_close') {
                        state.tokens[i].type = 'ordered_list_close';
                        state.tokens[i].tag = 'ol';
                        break;
                    }
                }
            }
        });
    });
}

export default bullet2orderedPlugin;
