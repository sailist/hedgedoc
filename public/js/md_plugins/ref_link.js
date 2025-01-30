import { makeid } from "./common/utils";

function refLinkPlugin(md) {
  // 处理 \site 引用
  function siteLabel(state, silent) {
    if (state.src.slice(state.pos, state.pos + 6) !== "\\site{") {
      return false;
    }

    if (silent) {
      return true;
    }

    // 找到对应的结束符号
    const end = state.src.indexOf("}", state.pos + 6);
    if (end === -1) {
      return false;
    }

    const href = state.src.slice(state.pos + 6, end);

    const token = state.push("cross_ref", "cross_ref", 0);
    token.attrs = [["w:name", href]];

    state.pos = end + 1;
    state.env.cross_refs = state.env.cross_refs || [];
    state.env.cross_refs.push(token);

    return true;
  }

  // 处理 \label 标签
  function addLabel(state, silent) {
    if (state.src.slice(state.pos, state.pos + 7) !== "\\label{") {
      return false;
    }

    if (silent) {
      return true;
    }

    const end = state.src.indexOf("}", state.pos + 7);
    if (end === -1) {
      return false;
    }

    const content = state.src.slice(state.pos + 7, end);
    const chunks = content.split(":");
    
    const labelType = chunks.length === 1 ? "Pos" : chunks[0];
    const refname = chunks.length === 1 ? chunks[0] : chunks[1];

    const token = state.push("reference", "reference", 0);
    token.attrs = [
      ["w:name", refname],
      ["label_type", labelType]
    ];

    state.pos = end + 1;
    state.env.refs = state.env.refs || [];
    state.env.refs.push(token);

    return true;
  }

  // 渲染 cross_ref token
  function render_cross_ref(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const href = token.attrGet("w:name");
    return `<a href="#label-${href}">${href}</a>`;
  }

  // 渲染 reference token 
  function render_reference(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const refname = token.attrGet("w:name");
    const labelType = token.attrGet("label_type") || "Pos";
    return `<span id="label-${refname}" class="reference" data-name="${refname}" data-type="${labelType}"></span>`;
  }

  function render_caption_open(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const refname = token.attrGet("w:name");
    const labelType = token.attrGet("label_type") || "Pos";
    if (labelType === "Table") {
      env.table_count = env.table_count || 0;
      env.table_count++;
      return `<figcaption class="reference" data-name="${refname}" data-type="${labelType}">Table ${env.table_count}.`;
    }
    return `<figcaption class="reference" data-name="${refname}" data-type="${labelType}">`;
  }

  function render_caption_close(tokens, idx, options, env, self) {
    return `</figcaption>`;
  }

  // 添加图像渲染器
  const defaultImageRenderer = md.renderer.rules.image;
  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const children = token.children
    if (children.length === 0) {
      return defaultImageRenderer(tokens, idx, options, env, self);
    }
    
    // 初始化图片计数器
    env.figure_count = env.figure_count || 0;
    env.figure_count++;
    
    const caption = children[0].content
    const parts = caption.split(':');
    children[0].content = parts.length > 1 ? parts[1].trim() : caption;
    const label = parts.length > 1 ? parts[0].trim() : makeid(5);
    const finalCaption = parts.length > 1 ? parts[1].trim() : caption;

    let html = defaultImageRenderer(tokens, idx, options, env, self);
    html += `<figcaption id="label-${label}" class="figure-caption">Figure ${env.figure_count}. ${finalCaption}</figcaption>`;
    return html;
  };

  // 注册渲染器
  md.renderer.rules.cross_ref = render_cross_ref;
  md.renderer.rules.reference = render_reference;
  md.renderer.rules.caption_open = render_caption_open;
  md.renderer.rules.caption_close = render_caption_close;
  // 注册解析规则
  md.inline.ruler.before("escape", "add_label", addLabel);
  md.inline.ruler.before("escape", "site_label", siteLabel);
}

export default refLinkPlugin; 