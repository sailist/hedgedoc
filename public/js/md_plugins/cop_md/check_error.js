function checkErrorPlugin(md) {
    md.core.ruler.push('check_error', state => {
        let no_checklist = true;
        let validationErrors = [
        ];
        state.tokens.forEach((token, idx) => {

            if (token.type === "table_open") {
                if (token.attrGet('class') === 'checklist') {
                    no_checklist = false;
                }
            }
            if (token.type === "heading_open") {
                if (token.markup.length == 1) {
                    validationErrors.push({
                        line: token.map[0],
                        message: "不使用 title: 元数据"
                    });
                } else if (token.markup.length >= 4) {
                    validationErrors.push({
                        line: token.map[0],
                        message: "标题级别大于 3 级"
                    });
                }

            }
        });
        if (no_checklist) {
            validationErrors.push({
                line: 0,
                message: "没有 checklist 表格"
            });
        }

        state.env.validationErrors = validationErrors;


    });
}

export default checkErrorPlugin;