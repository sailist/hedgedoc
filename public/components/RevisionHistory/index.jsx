import React from 'react';
import RevisionList from './RevisionList';
import RevisionViewer from './RevisionViewer';
import { useRevisionHistory } from './hooks';
import './viewer.css';

export default function RevisionHistory({ editor, noteUrl, onClose }) {
  const {
    revisions,
    selectedRevision,
    loading,
    handleSelectRevision
  } = useRevisionHistory(noteUrl, editor);

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h4>Revision History</h4>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-sm-3">
            <RevisionList
              revisions={revisions}
              selectedTime={selectedRevision?.time}
              onSelect={handleSelectRevision}
            />
          </div>
          <div className="col-sm-9">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <RevisionViewer
                content={selectedRevision?.content || ''}
                previousContent={selectedRevision?.previousContent || ''}
                patches={selectedRevision?.patch}
                tag={selectedRevision?.tag}
                prevTag={selectedRevision?.prevTag}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}