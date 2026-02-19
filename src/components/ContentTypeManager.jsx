import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, FileText } from 'lucide-react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import './ContentTypeManager.css';

const ContentTypeManager = ({ onClose }) => {
  const { addToast } = useToast();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await API.get(ROUTES.ADMIN.CONTENT_TYPES);
      setTypes(res.data);
    } catch (error) {
      addToast('error', 'Failed to fetch content types');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Auto-generate slug from name if adding new and not manually edited
    if (name === 'name' && !editingId) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, name: value, slug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      return addToast('error', 'Name and Slug are required');
    }

    try {
      if (editingId) {
        await API.put(ROUTES.ADMIN.UPDATE_CONTENT_TYPE(editingId), formData);
        addToast('success', 'Content Type updated');
      } else {
        await API.post(ROUTES.ADMIN.CONTENT_TYPES, formData);
        addToast('success', 'Content Type created');
      }
      setFormData({ name: '', slug: '', description: '' });
      setEditingId(null);
      fetchTypes();
      // Switch to manage tab after creating
      if (!editingId) {
        setActiveTab('manage');
      }
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      slug: type.slug,
      description: type.description || ''
    });
    // Switch to create tab for editing
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content type?')) return;
    try {
      await API.delete(ROUTES.ADMIN.DELETE_CONTENT_TYPE(id));
      addToast('success', 'Content Type deleted');
      fetchTypes();
    } catch (error) {
      addToast('error', 'Delete failed');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '' });
  };

  return (
    <div className="content-type-manager-overlay" onClick={onClose}>
      <div className="content-type-manager-drawer" onClick={e => e.stopPropagation()}>
        <div className="ctm-header">
          <h2><FileText size={20} /> Content Types</h2>
          <button className="ctm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="ctm-tabs">
          <button 
            className={`ctm-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={16} />
            {editingId ? 'Edit Type' : 'Create Type'}
          </button>
          <button 
            className={`ctm-tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('manage');
              cancelEdit();
            }}
          >
            <FileText size={16} />
            Manage Types
          </button>
        </div>

        <div className="ctm-content">
          {/* Create/Edit Tab */}
          {activeTab === 'create' && (
            <form className="ctm-form-card" onSubmit={handleSubmit}>
              <div className="ctm-form-header">
                {editingId ? 'Edit Content Type' : 'Create New Content Type'}
              </div>
              
              <div className="ctm-input-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="ctm-input"
                  placeholder="e.g. Past Exam"
                  autoFocus
                />
              </div>

              <div className="ctm-input-group">
                <label>Slug (Unique ID)</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="ctm-input"
                  placeholder="e.g. past-exam"
                />
              </div>

              <div className="ctm-input-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="ctm-input ctm-textarea"
                  placeholder="Optional description..."
                />
              </div>

              <div className="ctm-btn-group">
                {editingId && (
                  <button type="button" className="ctm-btn ctm-btn-secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="ctm-btn ctm-btn-primary">
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="ctm-list">
              <div className="ctm-list-header">
                <span className="ctm-list-title">All Content Types</span>
                <span className="ctm-list-count">{types.length}</span>
              </div>
              
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  Loading...
                </div>
              ) : types.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  No content types yet. Create one in the "Create Type" tab.
                </div>
              ) : (
                types.map(type => (
                  <div key={type.id} className="ctm-item">
                    <div className="ctm-item-info">
                      <h4>{type.name} <span className="ctm-item-slug">{type.slug}</span></h4>
                      <p className="ctm-item-desc">{type.description || 'No description'}</p>
                    </div>
                    <div className="ctm-item-actions">
                      <button 
                        className="ctm-action-btn ctm-edit" 
                        onClick={() => handleEdit(type)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="ctm-action-btn ctm-delete" 
                        onClick={() => handleDelete(type.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentTypeManager;
