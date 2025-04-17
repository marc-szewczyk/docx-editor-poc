import React, { useRef, useEffect } from 'react';
import EditorToolbar from './EditorToolbar';
import styles from '../styles/Document.module.css';

const EditableParagraph = ({ 
  content, 
  originalStyles, 
  originalClassNames, 
  onFinishEditing 
}) => {
  const editableRef = useRef(null);
  
  // Focus the paragraph when it's mounted
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.focus();
      
      // Place cursor at the end of text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      range.collapse(false); // false means collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);
  
  // This effect handles key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Enter key to save changes
      if (e.key === 'Enter' && e.shiftKey === false) {
        e.preventDefault();
        onFinishEditing();
      }
      
      // Handle Escape key to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onFinishEditing();
      }
    };
    
    if (editableRef.current) {
      editableRef.current.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (editableRef.current) {
        editableRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [onFinishEditing]);
  
  // Parse styles from CSS text if it's a string
  const parseStyles = () => {
    if (!originalStyles || typeof originalStyles !== 'string') return {};
    
    // Convert the CSS text to an object
    const styleObj = {};
    originalStyles.split(';').forEach(style => {
      const [property, value] = style.split(':');
      if (property && value) {
        styleObj[property.trim()] = value.trim();
      }
    });
    
    styleObj.cursor = 'text';
    return styleObj;
  };
  
  return (
    <div className={styles.editingContainer}>
      <EditorToolbar targetRef={editableRef} />
      <p
        ref={editableRef}
        className={`${originalClassNames || ''} ${styles.editableParagraph}`}
        contentEditable={true}
        style={parseStyles()}
        dangerouslySetInnerHTML={{ __html: content }}
        onBlur={(e) => {
          // Only finish editing if clicking outside the toolbar too
          if (!e.relatedTarget || !e.currentTarget.parentNode.contains(e.relatedTarget)) {
            setTimeout(() => {
              if (!document.activeElement || !editableRef.current.parentNode.contains(document.activeElement)) {
                onFinishEditing();
              }
            }, 100);
          }
        }}
      />
    </div>
  );
};

export default EditableParagraph;