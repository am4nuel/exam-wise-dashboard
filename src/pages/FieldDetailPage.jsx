import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  BookOpen, 
  ArrowLeft, 
  FileText, 
  ChevronRight, 
  Building2, 
  Edit2, 
  Trash2, 
  Plus, 
  X,
  ChevronLeft,
  Search
} from 'lucide-react';
import './DetailPage.css';

const FieldDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [field, setField] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Stats
  const [stats, setStats] = useState({ courses: 0 });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'link' | 'mass'
  const [editingItem, setEditingItem] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', code: '', credits: 3, description: '' });
  const [massCourseText, setMassCourseText] = useState('');
  
  // Linking State
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id, currentPage, searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch field details
      const fieldResponse = await API.get(`${ROUTES.ADMIN.FIELDS}/${id}`);
      setField(fieldResponse.data);
      if (fieldResponse.data.stats) {
        setStats(fieldResponse.data.stats);
      }

      // Fetch courses in this field with pagination
      const coursesResponse = await API.get(ROUTES.ADMIN.COURSES, {
        params: { 
          fieldId: id, 
          page: currentPage, 
          limit,
          search: searchTerm
        }
      });
      setCourses(coursesResponse.data.data || []);
      setTotalPages(coursesResponse.data.pages || 1);
      setTotalItems(coursesResponse.data.total || 0);
      
      // Update stats from response total if needed
      setStats(prev => ({ ...prev, courses: coursesResponse.data.total }));

    } catch (error) {
      addToast('error', 'Failed to fetch details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.COURSES, { params: { limit: 100, search: courseSearch } });
      // Filter out courses that are already in this field
      const allCourses = response.data.data || [];
      setAvailableCourses(allCourses.filter(c => c.fieldId !== parseInt(id)));
    } catch (error) {
      console.error("Failed to fetch available courses", error);
    }
  };

  useEffect(() => {
    if (modalMode === 'link' && showModal) {
      fetchAvailableCourses();
    }
  }, [courseSearch, modalMode, showModal]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openLinkModal = () => {
    setModalMode('link');
    setCourseSearch('');
    setSelectedCourseIds([]);
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setCourseForm({ name: '', code: '', credits: 3, description: '' });
    setShowModal(true);
  };

  const openMassModal = () => {
    setModalMode('mass');
    setMassCourseText('');
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setModalMode('edit');
    setEditingItem(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      credits: course.credits || 3,
      description: course.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to remove this course from the field?')) {
      try {
        // Just unlink it by setting fieldId to null or deleting if strictly owned?
        // Usually "delete" means delete. If we want unlink, we'd use PUT.
        // Assuming delete for now based on previous code usually deleting entities.
        // But since we are "linking", maybe we should just unlink. 
        // Let's stick to DELETE for now as per previous logic, or maybe offer unlink?
        // User asked to "add courses to that field", implying a link. 
        // I will keep DELETE as "Delete Course" for now to avoid breaking existing functionality.
        await API.delete(`${ROUTES.ADMIN.COURSES}/${courseId}`);
        addToast('success', 'Course deleted successfully');
        fetchData(); // Refresh
      } catch (error) {
        addToast('error', 'Failed to delete course');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'link') {
        const promises = selectedCourseIds.map(courseId => 
          API.put(`${ROUTES.ADMIN.COURSES}/${courseId}`, { fieldId: id })
        );
        await Promise.all(promises);
        addToast('success', `${selectedCourseIds.length} courses linked successfully`);
      } else if (modalMode === 'mass') {
        const courseNames = massCourseText.split('\n').map(name => name.trim()).filter(name => name !== '');
        if (courseNames.length === 0) {
          addToast('error', 'Please enter at least one course name');
          return;
        }

        const coursesToCreate = courseNames.map(name => {
          // Generate a simple code: First 3 letters of name + random 3 digits (e.g., MAT123)
          // Or a more structured one if needed. Let's do Name initial + count-based?
          // Actually, let's just use the name for code if it's short, or a standard prefix.
          // The user said "genertae course code by your self".
          const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
          const prefix = cleanName.substring(0, 3) || 'CRS';
          const randomSuffix = Math.floor(100 + Math.random() * 899);
          
          return {
            name: name,
            code: `${prefix}${randomSuffix}`,
            credits: 3,
            fieldId: id,
            description: `Auto-generated course for ${field.name}`
          };
        });

        await API.post(ROUTES.ADMIN.BULK_CREATE_COURSES, { courses: coursesToCreate });
        addToast('success', `${coursesToCreate.length} courses created successfully`);
      } else {
        const payload = { ...courseForm, fieldId: id };
        
        if (modalMode === 'add') {
          await API.post(ROUTES.ADMIN.COURSES, payload);
          addToast('success', 'Course created successfully');
        } else {
          await API.put(`${ROUTES.ADMIN.COURSES}/${editingItem.id}`, payload);
          addToast('success', 'Course updated successfully');
        }
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      addToast('error', 'Failed to save course');
      console.error(error);
    }
  };

  const getPaginationGroup = () => {
    let start = Math.floor((currentPage - 1) / 5) * 5;
    return new Array(Math.min(5, totalPages - start)).fill().map((_, idx) => start + idx + 1);
  };

  if (loading && !field) {
    return <div className="loading-state">Loading...</div>;
  }

  if (!field) {
    return <div className="error-state">Field not found</div>;
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
            <BookOpen size={32} />
          </div>
          <div>
            <h1>{field.name}</h1>
            <p className="detail-subtitle">{field.code}</p>
            {field.department && (
              <div className="breadcrumb">
                <Building2 size={16} />
                <span>{field.department.name}</span>
              </div>
            )}
            {field.description && (
              <p className="detail-description">{field.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
           <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{stats.courses}</span>
                <span className="stat-label">Total Courses</span>
              </div>
            </div>
           </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <div>
              <h2>Courses in this Field</h2>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                <button className="secondary-btn" onClick={openMassModal}>
                   <span>Create in Mass</span>
                </button>
                <button className="secondary-btn" onClick={openAddModal}>
                   <span>Create New</span>
                </button>
                <button className="primary-btn" onClick={openLinkModal}>
                  <Plus size={18} />
                  <span>Add Existing Course</span>
                </button>
                
                <div className="search-box" style={{ width: '250px', marginLeft: '10px' }}>
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search courses..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '35px' }}
                  />
                </div>
              </div>
            </div>

            {/* Pagination Top Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {totalItems > 0 && (
                <div className="pagination-top-right">
                  <div className="pagination-controls">
                    <button 
                      className="page-btn" 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="page-numbers">
                      {getPaginationGroup().map((item, index) => (
                        <button 
                          key={index}
                          className={`page-num ${currentPage === item ? 'active' : ''}`}
                          onClick={() => handlePageChange(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <button 
                      className="page-btn" 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="pagination-info" style={{ textAlign: 'right', marginTop: '4px', opacity: 0.8 }}>
                    Showing <b>{(currentPage - 1) * limit + 1}</b> to <b>{Math.min(currentPage * limit, totalItems)}</b> of <b>{totalItems}</b>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="content-table-wrapper">
             <table className="content-table">
               <thead>
                 <tr>
                   <th>Code</th>
                   <th>Name</th>
                   <th>Credits</th>
                   <th>Description</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                  {courses.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No courses found</td></tr>
                  ) : (
                    courses.map(course => (
                      <tr 
                        key={course.id} 
                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><span className="code-badge">{course.code}</span></td>
                        <td><b>{course.name}</b></td>
                        <td>{course.credits}</td>
                        <td className="truncate-cell">{course.description || '-'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEditModal(course); }}>
                              <Edit2 size={16} />
                            </button>
                            <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {modalMode === 'add' ? 'Create New Course' : 
                 modalMode === 'edit' ? 'Edit Course' : 
                 modalMode === 'link' ? 'Add Existing Courses' :
                 'Create Courses in Mass'}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {modalMode === 'link' ? (
                <div className="link-course-container">
                  <input 
                    type="text" 
                    placeholder="Search available courses..." 
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="modal-search-input"
                    style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-accent)', color: 'var(--text-primary)' }}
                  />
                  
                  <div className="course-list" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableCourses.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No available courses found.</p>
                    ) : (
                      availableCourses.map(course => (
                        <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={selectedCourseIds.includes(course.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCourseIds(prev => [...prev, course.id]);
                              else setSelectedCourseIds(prev => prev.filter(id => id !== course.id));
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{course.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{course.code}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ) : modalMode === 'mass' ? (
                <div className="form-group">
                  <label>Course Names (New line separated)</label>
                  <textarea 
                    rows={10}
                    placeholder="Course 1&#10;Course 2&#10;Course 3"
                    value={massCourseText}
                    onChange={(e) => setMassCourseText(e.target.value)}
                    required
                  />
                  <p className="form-help" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Enter each course name on a separate line. Codes will be auto-generated.
                  </p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Course Name</label>
                    <input 
                      type="text" 
                      required 
                      value={courseForm.name}
                      onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Code</label>
                    <input 
                      type="text" 
                      required 
                      value={courseForm.code}
                      onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Credits</label>
                    <input 
                      type="number" 
                      required 
                      value={courseForm.credits}
                      onChange={(e) => setCourseForm({...courseForm, credits: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      rows={3}
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">
                  {modalMode === 'add' ? 'Create' : 
                   modalMode === 'edit' ? 'Save Changes' : 
                   modalMode === 'link' ? `Add Selected (${selectedCourseIds.length})` :
                   'Create All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldDetailPage;
