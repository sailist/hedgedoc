import { useState, useEffect } from 'react';

export function useRevisionHistory(noteUrl, editor) {
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

  const handleSelectRevision = async (time, index, _revisions, showTaggedOnly) => {
    setLoading(true);
    if (!_revisions) {
      _revisions = revisions;
    }
    
    try {
      if (time === 'current') {
        const content = editor.getValue();
        if (showTaggedOnly) {
          _revisions = _revisions.filter(item=> item.tag && !item.tag.includes('-stage'))
        }
        if (_revisions.length > 0) {
          const prevRes = await fetch(`${noteUrl}/revision/${_revisions[0].time}`);
          const prevData = await prevRes.json();
          setSelectedRevision({ content, tag: 'Current', previousContent: prevData.content, time, prevTag: _revisions[0].tag });
        }  else {
          setSelectedRevision({ content, tag: 'Current', previousContent: '', time, prevTag: '' });
        }
        return;
      }
      const res = await fetch(`${noteUrl}/revision/${time}`);
      const data = await res.json();
      console.log(index);
      if (index === undefined) {
        debugger;
        return;
      }
      if (showTaggedOnly) {
        _revisions = _revisions.filter((item, _index) =>  {
          if (_index >= index) {
            return item.tag && !item.tag.includes('-stage')
          }

          const ret = item.tag && !item.tag.includes('-stage')
          if (ret) {
            index--;
          }
          return ret
        })
        time = _revisions[index].time
      }
      if (index < _revisions.length - 1) {
        const prevRes = await fetch(`${noteUrl}/revision/${_revisions[index + 1].time}`);
        const prevData = await prevRes.json();
        setSelectedRevision({ ...data, tag: _revisions[index].tag, previousContent: prevData.content, time, prevTag: _revisions[index + 1].tag });
      } else {
        setSelectedRevision({ ...data, tag: _revisions[index].tag, previousContent: '', time, prevTag: '' });
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