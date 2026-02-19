import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search,
  List,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import './CoursesPage.css';

const CoursesPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'topics'
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Field Filter Logic
  const [fields, setFields] = useState([]);
  const [fieldFilterSearch, setFieldFilterSearch] = useState('');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState(null);
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false);
  const [fieldSuggestions, setFieldSuggestions] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Topics View State
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // Forms
  const [courseForm, setCourseForm] = useState({ name: '', code: '', departmentId: '', fieldId: '', credits: 3 });
  const [topicForm, setTopicForm] = useState({ name: '', description: '', type: 'chapter', courseId: '', parentId: '' });
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Modal Fields State
  const [modalFields, setModalFields] = useState([]);
  const [loadingModalFields, setLoadingModalFields] = useState(false);

  // Auto-generate Course Code
  const generateCourseCode = (name) => {
    if (!name) return '';
    const initials = name
      .split(' ')
      .map(word => word[0])
      .filter(char => char && char.match(/[a-zA-Z]/))
      .join('')
      .toUpperCase();
    
    // Add a hash-like number from name length and first/last chars to be deterministic but varied
    const suffix = (name.length * 13 + (name.charCodeAt(0) || 0) + (name.charCodeAt(name.length-1) || 0)) % 1000;
    return `${initials}${suffix.toString().padStart(3, '0')}`;
  };

  const handleCourseNameChange = (name) => {
    const code = modalMode === 'add' ? generateCourseCode(name) : courseForm.code;
    setCourseForm({ ...courseForm, name, code });
  };

  // Cascaded Autocomplete State (Topics Tab)
  const [selectedField, setSelectedField] = useState(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldSuggestionsList, setFieldSuggestionsList] = useState([]);
  const [showFieldSuggestionsList, setShowFieldSuggestionsList] = useState(false);
  const [isSearchingFields, setIsSearchingFields] = useState(false);

  const [courseSearch, setCourseSearch] = useState('');

  const [courseSuggestions, setCourseSuggestions] = useState([]);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const [isSearchingCourses, setIsSearchingCourses] = useState(false);

  useEffect(() => {
    fetchInitialData(1);
  }, []); // Only fetch once on mount

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    
    if (activeTab === 'topics') {
      fetchTopics(selectedCourseId, 1, '');
    } else {
      fetchInitialData(1, '');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'topics' && selectedCourseId) {
      setCurrentPage(1);
      fetchTopics(selectedCourseId, 1, '');
    }
  }, [selectedCourseId]);

  const fetchInitialData = async (pageValue = currentPage, search = searchTerm, fieldId = selectedFieldFilter?.id) => {
    setLoading(true);
    try {
      const [courseRes, metaRes] = await Promise.all([
        API.get(ROUTES.ADMIN.COURSES, { params: { page: pageValue, limit, search, fieldId }}),
        API.get(ROUTES.ADMIN.METADATA)
      ]);
      setCourses(courseRes.data.data);
      setTotalPages(courseRes.data.pages);
      setTotalItems(courseRes.data.total);
      setDepartments(metaRes.data.departments || []);
      setFields(metaRes.data.fields || []);
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSearch = async (val) => {
    setFieldSearch(val);
    if (!val) {
      setFieldSuggestionsList([]);
      setShowFieldSuggestionsList(false);
      return;
    }
    const filtered = fields.filter(f => f.name.toLowerCase().includes(val.toLowerCase()));
    setFieldSuggestionsList(filtered);
    setShowFieldSuggestionsList(true);
  };

  const handleCourseSearch = async (val) => {
    setCourseSearch(val);
    if (!selectedField) {
      setCourseSuggestions([]);
      return;
    }
    setIsSearchingCourses(true);
    try {
      const res = await API.get(ROUTES.ADMIN.COURSES, { 
        params: { fieldId: selectedField.id, search: val, limit: 10 } 
      });
      setCourseSuggestions(res.data.data);
      setShowCourseSuggestions(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCourses(false);
    }
  };

  const fetchModalFields = async (departmentId) => {
    if (!departmentId) {
      setModalFields([]);
      return;
    }
    setLoadingModalFields(true);
    try {
      const res = await API.get(ROUTES.ADMIN.FIELDS, { params: { departmentId, limit: 100 } });
      setModalFields(res.data.data || []);
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to fetch fields for department');
    } finally {
      setLoadingModalFields(false);
    }
  };

  const selectField = (field) => {
    setSelectedField(field);
    setFieldSearch(field.name);
    setShowFieldSuggestionsList(false);
    // Reset course selection when field changes
    setSelectedCourseId('');
    setCourseSearch('');
    setCourseSuggestions([]);
  };

  const selectCourse = (course) => {
    setSelectedCourseId(course.id);
    setCourseSearch(course.name);
    setShowCourseSuggestions(false);
  };

  const fetchTopics = async (courseId, pageValue = currentPage, search = searchTerm) => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.TOPICS, { 
        params: { courseId: courseId || undefined, page: pageValue, limit, search } 
      });
      setTopics(response.data.data);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (error) {
      addToast('error', 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setCurrentPage(1);
      if (activeTab === 'courses') {
        fetchInitialData(1, term, selectedFieldFilter?.id);
      } else {
        fetchTopics(selectedCourseId, 1, term);
      }
    }, 500));
  };
  
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (activeTab === 'courses') {
      fetchInitialData(newPage, searchTerm, selectedFieldFilter?.id);
    } else {
      fetchTopics(selectedCourseId, newPage);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.autocomplete-container')) {
        setShowFieldSuggestionsList(false);
        setShowCourseSuggestions(false);
        setShowFieldSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPaginationGroup = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end === totalPages) {
      start = Math.max(1, end - 4);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // --- CRUD ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'courses') {
        if (modalMode === 'add') {
          await API.post(ROUTES.ADMIN.COURSES, courseForm);
          addToast('success', 'Course created');
        } else {
          await API.put(ROUTES.ADMIN.UPDATE_COURSE(editingItem.id), courseForm);
          addToast('success', 'Course updated');
        }
        await fetchInitialData(currentPage);
      } else {
        // Topic CRUD
        if (modalMode === 'add') {
          await API.post(ROUTES.ADMIN.TOPICS, { ...topicForm, courseId: selectedCourseId }); // Ensure courseId is set
          addToast('success', 'Topic created');
        } else {
          await API.put(ROUTES.ADMIN.UPDATE_TOPIC(editingItem.id), topicForm);
          addToast('success', 'Topic updated');
        }
        fetchTopics(selectedCourseId);
      }
      setShowModal(false);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    try {
      if (activeTab === 'courses') {
        await API.delete(ROUTES.ADMIN.DELETE_COURSE(id));
        await fetchInitialData(currentPage);
      } else {
        await API.delete(ROUTES.ADMIN.DELETE_TOPIC(id));
        fetchTopics(selectedCourseId);
      }
      addToast('success', 'Deleted successfully');
    } catch (error) {
      addToast('error', 'Delete failed');
    }
  };

  // ... (Helpers - getParentOptions, Modal Openers - same as before) ...
  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    if (activeTab === 'courses') {
      setCourseForm({ name: '', code: '', departmentId: '', fieldId: '', credits: 3 });
      setModalFields([]);
    } else {
      if (!selectedCourseId) {
        return addToast('error', 'Please select a course first');
      }
      setTopicForm({ name: '', description: '', type: 'chapter', courseId: selectedCourseId, parentId: '' });
    }
    setShowModal(true);
  };

  const openEditModal = async (item) => {
    setModalMode('edit');
    setEditingItem(item);
    if (activeTab === 'courses') {
      setCourseForm({
        name: item.name,
        code: item.code,
        departmentId: item.departmentId,
        fieldId: item.fieldId || '',
        credits: item.credits
      });
      // Load fields for the current department
      if (item.departmentId) {
        fetchModalFields(item.departmentId);
      }
    } else {
      setTopicForm({
        name: item.name,
        description: item.description,
        type: item.type,
        courseId: item.courseId,
        parentId: item.parentId || ''
      });
    }
    setShowModal(true);
  };

  const getParentOptions = () => {
    if (!editingItem) return topics;
    return topics.filter(t => t.id !== editingItem.id);
  };

  return (
    <div className="page-container courses-page">
       <div className="page-header">
        <div className="header-title">
          <h1>Course & Topic Management</h1>
          <p>Manage curriculum structure</p>
        </div>
        <div className="header-actions">
           <button className="add-btn" onClick={openAddModal}>
            <Plus size={20} />
            <span>Add {activeTab === 'courses' ? 'Course' : 'Topic'}</span>
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          Topics
        </button>
      </div>

      {activeTab === 'topics' && (
        <div className="cascaded-filter-bar">
          <div className="filter-group">
            <label>1. Select Field:</label>
            <div className="autocomplete-container">
              <input 
                type="text"
                placeholder="Search field..."
                value={fieldSearch}
                onChange={(e) => handleFieldSearch(e.target.value)}
                onFocus={() => handleFieldSearch(fieldSearch)}
              />
              {showFieldSuggestionsList && fieldSuggestionsList.length > 0 && (
                <ul className="suggestions-dropdown">
                  {fieldSuggestionsList.map(f => (
                    <li key={f.id} onClick={() => selectField(f)} className="suggestion-item">
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={`filter-group ${!selectedField ? 'disabled' : ''}`}>
            <label>2. Select Course:</label>
            <div className="autocomplete-container">
              <input 
                type="text"
                placeholder={selectedField ? "Search course..." : "Select field first"}
                value={courseSearch}
                disabled={!selectedField}
                onChange={(e) => handleCourseSearch(e.target.value)}
                onFocus={() => handleCourseSearch(courseSearch)}
              />
               {isSearchingCourses && <div className="searching-spinner">Searching...</div>}
              {showCourseSuggestions && courseSuggestions.length > 0 && (
                <ul className="suggestions-dropdown">
                  {courseSuggestions.map(c => (
                    <li key={c.id} onClick={() => selectCourse(c)} className="suggestion-item">
                      {c.name} <span className="course-code">{c.code}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {selectedCourseId && (
            <button className="clear-filter-btn" onClick={() => {
              setSelectedField(null);
              setFieldSearch('');
              setSelectedCourseId('');
              setCourseSearch('');
            }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Toolbar: Search + Filter + Pagination */}
      <div className="table-toolbar">
         {/* Search Bar */}
        <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'courses' ? 'Courses' : 'Topics'}...`}
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-field"
          />
        </div>

        {/* Field Filter Autocomplete */}
        {activeTab === 'courses' && (
          <div className="autocomplete-container" style={{ position: 'relative', width: '250px' }}>
             <Layers size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
             <input
              type="text"
              placeholder="Filter by Field..."
              value={fieldFilterSearch}
              onChange={(e) => {
                const val = e.target.value;
                setFieldFilterSearch(val);
                if (!val) {
                  setSelectedFieldFilter(null);
                  setFieldSuggestions([]);
                  setShowFieldSuggestions(false);
                  fetchInitialData(1, searchTerm, null);
                } else {
                  const filtered = fields.filter(f => f.name.toLowerCase().includes(val.toLowerCase()));
                  setFieldSuggestions(filtered);
                  setShowFieldSuggestions(true);
                }
              }}
              className="search-input-field" // Reuse style
            />
             {selectedFieldFilter && (
              <button 
                onClick={() => {
                  setSelectedFieldFilter(null);
                  setFieldFilterSearch('');
                  fetchInitialData(1, searchTerm, null);
                }}
                className="clear-filter-btn"
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              >
                <X size={14} />
              </button>
            )}

            {showFieldSuggestions && fieldSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {fieldSuggestions.map(field => (
                  <div 
                    key={field.id} 
                    className="suggestion-item"
                    onClick={() => {
                      setSelectedFieldFilter(field);
                      setFieldFilterSearch(field.name);
                      setShowFieldSuggestions(false);
                      fetchInitialData(1, searchTerm, field.id);
                    }}
                  >
                    {field.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Pagination */}
        {totalItems > 0 && (
          <div className="top-pagination">
             <span className="pagination-text">
              {currentPage} / {totalPages}
            </span>
            <div className="pagination-buttons">
              <button 
                className="page-btn-mini" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="page-btn-mini" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>


      <div className="content-table-wrapper">
        <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  {activeTab === 'courses' ? (
                    <>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Field</th>
                      <th>Credits</th>
                      <th>Actions</th>
                    </>
                  ) : (
                    <>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Course</th>
                      <th>Parent Topic</th>
                      <th>Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="loading-row">
                      <td colSpan="5">
                        <div className="skeleton-bar"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  activeTab === 'courses' ? (
                  courses.length === 0 ? (
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
                        <td>{course.field?.name || '-'}</td>
                        <td>{course.credits}</td>
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
                  )
                ) : (
                  // Topics Table
                  topics.length === 0 ? (
                    <tr><td colSpan={5} className="empty-state">No topics found</td></tr>
                  ) : (
                    topics.map(topic => (
                      <tr key={topic.id}>
                        <td>
                          <span className={`type-badge ${topic.type}`}>{topic.type}</span>
                        </td>
                        <td>
                          <div style={{ marginLeft: topic.parentId ? '24px' : '0' }}>
                             {topic.parentId && <span className="tree-connector">└─ </span>}
                             {topic.name}
                          </div>
                        </td>
                        <td>{topics.find(t => t.id === topic.parentId)?.name || '-'}</td>
                        <td>
                           <div className="action-btns">
                            <button className="action-btn edit" onClick={() => openEditModal(topic)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDelete(topic.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )
                )}
              </tbody>
            </table>
        </div>
        

      </div>

      {/* ... (Modal - same as before) ... */}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {modalMode === 'add' ? 'Add New' : 'Edit'}
                {' '}
                {activeTab === 'courses' ? 'Course' : 'Topic'}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-body">
                {activeTab === 'courses' ? (
                <>
                  <div className="form-group">
                    <label>Course Name</label>
                    <input 
                      type="text" 
                      required 
                      value={courseForm.name}
                      onChange={(e) => handleCourseNameChange(e.target.value)}
                      placeholder="e.g. Introduction to Psychology"
                    />
                    {modalMode === 'add' && courseForm.code && (
                      <span style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '4px', display: 'block' }}>
                        Auto-generated Code: <strong>{courseForm.code}</strong>
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select 
                      required 
                      value={courseForm.departmentId}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        setCourseForm({...courseForm, departmentId: deptId, fieldId: ''});
                        fetchModalFields(deptId);
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Field</label>
                    <select 
                      required 
                      value={courseForm.fieldId}
                      onChange={(e) => setCourseForm({...courseForm, fieldId: e.target.value})}
                      disabled={!courseForm.departmentId || loadingModalFields}
                    >
                      <option value="">{loadingModalFields ? 'Loading Fields...' : 'Select Field'}</option>
                      {modalFields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
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
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Topic Type</label>
                    <select 
                      value={topicForm.type} 
                      onChange={(e) => setTopicForm({...topicForm, type: e.target.value})}
                    >
                      <option value="chapter">Chapter</option>
                      <option value="topic">Topic</option>
                      <option value="subtopic">Subtopic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      required 
                      value={topicForm.name}
                      onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Parent Topic (Optional)</label>
                    <select 
                      value={topicForm.parentId}
                      onChange={(e) => setTopicForm({...topicForm, parentId: e.target.value || ''})}
                    >
                      <option value="">None (Top Level)</option>
                      {getParentOptions().map(t => (
                        <option key={t.id} value={t.id}>
                          {t.type.toUpperCase()}: {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea 
                      rows={3}
                      value={topicForm.description}
                      onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                    />
                  </div>
                </>
              )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-pill" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-pill">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
