import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AutocompleteSelect from '../components/AutocompleteSelect';
import './UniversitiesPage.css';

const UniversitiesPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('universities'); // 'universities' | 'fields'
  
  // Data State
  const [universities, setUniversities] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'fields'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form Data
  const [uniForm, setUniForm] = useState({ name: '' });
  const [fieldForm, setFieldForm] = useState({ name: '', departmentId: '' });
  const [selectedFields, setSelectedFields] = useState([]);
  const [fieldSearch, setFieldSearch] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Metadata for Autocomplete
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    setSearchTerm(''); // Clear search when changing tabs
    setCurrentPage(1);
    fetchData(1, '');
  }, [activeTab]);

  const fetchData = async (pageValue = currentPage, search = searchTerm) => {
    setLoading(true);
    try {
      if (activeTab === 'universities') {
        const [uniRes, fieldRes] = await Promise.all([
          API.get(ROUTES.ADMIN.UNIVERSITIES, { params: { page: pageValue, limit, search } }),
          API.get(ROUTES.ADMIN.FIELDS) // All fields for associations in modal
        ]);
        setUniversities(uniRes.data.data);
        setTotalPages(uniRes.data.pages);
        setTotalItems(uniRes.data.total);
        setFields(fieldRes.data);
      } else {
        const response = await API.get(ROUTES.ADMIN.FIELDS, { params: { page: pageValue, limit, search } });
        setFields(response.data.data);
        setTotalPages(response.data.pages);
        setTotalItems(response.data.total);
      }
    } catch (error) {
      addToast('error', 'Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = React.useCallback(async (search = '') => {
    setLoadingDepartments(true);
    try {
      const response = await API.get(ROUTES.ADMIN.DEPARTMENTS, {
        params: { search, limit: 100 }
      });
      setDepartmentOptions(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartmentOptions([]);
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const handleDepartmentSearch = React.useCallback((term) => {
    fetchDepartments(term);
  }, [fetchDepartments]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Debounce search
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setCurrentPage(1);
      fetchData(1, term);
    }, 500));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchData(newPage);
  };

  // Helper to generate pagination window
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
      if (activeTab === 'universities') {
        if (modalMode === 'add') {
          await API.post(ROUTES.ADMIN.UNIVERSITIES, uniForm);
          addToast('success', 'University created');
        } else if (modalMode === 'edit') {
          await API.put(ROUTES.ADMIN.UPDATE_UNIVERSITY(editingItem.id), uniForm);
          addToast('success', 'University updated');
        } else if (modalMode === 'fields') {
          await API.post(ROUTES.ADMIN.ADD_UNIVERSITY_FIELDS(editingItem.id), { fieldIds: selectedFields });
          addToast('success', 'Fields updated');
        }
      } else {
        if (modalMode === 'add') {
          await API.post(ROUTES.ADMIN.FIELDS, fieldForm);
          addToast('success', 'Field created');
        } else {
          await API.put(ROUTES.ADMIN.UPDATE_FIELD(editingItem.id), fieldForm);
          addToast('success', 'Field updated');
        }
      }
      setShowModal(false);
      fetchData(currentPage);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    try {
      if (activeTab === 'universities') {
        await API.delete(ROUTES.ADMIN.DELETE_UNIVERSITY(id));
      } else {
        await API.delete(ROUTES.ADMIN.DELETE_FIELD(id));
      }
      addToast('success', 'Deleted successfully');
      fetchData(currentPage);
    } catch (error) {
      addToast('error', 'Delete failed');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setUniForm({ name: '' });
    setFieldForm({ name: '', departmentId: '' });
    fetchDepartments(); // Load initial departments
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    if (activeTab === 'universities') {
      setUniForm({ name: item.name });
    } else {
      setFieldForm({ name: item.name, departmentId: item.departmentId || '' });
      fetchDepartments(); // Load initial departments for editing
    }
    setShowModal(true);
  };

  const openManageFieldsModal = (uni) => {
    setModalMode('fields');
    setEditingItem(uni);
    const existingFieldIds = uni.fields?.map(f => f.id) || [];
    setSelectedFields(existingFieldIds);
    setFieldSearch('');
    setShowModal(true);
  };

  const toggleFieldSelection = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };


  return (
    <div className="page-container universities-page">
       <div className="page-header">
        <div className="header-title">
          <h1>University & Field Management</h1>
          <p>Manage universities and their associated fields of study</p>
        </div>
        <div className="header-actions">
           <button className="add-btn" onClick={openAddModal}>
            <Plus size={20} />
            <span>Add {activeTab === 'universities' ? 'University' : 'Field'}</span>
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'universities' ? 'active' : ''}`}
          onClick={() => setActiveTab('universities')}
        >
          Universities
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fields' ? 'active' : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          Fields
        </button>
      </div>

      {/* Toolbar: Search + Pagination */}
      <div className="table-toolbar">
        <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'universities' ? 'Universities' : 'Fields'}...`}
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-field"
          />
        </div>

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


      {/* Content */}
      <div className="content-table-wrapper">
        <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  {activeTab === 'fields' && <th style={{ width: '60px' }}>ID</th>}
                  <th>Name</th>
                  {activeTab === 'universities' ? (
                    <>
                      <th>Fields</th>
                      <th>Actions</th>
                    </>
                  ) : (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="loading-row">
                      <td colSpan={3}>
                        <div className="skeleton-bar"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    {(activeTab === 'universities' ? universities : fields).map(item => (
                  <tr 
                    key={item.id}
                    onClick={() => {
                      if (activeTab === 'universities') {
                        navigate(`/dashboard/universities/${item.id}`);
                      } else {
                        navigate(`/dashboard/fields/${item.id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {activeTab === 'fields' && (
                      <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '13px' }}>
                        #{item.id}
                      </td>
                    )}
                    <td>
                      <div className="name-cell">
                        {activeTab === 'universities' ? <Building2 size={16} /> : <BookOpen size={16} />}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    {activeTab === 'universities' && (
                      <td>
                        <span className="count-badge">
                          {item.fields?.length || 0} fields
                        </span>
                      </td>
                    )}
                    <td>
                      <div className="action-btns">
                        {activeTab === 'universities' && (
                           <button 
                             className="action-btn view" 
                             onClick={(e) => { e.stopPropagation(); openManageFieldsModal(item); }}
                             title="Manage Fields"
                           >
                             <BookOpen size={16} />
                           </button>
                        )}
                        <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEditModal(item); }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'universities' ? universities : fields).length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      No data found
                    </td>
                  </tr>
                )}
              </>
            )}
              </tbody>
            </table>
        </div>
        

      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {modalMode === 'add' ? 'Add New' : modalMode === 'edit' ? 'Edit' : 'Manage Fields for'}
                {' '}
                {modalMode === 'fields' ? editingItem?.name : (activeTab === 'universities' ? 'University' : 'Field')}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {modalMode === 'fields' ? (
                <div className="fields-grid-selection">
                  <div className="search-bar" style={{ marginBottom: '16px' }}>
                     <Search size={18} className="search-icon" />
                     <input 
                       type="text" 
                       placeholder="Search fields..." 
                       value={fieldSearch}
                       onChange={(e) => setFieldSearch(e.target.value)}
                       autoFocus
                     />
                  </div>
                  <p className="helper-text">Select fields available at this university:</p>
                  <div className="fields-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {fields.filter(f => f.name.toLowerCase().includes(fieldSearch.toLowerCase())).map(field => (
                      <div 
                        key={field.id} 
                        className={`field-chip ${selectedFields.includes(field.id) ? 'selected' : ''}`}
                        onClick={() => toggleFieldSelection(field.id)}
                      >
                        {selectedFields.includes(field.id) && <Check size={14} />}
                        {field.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      required 
                      value={activeTab === 'universities' ? uniForm.name : fieldForm.name}
                      onChange={(e) => activeTab === 'universities' ? setUniForm({...uniForm, name: e.target.value}) : setFieldForm({...fieldForm, name: e.target.value})}
                      placeholder={`Enter ${activeTab === 'universities' ? 'university' : 'field'} name`}
                    />
                  </div>

                  {activeTab === 'fields' && (
                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <AutocompleteSelect
                        label="Department (Optional)"
                        value={fieldForm.departmentId}
                        onChange={(val) => setFieldForm({...fieldForm, departmentId: val})}
                        options={departmentOptions}
                        placeholder="Type to search departments..."
                        loading={loadingDepartments}
                        onSearch={handleDepartmentSearch}
                        required={false}
                      />
                    </div>
                  )}
                </div>
              )}
              
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
}

export default UniversitiesPage;
