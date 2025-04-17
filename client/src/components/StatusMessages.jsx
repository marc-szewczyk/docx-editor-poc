import React from 'react';
import styles from '../styles/StatusMessages.module.css';

const StatusMessages = ({ downloadSuccess, serverMessage, downloadUrl }) => {
  return (
    <div className={styles.statusMessagesContainer}>
      {/* Server message area - always visible */}
      <div className={styles.serverMessageContainer}>
        {serverMessage ? (
          <span className={styles.serverMessage}>{serverMessage}</span>
        ) : (
          <span className={styles.placeholderMessage}>Ready for upload & conversion</span>
        )}
      </div>
      
      {/* Download area - always visible but changes state */}
      <div className={styles.downloadContainer}>
        {downloadSuccess && downloadUrl ? (
          <div className={styles.successMessage}>
            <span>Document successfully generated!</span>
            <a 
              href={downloadUrl} 
              download
              className={styles.downloadButton}
            >
              Download DOCX
            </a>
          </div>
        ) : (
          <div className={styles.placeholderDownload}>
            <span className={styles.placeholderMessage}>
              {downloadUrl ? 'Download ready' : 'No document ready for download'}
            </span>
            {downloadUrl && (
              <a 
                href={downloadUrl} 
                download
                className={styles.downloadButton}
              >
                Download DOCX
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusMessages;