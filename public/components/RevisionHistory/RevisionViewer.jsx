import React, { useEffect, useState } from 'react';
import { diffLines, formatLines } from '../../unidiff';
import { parseDiff, Diff, Hunk, Decoration } from 'react-diff-view';
import 'react-diff-view/style/index.css';

export default function RevisionViewer({ previousContent, content, patches, tag, prevTag }) {
  const [diffView, setDiffView] = useState(null);

  useEffect(() => {
    try {
      const diffText = formatLines(diffLines(previousContent, content), { context: 3 });
      const [diff] = parseDiff(diffText, { nearbySequences: 'zip' });
      setDiffView(diff);
    } catch (error) {
      console.error('Diff generation failed:', error);
    }
  }, [previousContent, content]);

  const renderFile = ({ previousContent, content, hunks }) => {
    return (
      <Diff viewType="split" diffType="modify" hunks={hunks}>
        {hunks => [
          <Decoration key="revision-tag-container">
            <div className="revision-tag-container">
              <div className="tag-item old">{prevTag}</div>
              <div className="tag-item-arrow">↔</div>
              <div className="tag-item new">{tag}</div>
            </div>
          </Decoration>,
          hunks.length > 0 
            ? hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)
            : <Decoration key="no-changes">
                <div className="no-changes-message">
                  内容相同，没有变更
                </div>
              </Decoration>
        ]}
      </Diff>
    );
  };

  return (
    <div className="revision-container">
      <div className="diff-view">
        {diffView && (
          renderFile({ previousContent, content, hunks: diffView.hunks })
        )}
      </div>
    </div>
  );
} 