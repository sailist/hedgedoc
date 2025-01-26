const level_map = {
  "!": "rgb(255,0,0);",
  "-": "rgb(255,204,0);",
  "=": "rgb(0,255,0);"
};

function highlightPlugin(md) {

  function cop_highlight(state, silent) {
    if (state.src.slice(state.pos, state.pos + 2) !== "**") {
      return false;
    }

    if (silent) {
      return true;
    }

    // 找到对应的结束符号
    const end = state.src.indexOf("**", state.pos + 2);
    if (end === -1) {
      return false;
    }

    if (state.pos + 2 < state.src.length && !level_map[state.src[state.pos + 2]]) {
      return false;
    }

    const open = state.push("strong_open", "strong", 1);

    const span = state.push("span_open", "span", 1);
    const color = level_map[state.src[state.pos + 2]];
    const style = `color: ${color}`;
    span.attrSet("style", style);

    const token = state.push("text", "", 0);
    token.content = state.src.slice(state.pos + 3, end);

    state.push("span_close", "span", -1);
    state.push("strong_close", "strong", -1);

    state.pos = end + 2;
    return true;
  }

  md.inline.ruler.before("emphasis", "cop_highlight", cop_highlight);

}

export default highlightPlugin;
