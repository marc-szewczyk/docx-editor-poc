import React from 'react';

const FileUploader = ({ file, setFile, onUpload, saving, onSave }) => {
  return (
    <div>
      <input
        type="file"
        accept=".docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={onUpload} disabled={!file}>
        Upload & Convert
      </button>
      <button 
        onClick={onSave} 
        style={{ marginLeft: '1rem' }}
        disabled={saving}
      >
        {saving ? 'Processing...' : 'Save and Generate DOCX'}
      </button>
    </div>
  );
};

export default FileUploader;