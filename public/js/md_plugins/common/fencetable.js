import { makeid } from "./utils";

function fenceTablePlugin(md) {
    // 处理特殊的 table 代码块
    function table_fence(state, startLine, endLine, silent) {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        
        // 检查是否是 table 代码块
        if (state.src.slice(start, max).trim() !== '```table') {
            return false;
        }

        if (silent) {
            return true;
        }

        let nextLine = startLine + 1;
        let yamlEnd = nextLine;

        // 查找 yaml 部分结束位置
        while (nextLine < endLine) {
            if (state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]).trim()[0] === '|') {
                break;
            }
            yamlEnd = nextLine;
            nextLine++;
        }

        let tableEnd = nextLine;

        while (nextLine < endLine) {
            console.log(state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]))
            if (state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]).trim() === '```') {
                break;
            }
            tableEnd = nextLine;
            nextLine++;
        }
        nextLine++;
        // 解析 yaml
        // 解析 yaml
        const yamlContent = state.src.slice(
            state.bMarks[startLine + 1],
            state.eMarks[yamlEnd]
        );
        const yamlData = jsyaml.load(yamlContent);
        if (yamlData['type'] === '修订记录') {
            const headingOpen = state.push("heading_open", "h2", 1);
            headingOpen.markup = "##";
            headingOpen.attrSet("no_number", true);
            const token = state.push("text", "", 0);
            token.content = "修订记录";
            const headingClose = state.push("heading_close", "h2", -1);
        }


        // 获取表格内容
        const tableContent = state.src.slice(
            state.bMarks[yamlEnd + 1],
            state.eMarks[tableEnd]
        );
        // 创建一个新的 state 实例来解析表格内容
        // const tableState = new state.constructor(tableContent, md, state.env);
        const tableTokens = [];
        state.md.block.parse(tableContent, state.md, state.env, tableTokens)


        // 将 yaml 属性添加到表格 token
        
        const tableOpen = tableTokens[0];
        if (tableOpen) {
            for (const key in yamlData) {
                tableOpen.attrSet(key, yamlData[key]);
            }
            tableOpen.map = [startLine, nextLine];
        } else {
            state.line = nextLine;
            return true;
        }

        // 将解析后的表格 tokens 添加到主状态
        tableTokens.forEach(token => {
            state.tokens.push(token);
        });

        const caption = yamlData['caption'];
        const label = yamlData['label'];
        if (caption || label) {
            state.push("caption_open", "caption", 1);
            const labelText = label ? label : makeid(10);
            const refToken = state.push("reference", "reference", 0);
            refToken.attrSet("w:name", labelText);
            refToken.attrSet("label_type", "Table");
            if (caption) {
                const token = state.push("text", "", 0);
                token.content = caption;
            }
            
            state.push("caption_close", "caption", -1);
            tableOpen.attrSet("label", labelText);
        }


        state.line = nextLine;
        return true;
    }

    md.block.ruler.before('fence', 'table_fence', table_fence);
}


export default fenceTablePlugin;