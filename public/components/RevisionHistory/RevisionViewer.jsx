import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

export default function RevisionViewer({ content, patches }) {
  const editorRef = useRef(null);
  const viewerRef = useRef(null);

  // 初始化 CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    try {
      const state = EditorState.create({
        doc: content || '',
        extensions: [
          keymap.of(defaultKeymap),
          markdown(),
          syntaxHighlighting(defaultHighlightStyle),
          lineNumbers(),
          EditorView.theme({
            "&": {
              height: "100%",
              width: "100%"
            },
            ".cm-scroller": {
              overflow: "auto"
            }
          }),
          EditorState.readOnly.of(true)
        ]
      });

      const view = new EditorView({
        state,
        parent: editorRef.current
      });

      viewerRef.current = view;
    } catch (error) {
      console.error('CodeMirror initialization failed:', error);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // 处理内容更新和差异标记
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !content) return;

    // 更新内容
    viewer.dispatch({
      changes: {
        from: 0,
        to: viewer.state.doc.length,
        insert: content
      }
    });

  }, [content, patches]);

  return (
    <div className="revision-viewer" ref={editorRef} />
  );
} 