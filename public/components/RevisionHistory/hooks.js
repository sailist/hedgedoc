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
          handleSelectRevision(data.revision[0].time);
        }
      });
  }, [noteUrl]);

  const handleSelectRevision = async (time) => {
    setLoading(true);
    try {
      const res = await fetch(`${noteUrl}/revision/${time}`);
      
      const data = await res.json();
      setSelectedRevision(data);
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