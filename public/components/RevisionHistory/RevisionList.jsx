import React from 'react';
import moment from 'moment';

export default function RevisionList({ revisions, selectedTime, onSelect }) {
  return (
    <div className="revision-list list-group">
      {revisions.map(revision => (
        <button
          key={revision.time}
          className={`list-group-item ${selectedTime === revision.time ? 'active' : ''}`}
          onClick={() => onSelect(revision.time)}
        >
          <h5 className="list-group-item-heading">
            <i className="fa fa-clock-o" /> {moment(revision.time).format('llll')}
          </h5>
          <p className="list-group-item-text">
            <i className="fa fa-file-text" /> Length: {revision.length}
          </p>
        </button>
      ))}
    </div>
  );
} 