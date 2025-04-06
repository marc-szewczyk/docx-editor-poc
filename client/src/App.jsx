import React, { useRef, useState, useEffect } from 'react';

const App = () => {
  const [file, setFile] = useState(null);
  const [html, setHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const docRef = useRef(null);
  const activeEditableRef = useRef(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('docx', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    setHtml(result.html);
  };

  const handleSave = async () => {
    try {
      const cleanedHtml = docRef.current.innerHTML;
      
      // Show saving indicator
      setSaving(true);
      
      // Use fetch to send the HTML to the server
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: cleanedHtml })
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      // Get the JSON response with file location info
      const result = await res.json();
      
      if (result.success) {
        // Show success message with file location info
        setServerMessage(result.message);
        
        // If there's a download URL, set it for the download link
        if (result.downloadUrl) {
          setDownloadUrl(`http://localhost:5000${result.downloadUrl}`);
        }
        
        // Set success state
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      } else {
        // Show error message from server
        setServerMessage(result.message || 'File processing failed on server');
        alert('DOCX generation had issues. See details in the message below.');
      }
    } catch (error) {
      console.error('Save error:', error);
      setServerMessage(`Error: ${error.message}`);
      alert('Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Function to execute a document command
  const execFormatCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };
  
  // Create a toolbar for formatting
  const createEditorToolbar = (editableElement) => {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    
    // Font family selector
    const fontSelector = document.createElement('select');
    fontSelector.className = 'font-options';
    fontSelector.innerHTML = `
      <option value="">Font...</option>
      <option value="Arial, sans-serif">Arial</option>
      <option value="Calibri, sans-serif">Calibri</option>
      <option value="'Comic Sans MS', cursive">Comic Sans</option>
      <option value="'Courier New', monospace">Courier New</option>
      <option value="Georgia, serif">Georgia</option>
      <option value="Helvetica, sans-serif">Helvetica</option>
      <option value="'Times New Roman', Times, serif">Times New Roman</option>
      <option value="Verdana, sans-serif">Verdana</option>
    `;
    fontSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        // Extract just the primary font name without fallbacks
        const primaryFont = e.target.value.split(',')[0].replace(/['"]/g, '').trim();
        console.log(`Setting font: ${primaryFont} (from ${e.target.value})`);
        execFormatCommand('fontName', primaryFont);
      }
    });
    
    // Font size selector
    const sizeSelector = document.createElement('select');
    sizeSelector.className = 'size-options';
    sizeSelector.innerHTML = `
      <option value="">Size...</option>
      <option value="1">Small</option>
      <option value="3">Normal</option>
      <option value="5">Large</option>
      <option value="7">Huge</option>
    `;
    sizeSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        execFormatCommand('fontSize', e.target.value);
      }
    });
    
    // Bold button
    const boldButton = document.createElement('button');
    boldButton.innerHTML = '<b>B</b>';
    boldButton.title = 'Bold';
    boldButton.addEventListener('click', () => execFormatCommand('bold'));
    
    // Italic button
    const italicButton = document.createElement('button');
    italicButton.innerHTML = '<i>I</i>';
    italicButton.title = 'Italic';
    italicButton.addEventListener('click', () => execFormatCommand('italic'));
    
    // Underline button
    const underlineButton = document.createElement('button');
    underlineButton.innerHTML = '<u>U</u>';
    underlineButton.title = 'Underline';
    underlineButton.addEventListener('click', () => execFormatCommand('underline'));
    
    // Text color picker
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'color-picker';
    colorPicker.title = 'Text Color';
    colorPicker.addEventListener('change', (e) => {
      execFormatCommand('foreColor', e.target.value);
    });
    
    // Background color picker
    const bgColorPicker = document.createElement('input');
    bgColorPicker.type = 'color';
    bgColorPicker.className = 'color-picker';
    bgColorPicker.title = 'Background Color';
    bgColorPicker.addEventListener('change', (e) => {
      execFormatCommand('hiliteColor', e.target.value);
    });
    
    // Left align
    const alignLeftButton = document.createElement('button');
    alignLeftButton.innerHTML = '⫪';
    alignLeftButton.title = 'Align Left';
    alignLeftButton.addEventListener('click', () => execFormatCommand('justifyLeft'));
    
    // Center align
    const alignCenterButton = document.createElement('button');
    alignCenterButton.innerHTML = '⫱';
    alignCenterButton.title = 'Align Center';
    alignCenterButton.addEventListener('click', () => execFormatCommand('justifyCenter'));
    
    // Right align
    const alignRightButton = document.createElement('button');
    alignRightButton.innerHTML = '⫫';
    alignRightButton.title = 'Align Right';
    alignRightButton.addEventListener('click', () => execFormatCommand('justifyRight'));
    
    // Add all elements to toolbar
    toolbar.appendChild(fontSelector);
    toolbar.appendChild(sizeSelector);
    toolbar.appendChild(boldButton);
    toolbar.appendChild(italicButton);
    toolbar.appendChild(underlineButton);
    toolbar.appendChild(colorPicker);
    toolbar.appendChild(bgColorPicker);
    toolbar.appendChild(alignLeftButton);
    toolbar.appendChild(alignCenterButton);
    toolbar.appendChild(alignRightButton);
    
    return toolbar;
  };

  useEffect(() => {
    if (!docRef.current) return;

    const paragraphs = docRef.current.querySelectorAll('p');

    paragraphs.forEach((p) => {
      p.style.cursor = 'pointer';

      const handleClick = () => {
        if (activeEditableRef.current) return;

        // Store original content and styles
        const originalContent = p.innerHTML;
        const originalClassNames = p.className;
        const originalStyles = p.getAttribute('style') || '';
        
        // Create editable paragraph to replace the original
        const editableP = document.createElement('p');
        editableP.innerHTML = originalContent;
        editableP.className = originalClassNames + ' editable-paragraph';
        editableP.contentEditable = true;
        
        // Apply all original styles
        editableP.setAttribute('style', originalStyles);
        editableP.style.cursor = 'text';
        
        // Create a positioned container for the paragraph
        const editingContainer = document.createElement('div');
        editingContainer.style.position = 'relative'; // For absolute positioning of toolbar
        
        // Create and add toolbar
        const toolbar = createEditorToolbar(editableP);
        
        // Add editable paragraph first
        editingContainer.appendChild(editableP);
        
        // Add toolbar after (but it will display above due to absolute positioning)
        editingContainer.appendChild(toolbar);
        
        // Replace original paragraph with editing container
        p.replaceWith(editingContainer);
        activeEditableRef.current = editingContainer;
        
        // Focus on the editable paragraph
        editableP.focus();
        
        // Function to finish editing
        const finishEdit = (e) => {
          // Only finish if clicking outside the editing container
          if (editingContainer.contains(e.target)) return;
          
          // Get the edited content
          const updatedHTML = editableP.innerHTML;
          
          // Create a new paragraph with the updated content
          const newP = document.createElement('p');
          newP.innerHTML = updatedHTML;
          newP.className = originalClassNames;
          
          // Apply the original styles (cursor, etc.)
          if (originalStyles) {
            newP.setAttribute('style', originalStyles);
          }
          newP.style.cursor = 'pointer';
          
          // Add click handler for future edits
          newP.addEventListener('click', handleClick);
          
          // Replace editor with the new paragraph
          editingContainer.replaceWith(newP);
          activeEditableRef.current = null;
          
          // Remove the document click listener
          document.removeEventListener('mousedown', finishEdit);
        };
        
        // Handle clicking outside to finish editing
        document.addEventListener('mousedown', finishEdit);
      };

      p.addEventListener('click', handleClick);
    });
  }, [html]);

  return (
    <div>
      <h1>DOCX Editor POC</h1>
      <input
        type="file"
        accept=".docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file}>
        Upload & Convert
      </button>
      <button 
        onClick={handleSave} 
        style={{ marginLeft: '1rem' }}
        disabled={saving}
      >
        {saving ? 'Processing...' : 'Save and Generate DOCX'}
      </button>

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

      <div
        ref={docRef}
        style={{
          marginTop: '2rem',
          padding: '1in',
          width: '8.5in',
          minHeight: '11in',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          boxShadow: '0 0 5px rgba(0,0,0,0.1)',
          margin: '2rem auto'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default App;