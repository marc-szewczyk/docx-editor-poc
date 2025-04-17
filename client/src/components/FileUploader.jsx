import React, { useRef, useState } from 'react';
import styles from '../styles/Document.module.css';

const FileUploader = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('No file selected');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Update the file name state
      setFileName(e.target.files[0].name);
      // Pass the selected file to the parent component
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={styles.fileUploader}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".docx"
        style={{ display: 'none' }}
      />
      <div className={styles.uploadControls}>
        <button 
          className={styles.selectFileButton}
          onClick={handleClick}
          type="button"
        >
          Select DOCX File
        </button>
        <span className={styles.fileName}>
          {fileName}
        </span>
      </div>
    </div>
  );
};

export default FileUploader;