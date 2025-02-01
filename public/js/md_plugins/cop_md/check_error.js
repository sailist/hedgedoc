function checkErrorPlugin(md) {
    md.core.ruler.push('check_error', state => {

        const meta = state.md.meta;
        if (!meta.cop) {
            return;
        }

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

        if (!state.env.lastVersion) {
            validationErrors.push({
                line: 0,
                message: "没有修订记录"
            });
        } else if (meta.major_version === undefined) {
            validationErrors.push({
                line: 0,
                message: "没有 major_version"
            });
        } else if (meta.minor_version === undefined) {
            validationErrors.push({
                line: 0,
                message: "没有 minor_version"
            });
        } else if (meta.patch_version === undefined) {
            validationErrors.push({
                line: 0,
                message: "没有 patch_version"
            });
        } else {
            const metaVersion = `${meta.major_version}.${meta.minor_version}`;
            if (state.env.lastVersion != metaVersion) {
                validationErrors.push({
                    line: 0,
                    message: "修订记录的版本号和元数据应该一致"
                });
            }
        }
        state.env.validationErrors = validationErrors;

    });
}

export default checkErrorPlugin;