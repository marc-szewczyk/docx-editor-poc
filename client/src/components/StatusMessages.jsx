import React from 'react';

const StatusMessages = ({ downloadSuccess, serverMessage, downloadUrl }) => {
  return (
    <>
      {downloadSuccess && (
        <span style={{ 
          marginLeft: '1rem', 
          color: 'green', 
          fontWeight: 'bold'
        }}>
          ✓ DOCX file generated successfully!
        </span>
      )}

      {serverMessage && (
        <div style={{ 
          margin: '1rem 0',
          padding: '0.5rem',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <strong>Server message:</strong> {serverMessage}
        </div>
      )}

      {downloadUrl && (
        <div style={{ marginTop: '1rem' }}>
          <a 
            href={downloadUrl} 
            download="Edited.docx"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: '#0d6efd',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Download DOCX File
          </a>
        </div>
      )}
    </>
  );
};

export default StatusMessages;