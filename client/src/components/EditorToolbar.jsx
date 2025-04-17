import React, { useState, useEffect } from 'react';
import styles from '../styles/Document.module.css';

const EditorToolbar = ({ targetRef }) => {
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  
  useEffect(() => {
    // Check initial formatting state
    if (document.activeElement === targetRef.current) {
      setBoldActive(document.queryCommandState('bold'));
      setItalicActive(document.queryCommandState('italic'));
      setUnderlineActive(document.queryCommandState('underline'));
    }
    
    // Update active states when selection changes
    const checkFormats = () => {
      if (document.activeElement === targetRef.current) {
        setBoldActive(document.queryCommandState('bold'));
        setItalicActive(document.queryCommandState('italic'));
        setUnderlineActive(document.queryCommandState('underline'));
      }
    };
    
    document.addEventListener('selectionchange', checkFormats);
    return () => document.removeEventListener('selectionchange', checkFormats);
  }, [targetRef]);
  
  // Function to execute formatting commands
  const execFormatCommand = (command, value = null) => {
    // Focus on editable area before executing command
    if (targetRef.current) {
      targetRef.current.focus();
      document.execCommand(command, false, value);
      
      // Update active states after command execution
      if (command === 'bold') setBoldActive(document.queryCommandState('bold'));
      if (command === 'italic') setItalicActive(document.queryCommandState('italic'));
      if (command === 'underline') setUnderlineActive(document.queryCommandState('underline'));
    }
  };

  return (
    <div className={styles.editorToolbar}>
      {/* Font selector */}
      <select 
        className={styles.editorSelect}
        onChange={(e) => {
          if (e.target.value) {
            const primaryFont = e.target.value.split(',')[0].replace(/['"]/g, '').trim();
            execFormatCommand('fontName', primaryFont);
          }
        }}
      >
        <option value="">Font...</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Calibri, sans-serif">Calibri</option>
        <option value="'Comic Sans MS', cursive">Comic Sans</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Helvetica, sans-serif">Helvetica</option>
        <option value="'Times New Roman', Times, serif">Times New Roman</option>
        <option value="Verdana, sans-serif">Verdana</option>
      </select>
      
      {/* Font size selector */}
      <select 
        className={styles.editorSelect}
        onChange={(e) => {
          if (e.target.value) {
            execFormatCommand('fontSize', e.target.value);
          }
        }}
      >
        <option value="">Size...</option>
        <option value="1">Small</option>
        <option value="3">Normal</option>
        <option value="5">Large</option>
        <option value="7">Huge</option>
      </select>
      
      {/* Text formatting buttons */}
      <button 
        type="button"
        className={`${styles.editorButton} ${boldActive ? styles.editorButtonActive : ''}`}
        title="Bold"
        onClick={() => execFormatCommand('bold')}
      >
        <b>B</b>
      </button>
      
      <button 
        type="button"
        className={`${styles.editorButton} ${italicActive ? styles.editorButtonActive : ''}`}
        title="Italic"
        onClick={() => execFormatCommand('italic')}
      >
        <i>I</i>
      </button>
      
      <button 
        type="button"
        className={`${styles.editorButton} ${underlineActive ? styles.editorButtonActive : ''}`}
        title="Underline"
        onClick={() => execFormatCommand('underline')}
      >
        <u>U</u>
      </button>
      
      {/* Color pickers */}
      <input 
        type="color"
        className={styles.editorColorPicker}
        title="Text Color"
        onChange={(e) => execFormatCommand('foreColor', e.target.value)}
      />
      
      <input 
        type="color"
        className={styles.editorColorPicker}
        title="Background Color"
        onChange={(e) => execFormatCommand('hiliteColor', e.target.value)}
      />
      
      {/* Alignment buttons */}
      <button 
        type="button"
        className={styles.editorButton}
        title="Align Left"
        onClick={() => execFormatCommand('justifyLeft')}
      >
        ⫪
      </button>
      
      <button 
        type="button"
        className={styles.editorButton}
        title="Align Center"
        onClick={() => execFormatCommand('justifyCenter')}
      >
        ⫱
      </button>
      
      <button 
        type="button"
        className={styles.editorButton}
        title="Align Right"
        onClick={() => execFormatCommand('justifyRight')}
      >
        ⫫
      </button>
    </div>
  );
};

export default EditorToolbar;