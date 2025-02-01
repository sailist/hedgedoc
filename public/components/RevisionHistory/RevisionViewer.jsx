import React, { useEffect, useState } from 'react';
import { diffLines, formatLines } from '../../unidiff';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import 'react-diff-view/style/index.css';

export default function RevisionViewer({ previousContent, content, patches }) {
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

  return (
    <div className="revision-container">
      <div className="diff-view">
        {diffView && (
          <Diff 
            viewType="split" 
            diffType={diffView.type}
            optimizeSelection
            hunks={diffView.hunks || []}
            className="diff-content"
          >
            {hunks =>
              hunks.map(hunk => (
                <Hunk key={hunk.content} hunk={hunk} />
              ))
            }
          </Diff>
        )}
      </div>
    </div>
  );
} 