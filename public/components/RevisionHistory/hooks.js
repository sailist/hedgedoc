import { useState, useEffect } from 'react';

export function useRevisionHistory(noteUrl) {
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${noteUrl}/revision`)
      .then(res => res.json())
      .then(data => {
        setRevisions(data.revision);
        if (data.revision.length > 0) {
          handleSelectRevision(data.revision[0].time, 0, data.revision);
        }
      });
  }, [noteUrl]);

  const handleSelectRevision = async (time, index, _revisions ) => {
    setLoading(true);
    if (!_revisions) {
      _revisions = revisions;
    }
    try {
      const res = await fetch(`${noteUrl}/revision/${time}`);
      const data = await res.json();
      console.log(index);
      if (index === undefined) {
        debugger;
        return;
      }
      if (index < _revisions.length - 1) {
        const prevRes = await fetch(`${noteUrl}/revision/${_revisions[index + 1].time}`);
        const prevData = await prevRes.json();
        setSelectedRevision({ ...data, previousContent: prevData.content, time });
      } else {
        setSelectedRevision({ ...data, previousContent: '', time });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    revisions,
    selectedRevision,
    loading,
    handleSelectRevision
  };
}