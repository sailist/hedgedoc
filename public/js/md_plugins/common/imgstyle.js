// markdown-it plugin for adding 'block' class to block-level images

function imgStylePlugin(md) {
    md.core.ruler.after('inline', 'img_style', state => {
        state.tokens.forEach((token, idx, array) => {
            // 检查是否为段落token，且只包含一个图片
            if (token.type === 'paragraph_open' &&
                array[idx + 1].type === 'inline' &&
                array[idx + 1].children &&
                array[idx + 1].children.length === 1 &&
                array[idx + 1].children[0].type === 'image') {
                
                // 为图片token添加block class
                const imgToken = array[idx + 1].children[0];
                imgToken.attrJoin('class', 'block');
            }
        });
    });
}

export default imgStylePlugin;
