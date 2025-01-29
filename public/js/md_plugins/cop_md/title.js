const levelMap = {
    '##': '第 {count} 章',
    '###': '第 {count} 条',
    '####': ' {count} )',
    '#####': ' {count} )'
};

function SectionToChinese(section) {
    var chnNumChar = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    var chnUnitChar = ["", "十", "百", "千", "万", "亿", "万亿", "亿亿"];
    var strIns = '', chnStr = '';
    var unitPos = 0;
    var zero = true;
    while (section > 0) {
        var v = section % 10;
        if (v === 0) {
            if (!zero) {
                zero = true;
                chnStr = chnNumChar[v] + chnStr;
            }
        } else {
            zero = false;
            strIns = chnNumChar[v];
            strIns += chnUnitChar[unitPos];
            chnStr = strIns + chnStr;
        }
        unitPos++;
        section = Math.floor(section / 10);
    }
    return chnStr;
}

function render_heading_open(tokens, idx, options, env, self) {
    const token = tokens[idx];

    // debugger;
    // 如果不是 cop 文档，使用默认渲染
    if (!md.meta.cop) {
        return self.renderToken(...arguments);
    }
    
    if (token.attrGet('no_number')) {
        return self.renderToken(...arguments);
    }

    // 处理一级标题
    if (token.markup === '#') {
        return '<h1>';
    }

    // 初始化计数器
    env.titleCount = env.titleCount || [0, 0, 0, 0];
    const counter = env.titleCount;
    const level = token.markup.length;



    counter[level]++;

    // debugger;
    // 获取标题前缀模板
    
    let head = levelMap[token.markup];

    // // 特殊处理三级标题
    // if (level === 3) {
    //     level2Count.set('2', (level2Count.get('2') || 0) + 1);
    //     head = head.replace('{count}', level2Count.get('2'));
    // } else {
    // }
    if (level == 2){
        head = head.replace('{count}', SectionToChinese(counter[level]));
    } else {
        head = head.replace('{count}', counter[level]);
    }

    return `<h${level}>${head} `;
};

function titlePlugin(md) {
    const originalRender = md.renderer.rules.heading_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    debugger;


    md.renderer.rules.heading_open = render_heading_open;
}

export default titlePlugin;

export {
    render_heading_open
}