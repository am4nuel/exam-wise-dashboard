import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const PdfViewer = ({ pdfUrl, onClose }) => {
  return (
    <div className="pdf-viewer-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8f9fa',
      position: 'relative'
    }}>
      {/* Toolbar */}
      <div className="pdf-toolbar" style={{
        padding: '10px 16px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
          Document Preview
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Optional: Open in New Tab for fallback */}
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="icon-btn"
            title="Open in New Tab"
            style={{ textDecoration: 'none', color: '#64748b' }}
          >
             <ExternalLink size={20} />
          </a>

          <button onClick={onClose} className="icon-btn" title="Close">
               <X size={20} />
          </button>
        </div>
      </div>

      {/* Document Area */}
      <div className="pdf-document-area" style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        background: '#525659' // Common PDF viewer background color
      }}>
        <iframe 
          src={pdfUrl} 
          width="100%" 
          height="100%" 
          style={{ border: 'none', display: 'block' }} 
          title="PDF Viewer"
        />
      </div>
      
      <style>{`
        .icon-btn {
            background: transparent;
            border: 1px solid transparent;
            border-radius: 6px;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
            padding: 6px;
        }
        .icon-btn:hover {
            background: #f1f5f9;
            color: #0f172a;
        }
      `}</style>
    </div>
  );
};

export default PdfViewer;
