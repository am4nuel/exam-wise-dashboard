import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye } from 'lucide-react';
import './ContentPreview.css';

const ContentPreview = ({ content, show }) => {
  if (!show || !content) return null;

  // Detect content type (similar to Flutter's AppContentRenderer)
  const isPptxHtml = (text) => {
    return text.includes('class="slide"') || 
           text.includes('id="slide-"') || 
           (text.includes('<img') && text.includes('data:image') && text.includes('Slide'));
  };

  const isRawBase64Image = (text) => {
    if (text.startsWith('data:image')) return true;
    if (text.length > 100 && !text.includes(' ')) {
      return /^[A-Za-z0-9+/]*={0,2}$/.test(text);
    }
    return false;
  };

  const containsLatex = (text) => {
    return text.includes('$$') || 
           text.includes('\\(') || 
           text.includes('\\[') || 
           text.includes('\\begin{');
  };

  const isHtml = (text) => {
    return text.includes('<') && text.includes('>');
  };

  // Render based on content type
  const renderContent = () => {
    const trimmedContent = content.trim();

    // PPTX HTML
    if (isPptxHtml(trimmedContent)) {
      return (
        <div 
          className="pptx-html-preview"
          dangerouslySetInnerHTML={{ __html: trimmedContent }}
        />
      );
    }

    // Raw Base64 Image
    if (isRawBase64Image(trimmedContent)) {
      const base64String = trimmedContent.startsWith('data:image')
        ? trimmedContent
        : `data:image/jpeg;base64,${trimmedContent}`;
      return (
        <div className="base64-image-preview">
          <img src={base64String} alt="Preview" />
        </div>
      );
    }

    // LaTeX (basic support - would need a library like KaTeX for full support)
    if (containsLatex(trimmedContent)) {
      return (
        <div className="latex-preview">
          <div className="latex-notice">
            <Eye size={16} />
            <span>LaTeX content detected. Full LaTeX rendering requires additional setup.</span>
          </div>
          <pre>{trimmedContent}</pre>
        </div>
      );
    }

    // HTML
    if (isHtml(trimmedContent)) {
      return (
        <div 
          className="html-preview"
          dangerouslySetInnerHTML={{ __html: trimmedContent }}
        />
      );
    }

    // Default to Markdown
    return (
      <div className="markdown-preview">
        <ReactMarkdown>{trimmedContent}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="content-preview-container">
      <div className="preview-header">
        <Eye size={16} />
        <span>App Preview</span>
      </div>
      <div className="preview-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentPreview;
