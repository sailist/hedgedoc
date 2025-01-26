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
            } else if (token.type === 'bullet_list_close') {
                token.type = 'ordered_list_close';
                token.tag = 'ol';
            }
        });

        state.tokens.forEach((token, idx, array) => {
            if (token.type === 'list_item_open') {
                // 将 bullet_list 转换为 ordered_list
                if (array[idx + 1].type !== 'paragraph_open') {
                    // debugger;
                    token.attrJoin('class', 'empty');
                    // token.tag = 'span';
                    // token.attrSet('test', 'empty');
                }
            }
        });
    });
}

export default bullet2orderedPlugin;
