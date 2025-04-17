import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../styles/Document.module.css';

const EditorToolbar = ({ editableElement }) => {
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  
  // Execute format command helper function
  const execFormatCommand = (command, value = null) => {
    if (editableElement) {
      editableElement.focus();
      document.execCommand(command, false, value);
    }
  };
  
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
      {/* Font family selector */}
      <select className={styles.editorSelect} onChange={(e) => {
        if (e.target.value) {
          const primaryFont = e.target.value.split(',')[0].replace(/['"]/g, '').trim();
          execFormatCommand('fontName', primaryFont);
        }
      }}>
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
      <select className={styles.editorSelect} onChange={(e) => {
        if (e.target.value) {
          execFormatCommand('fontSize', e.target.value);
        }
      }}>
        <option value="">Size...</option>
        <option value="1">Small</option>
        <option value="3">Normal</option>
        <option value="5">Large</option>
        <option value="7">Huge</option>
      </select>
      
      {/* Format buttons group */}
      <div className={styles.editorButtonGroup} style={{display: 'flex', gap: '2px'}}>
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('bold')}
          title="Bold"
        >
          <b>B</b>
        </button>
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('italic')}
          title="Italic"
        >
          <i>I</i>
        </button>
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('underline')}
          title="Underline"
        >
          <u>U</u>
        </button>
      </div>
      
      {/* Color buttons group */}
      <div className={styles.editorButtonGroup} style={{display: 'flex', gap: '2px'}}>
        {/* Text color picker with A and underline */}
        <div className={styles.editorButtonContainer} style={{position: 'relative', width: '30px', height: '30px'}}>
          <div 
            className={styles.editorButton}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              height: '100%',
              width: '100%',
              boxSizing: 'border-box'
            }}
            title="Text Color"
          >
            <span style={{fontWeight: 'bold', fontSize: '16px', lineHeight: '1', marginBottom: '2px'}}>
              A
            </span>
            <div 
              style={{
                height: '5px',
                width: '16px',
                backgroundColor: textColor,
                borderRadius: '1px'
              }}
            />
          </div>
          <input 
            type="color" 
            value={textColor}
            className={styles.hiddenColorPicker}
            title="Text Color"
            style={{
              opacity: 0,
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 2
            }}
            onChange={(e) => {
              const newColor = e.target.value;
              setTextColor(newColor);
              execFormatCommand('foreColor', newColor);
            }}
          />
        </div>
        
        {/* Background color picker with highlighter icon */}
        <div className={styles.editorButtonContainer} style={{position: 'relative', width: '30px', height: '30px'}}>
          <div 
            className={styles.editorButton}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              height: '100%',
              width: '100%',
              boxSizing: 'border-box'
            }}
            title="Background Color"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              height: '100%'
            }}>
              <div 
                style={{
                  position: 'relative',
                  width: '10px',
                  height: '15px',
                  backgroundColor: bgColor,
                  borderBottomLeftRadius: '1px',
                  borderBottomRightRadius: '1px',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '-5px',
                  width: '20px',
                  height: '10px',
                  backgroundColor: 'white',
                  transform: 'rotate(15deg)'
                }} />
              </div>
              <div style={{
                width: '12px',
                height: '5px',
                backgroundColor: '#777',
                borderBottomLeftRadius: '3px',
                borderBottomRightRadius: '3px',
                transform: 'perspective(4px) rotateX(25deg)',
                transformOrigin: 'top center',
                marginTop: '-1px'
              }} />
            </div>
          </div>
          <input 
            type="color" 
            value={bgColor}
            className={styles.hiddenColorPicker}
            title="Background Color"
            style={{
              opacity: 0,
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 2
            }}
            onChange={(e) => {
              const newColor = e.target.value;
              setBgColor(newColor);
              execFormatCommand('hiliteColor', newColor);
            }}
          />
        </div>
      </div>
      
      {/* Alignment buttons group */}
      <div className={styles.editorButtonGroup} style={{display: 'flex', gap: '2px', marginLeft: '8px'}}>
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('justifyLeft')}
          title="Align Left"
          dangerouslySetInnerHTML={{
            __html: `
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="0" y="2" width="10" height="2" fill="currentColor"/>
                <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
                <rect x="0" y="10" width="12" height="2" fill="currentColor"/>
              </svg>
            `
          }}
        />
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('justifyCenter')}
          title="Align Center"
          dangerouslySetInnerHTML={{
            __html: `
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="3" y="2" width="10" height="2" fill="currentColor"/>
                <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
                <rect x="2" y="10" width="12" height="2" fill="currentColor"/>
              </svg>
            `
          }}
        />
        <button 
          className={styles.editorButton} 
          onClick={() => execFormatCommand('justifyRight')}
          title="Align Right"
          dangerouslySetInnerHTML={{
            __html: `
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="6" y="2" width="10" height="2" fill="currentColor"/>
                <rect x="0" y="6" width="16" height="2" fill="currentColor"/>
                <rect x="4" y="10" width="12" height="2" fill="currentColor"/>
              </svg>
            `
          }}
        />
      </div>
    </div>
  );
};

// Function to create a toolbar and mount it to a DOM element
export function createReactToolbar(editableElement) {
  const toolbar = document.createElement('div');
  toolbar.className = styles.editorToolbar;
  
  ReactDOM.render(<EditorToolbar editableElement={editableElement} />, toolbar);
  
  return {
    element: toolbar,
    cleanup: () => ReactDOM.unmountComponentAtNode(toolbar)
  };
}

export default EditorToolbar;