import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { FileText, ArrowLeft, List, Building2, BookOpen, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import './DetailPage.css';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'chapter',
    order: 0,
    parentId: ''
  });

  const topicTypes = ['chapter', 'topic', 'subtopic', 'subsubtopic'];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const courseResponse = await API.get(`${ROUTES.ADMIN.COURSES}/${id}`);
      setCourse(courseResponse.data);

      // Fetch topics under this course
      const topicsResponse = await API.get(ROUTES.ADMIN.TOPICS, {
        params: { courseId: id, limit: 1000 }
      });
      setTopics(topicsResponse.data.data || []);
    } catch (error) {
      addToast('error', 'Failed to fetch course details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        name: topic.name,
        type: topic.type,
        order: topic.order,
        parentId: topic.parentId || ''
      });
    } else {
      setEditingTopic(null);
      setFormData({
        name: '',
        type: 'chapter',
        order: (topics.length + 1),
        parentId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTopic(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        courseId: id,
        parentId: formData.parentId ? parseInt(formData.parentId) : null
      };

      if (editingTopic) {
        await API.put(`${ROUTES.ADMIN.TOPICS}/${editingTopic.id}`, payload);
        addToast('success', 'Topic updated successfully');
      } else {
        await API.post(ROUTES.ADMIN.TOPICS, payload);
        addToast('success', 'Topic created successfully');
      }
      
      handleCloseModal();
      fetchData(); // Refresh list
    } catch (error) {
      addToast('error', error.response?.data?.error || 'Failed to save topic');
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      await API.delete(`${ROUTES.ADMIN.TOPICS}/${topicId}`);
      addToast('success', 'Topic deleted successfully');
      fetchData();
    } catch (error) {
      addToast('error', 'Failed to delete topic');
    }
  };

  // Helper to get potential parents (only chapters or topics usually)
  const potentialParents = topics.filter(t => t.type !== 'subsubtopic' && t.id !== editingTopic?.id);

  if (loading) {
    return <div className="loading-state">Loading course details...</div>;
  }

  if (!course) {
    return <div className="error-state">Course not found</div>;
  }

  return (
    <div className="detail-page">
      <div className="detail-nav-bar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      <div className="detail-header">
        <div className="detail-title-section">
          <div className="detail-icon">
            <FileText size={32} />
          </div>
          <div>
            <h1>{course.name}</h1>
            <p className="detail-subtitle">{course.code}</p>
            
            {/* Breadcrumb */}
            {course.field && (
              <div className="breadcrumb-trail">
                {course.field.department && (
                  <>
                    <div className="breadcrumb">
                      <Building2 size={14} />
                      <span>{course.field.department.name}</span>
                    </div>
                    <span className="breadcrumb-separator">›</span>
                  </>
                )}
                <div className="breadcrumb">
                  <BookOpen size={14} />
                  <span>{course.field.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-content">
        {/* Stats Grid */}
        <div className="detail-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
           <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <List size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{course.stats?.topics || topics.length}</span>
                <span className="stat-label">Topics</span>
              </div>
            </div>
           </div>

           <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{course.stats?.packages || 0}</span>
                <span className="stat-label">Packages</span>
              </div>
            </div>
           </div>

           <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{course.credits || 0}</span>
                <span className="stat-label">Credits</span>
              </div>
            </div>
           </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Topics Management</h2>
            <div className="header-actions">
               <span className="count-badge">{topics.length} topics</span>
               <button className="create-btn" onClick={() => handleOpenModal()}>
                 <Plus size={16} />
                 Add Topic
               </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      <div className="empty-state-small">
                        <List size={24} />
                        <span>No topics found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  topics.map((topic) => (
                    <tr key={topic.id}>
                      <td>{topic.order}</td>
                      <td>
                        <div style={{ paddingLeft: topic.type === 'subtopic' ? '20px' : topic.type === 'subsubtopic' ? '40px' : '0' }}>
                            {topic.name}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${topic.type}`}>
                          {topic.type}
                        </span>
                      </td>
                      <td>{topic.parent?.name || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => handleOpenModal(topic)} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(topic.id)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Topic Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Introduction to Physics"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {topicTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                    <label>Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    />
                </div>
              </div>

              <div className="form-group">
                   <label>Parent Topic (Optional)</label>
                   <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                   >
                     <option value="">None (Top Level)</option>
                     {potentialParents.map(p => (
                       <option key={p.id} value={p.id}>
                         {p.name} ({p.type})
                       </option>
                     ))}
                   </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <Save size={16} />
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
          .topics-list { display: none; } /* Hide old list if styles persist */
          .status-badge.chapter { background: #e0f2fe; color: #0369a1; }
          .status-badge.topic { background: #f0fdf4; color: #15803d; }
          .status-badge.subtopic { background: #fefce8; color: #a16207; }
          .status-badge.subsubtopic { background: #f5f5f5; color: #525252; }
      `}</style>
    </div>
  );
};

export default CourseDetailPage;
