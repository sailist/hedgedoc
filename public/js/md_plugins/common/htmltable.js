import Token from "markdown-it/lib/token"
import { makeid } from "./utils";
class TokenBuilder {
    constructor() {
        this.level = 0;
        this.tokens = [];
    }

    push(type, tag, nesting, attrs = {}) {
        const token = new Token(type, tag, nesting);
        attrs = attrs || {};
        
        // 修改为对象遍历
        for (const [key, value] of Object.entries(attrs)) {
            token.attrSet(key, value);
        }

        if (nesting < 0) {
            this.level--; // closing tag
        }
        if (nesting > 0) {
            this.level++; // opening tag
        }

        this.tokens.push(token);
        return token;
    }
}



const checklist_cols = ["Cat.", "Check 项目", "Check 方法", "参考值", "Check 结果", "PR & 时间"];

function html2table(md) {

    function trimChecklistIfTableIsChecklist(table) {
        const thead = table.querySelector("thead");
        const cols = thead.querySelectorAll("th");
        const colTexts = Array.from(cols).map(th => th.textContent.trim());
        
        if (colTexts.length !== checklist_cols.length || !colTexts.every(col => checklist_cols.includes(col))) {
            return {table, isChecklist: false};
        }

        // 1. 添加编号列
        const newTh = document.createElement('th');
        newTh.textContent = '编号';
        cols[0].insertAdjacentElement('afterend', newTh);

        // 2. 修改 "Check 方法" 列标题并合并列
        const methodIndex = colTexts.indexOf('Check 方法');
        const valueIndex = colTexts.indexOf('参考值');
        cols[methodIndex].textContent = 'Check 方法与参考值';
        cols[methodIndex].setAttribute('colspan', '2');
        cols[valueIndex].remove();

        // 3. 处理表体
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const groups = {};
        
        // 为每组添加编号
        let currentNumber = 1;
        rows.forEach(row => {
            // 添加编号列
            const numberTd = document.createElement('td');
            numberTd.textContent = currentNumber++;
            row.querySelector("td").insertAdjacentElement('afterend', numberTd);

            // 合并 Check 方法和参考值列
            const cells = row.querySelectorAll("td");
            const methodCell = cells[methodIndex + 1]; // +1 因为添加了编号列
            const valueCell = cells[valueIndex + 1];
            methodCell.textContent = `${methodCell.textContent}\n${valueCell.textContent}`;
            methodCell.setAttribute('colspan', '2');
            valueCell.remove();

            // 分组处理
            const catCell = row.querySelector("td");
            const cat = catCell.textContent.trim();
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(row);
        });

        // 处理每个分组的 rowspan
        Object.entries(groups).forEach(([cat, groupRows]) => {
            if (groupRows.length > 1) {
                const firstRow = groupRows[0];
                const firstCell = firstRow.querySelector("td");
                firstCell.setAttribute("rowspan", groupRows.length);
                
                groupRows.slice(1).forEach(row => {
                    row.querySelector("td").remove();
                });
            }
        });

        return {table, isChecklist: true};
    }

    function processHtmlBlockTokens(state) {
        let i = 0;
        const tokens = state.tokens;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type !== 'html_block' || !token.content.trim().startsWith('<table')) {
                i++;
                continue;
            }

            // 解析 HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(token.content, 'text/html');
            const _table = doc.querySelector('table');
            if (!_table) {
                i++;
                continue;
            }

            // 处理 checklist 表格
            const {table, isChecklist} = trimChecklistIfTableIsChecklist(_table);
            
            // 创建 TokenBuilder
            const builder = new TokenBuilder();

            // table open
            const head = builder.push('table_open', 'table', 1);
            if (isChecklist) {
                head.attrJoin('class', 'checklist');
            }

            // 处理表头
            const thead = table.querySelector('thead') || table.querySelector('tr');
            const thead_is_tr = thead.tagName === 'TR';
            if (thead) {
                builder.push('thead_open', 'thead', 1);
                builder.push('tr_open', 'tr', 1);

                const headerCells = thead.querySelectorAll('th, td');
                headerCells.forEach((cell, colIndex) => {
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    const attrs = { rowindex: 0, colindex: colIndex };
                    if (colspan > 1) {
                        attrs.colspan = colspan;
                    }

                    builder.push('th_open', 'th', 1, attrs);
                    const textToken = builder.push('text', '', 0);
                    textToken.content = cell.textContent;
                    builder.push('th_close', 'th', -1);
                });

                builder.push('tr_close', 'tr', -1);
                builder.push('thead_close', 'thead', -1);
            }

            // 处理表体
            const tbody = table.querySelector('tbody') || table;
            builder.push('tbody_open', 'tbody', 1);

            const rows = tbody.querySelectorAll('tr');
            rows.forEach((row, rowIndex) => {
                if (thead_is_tr && rowIndex === 0) return; // 跳过已处理的表头

                builder.push('tr_open', 'tr', 1);

                const cells = row.querySelectorAll('td');
                cells.forEach((cell, colIndex) => {
                    const colspan = parseInt(cell.getAttribute('colspan') || 1);
                    const rowspan = parseInt(cell.getAttribute('rowspan') || 1);
                    const attrs = {
                        rowindex: rowIndex,
                        colindex: colIndex
                    };

                    if (colspan > 1) attrs.colspan = colspan;
                    if (rowspan > 1) attrs.rowspan = rowspan;

                    builder.push('td_open', 'td', 1, attrs);
                    const textToken = builder.push('text', '', 0);
                    textToken.content = cell.textContent;
                    builder.push('td_close', 'td', -1);
                });

                builder.push('tr_close', 'tr', -1);
            });

            builder.push('tbody_close', 'tbody', -1);
            builder.push('table_close', 'table', -1);

            // 处理 caption
            const caption = table.querySelector('caption');
            const label = table.querySelector('label');
            if (caption || label) {
                builder.push('caption_open', 'caption', 1);
                const labelText = label ? label.textContent : makeid(10);

                const refToken = builder.push('reference', 'reference', 0);
                refToken.attrSet('w:name', labelText);
                refToken.attrSet('label_type', 'Table');

                if (caption) {
                    const capToken = builder.push('text', '', 0);
                    capToken.content = caption.textContent;
                }

                builder.push('caption_close', 'caption', -1);
                head.attrSet('label', labelText);
            }


            tokens.splice(i, 1, ...builder.tokens);
            i += builder.tokens.length;
        }
    }

    md.core.ruler.push('html2table', processHtmlBlockTokens);
}

// 表格对齐处理插件
function markdownTableAlign(md) {
    function processTableTokens(state) {
        const tokens = state.tokens;
        let i = 0;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type !== 'table_open') {
                i++;
                continue;
            }

            let j = i;
            while (j < tokens.length && tokens[j].level >= token.level) {
                if (['td_open', 'th_open'].includes(tokens[j].type)) {
                    const textToken = tokens[j + 1];
                    if (textToken && textToken.type === 'text') {
                        const style = textToken.attrGet('style') || '';
                        if (style.includes('text-align:')) {
                            const align = style.split('text-align:')[1].split(';')[0].trim();
                            tokens[j].attrSet('align', align);
                        }
                    }
                }
                j++;
            }
            i = j;
        }
    }

    md.core.ruler.push('markdown_table_align', processTableTokens);
}

export { html2table, markdownTableAlign };
