import React from 'react';
import RevisionList from './RevisionList';
import RevisionViewer from './RevisionViewer';
import { useRevisionHistory } from './hooks';

export default function RevisionHistory({ noteUrl, onClose }) {
  const {
    revisions,
    selectedRevision,
    loading,
    handleSelectRevision
  } = useRevisionHistory(noteUrl);

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
                content={selectedRevision?.content}
                patches={selectedRevision?.patch}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}