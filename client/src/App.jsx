import React, { useRef, useState, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [html, setHtml] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const docRef = useRef(null);
  const quillRef = useRef(null);
  const activeWrapperRef = useRef(null);

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
    const cleanedHtml = docRef.current.innerHTML;
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: cleanedHtml })
    });

    const result = await res.json();
    setDownloadUrl(result.downloadUrl);
  };

  useEffect(() => {
    if (!docRef.current) return;

    const paragraphs = docRef.current.querySelectorAll('p');

    paragraphs.forEach((p) => {
      p.style.cursor = 'pointer';

      const handleClick = () => {
        if (activeWrapperRef.current || document.querySelector('#editor')) return;

        const originalHTML = `<h1>Hi!</h1><div><p class="${p.className}" style="${p.getAttribute('style') || ''}">${p.innerHTML}</p></div>`;
        console.log("originalHTML: ", originalHTML);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'quill-wrapper';

        const editorDiv = document.createElement('div');
        editorDiv.id = 'editor';
        wrapper.appendChild(editorDiv);

        p.replaceWith(wrapper);
        activeWrapperRef.current = wrapper;

        setTimeout(() => {
          const quill = new Quill(editorDiv, { theme: 'snow' });
          console.log("originalHTML: ", originalHTML);
          const delta = quill.clipboard.convert({
            html: originalHTML
          });
          quill.setContents(delta, 'silent')
          quill.focus();
          quillRef.current = quill;

          const finishEdit = () => {
            const updatedHTML = quill.root.innerHTML;
            const newP = document.createElement('p');
            newP.innerHTML = updatedHTML;
            newP.style.cursor = 'pointer';
            newP.addEventListener('click', handleClick);
            wrapper.replaceWith(newP);

            activeWrapperRef.current = null;
            quillRef.current = null;
          };

      //    quill.root.addEventListener('blur', finishEdit, { once: true });
        }, 0);
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
      <button onClick={handleSave} style={{ marginLeft: '1rem' }}>
        Save and Download DOCX
      </button>

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

      {downloadUrl && (
        <div style={{ marginTop: '2rem' }}>
          <a href={downloadUrl} download="Edited.docx">
            Download Edited DOCX
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
