import React from 'react';
import moment from 'moment';

export default function RevisionList({ revisions, selectedTime, onSelect }) {
  const [showTaggedOnly, setShowTaggedOnly] = React.useState(false);
  const [currentSelected, setCurrentSelected] = React.useState({});
  const shouldShowRevision = (revision) => {
    if (!showTaggedOnly) return true;
    return revision.tag && !revision.tag.endsWith('-stage');
  };

  return (
    <div className="revision-list list-group">
      <div className="mb-2">
        <label className="d-flex align-items-center">
          <input
            type="checkbox"
            checked={showTaggedOnly}
            onChange={e => {
              setShowTaggedOnly(e.target.checked)
              onSelect(currentSelected.time, currentSelected.index, null, e.target.checked)
            }}
            className="mr-2"
          />
          只显示已标记版本
        </label>
      </div>
      <button
        className={`list-group-item ${selectedTime === 'current' ? 'active' : ''}`}
        onClick={() => {
          setCurrentSelected({
            time: 'current',
            index: 0,
            showTaggedOnly
          })
          onSelect('current', 0, null, showTaggedOnly)
        }}
      >
        <h5 className="list-group-item-heading">
          <i className="fa fa-clock-o" /> Current
        </h5>
        <p className="list-group-item-text">
          <i className="fa fa-file-text" /> Current
        </p>
        <p className="list-group-item-text">
          <i className="fa fa-tag" /> Current
        </p>
      </button>
      {revisions.map((revision, index) => (
        shouldShowRevision(revision) && (
          <button
            key={revision.time}
            className={`list-group-item ${selectedTime === revision.time ? 'active' : ''}`}
            onClick={() => {
              setCurrentSelected({
                time: revision.time,
                index,
                showTaggedOnly
              })
              onSelect(revision.time, index, null, showTaggedOnly)
            }}
          >
            <h5 className="list-group-item-heading">
              <i className="fa fa-clock-o" /> {moment(revision.time).format('llll')}
            </h5>
            <p className="list-group-item-text">
              <i className="fa fa-file-text" /> Length: {revision.length}
            </p>
            <p className="list-group-item-text">
              <i className="fa fa-tag" /> Tag: {revision.tag}
            </p>
          </button>
        )
      ))}
    </div>
  );
} 