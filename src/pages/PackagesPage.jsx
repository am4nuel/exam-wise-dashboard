import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { Box, Plus, Edit2, Trash2, X, Users, Search, FileText, File, ChevronLeft, ChevronRight, Play, Loader2 } from 'lucide-react';
import './PackagesPage.css';

const PackagesPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [topTab, setTopTab] = useState('packages'); // 'packages' | 'types'
  const [packageTypes, setPackageTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ name: '', code: '', description: '', isActive: true });
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'items'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    isActive: true,
    isByPackagePrice: false,
    departmentId: '',
    courseId: '',
    packageTypeId: '',
    items: [] // { type: 'exam'|'file', id: number, title: string, price: number }
  });

  // Metadata State
  const [metadata, setMetadata] = useState({ 
    departments: [], 
    fields: [],
    courses: [],
    topics: [],
    packageTypes: []
  });

  // Hierarchy Filter State
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Content Selection State
  const [availableContent, setAvailableContent] = useState({ exams: [], files: [], notes: [], videos: [] });
  const [contentPagination, setContentPagination] = useState({
    exams: { page: 1, hasMore: true, loading: false },
    files: { page: 1, hasMore: true, loading: false },
    notes: { page: 1, hasMore: true, loading: false },
    videos: { page: 1, hasMore: true, loading: false }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [contentFilter, setContentFilter] = useState('all'); // 'all' | 'exam' | 'file' | 'note' | 'video'
  const [bulkPrice, setBulkPrice] = useState('');

  // Pagination for packages list
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const contentLimit = 5;

  useEffect(() => {
    if (topTab === 'packages') {
      fetchPackages();
    } else {
      fetchPackageTypes();
    }
    fetchMetadata();
  }, [currentPage, topTab]);

  // Reset content when filters change
  useEffect(() => {
    if (showModal && activeTab === 'items') {
      resetAndFetchContent();
    }
  }, [selectedDept, selectedField, selectedCourse, selectedTopic, searchTerm, showModal, activeTab]);
  
  const resetAndFetchContent = () => {
    setAvailableContent({ exams: [], files: [], notes: [], videos: [] });
    setContentPagination({
      exams: { page: 1, hasMore: true, loading: false },
      files: { page: 1, hasMore: true, loading: false },
      notes: { page: 1, hasMore: true, loading: false },
      videos: { page: 1, hasMore: true, loading: false }
    });
    
    // Initial fetch for all categories or current filter
    if (contentFilter === 'all') {
      fetchCategoryContent('exams', 1);
      fetchCategoryContent('files', 1);
      fetchCategoryContent('notes', 1);
      fetchCategoryContent('videos', 1);
    } else {
      const categoryMap = { exam: 'exams', file: 'files', note: 'notes', video: 'videos' };
      fetchCategoryContent(categoryMap[contentFilter], 1);
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.METADATA);
      setMetadata(response.data);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.PACKAGES, {
        params: { page: currentPage, limit }
      });
      setPackages(response.data.data);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageTypes = async () => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.PACKAGE_TYPES);
      setPackageTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch package types:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryContent = async (category, page, isLoadMore = false) => {
    if (contentPagination[category].loading || (!isLoadMore && page !== 1)) return;

    setContentPagination(prev => ({
      ...prev,
      [category]: { ...prev[category], loading: true }
    }));

    try {
      let endpoint = '';
      if (category === 'exams') endpoint = ROUTES.ADMIN.EXAMS;
      else if (category === 'files') endpoint = ROUTES.ADMIN.FILES;
      else if (category === 'notes') endpoint = ROUTES.ADMIN.SHORT_NOTES;
      else if (category === 'videos') endpoint = ROUTES.ADMIN.VIDEOS;

      const response = await API.get(endpoint, {
        params: {
          page,
          limit: contentLimit,
          search: searchTerm,
          departmentId: selectedDept,
          fieldId: selectedField,
          courseId: selectedCourse,
          topicId: selectedTopic
        }
      });

      const newData = response.data.data || response.data || [];
      const hasMore = page < (response.data.pages || 1);

      setAvailableContent(prev => ({
        ...prev,
        [category]: isLoadMore ? [...prev[category], ...newData] : newData
      }));

      setContentPagination(prev => ({
        ...prev,
        [category]: {
          page,
          hasMore,
          loading: false
        }
      }));
    } catch (error) {
      console.error(`Failed to fetch ${category}:`, error);
      setContentPagination(prev => ({
        ...prev,
        [category]: { ...prev[category], loading: false }
      }));
    }
  };

  const handleLoadMore = (category) => {
    const nextPage = contentPagination[category].page + 1;
    fetchCategoryContent(category, nextPage, true);
  };

  const openAddModal = () => {
    setEditingPackage(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: 0, 
      duration: 30, 
      isActive: true,
      isByPackagePrice: false,
      departmentId: '', 
      courseId: '',
      items: [] 
    });
    setActiveTab('details');
    setShowModal(true);
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    
    // Map existing items to unified format
    const existingItems = [
      ...(pkg.exams || []).map(e => ({ type: 'exam', id: e.id, title: e.title, price: e.price })),
      ...(pkg.files || []).map(f => ({ type: 'file', id: f.id, title: f.fileName, price: f.price })),
      ...(pkg.notes || []).map(n => ({ type: 'note', id: n.id, title: n.title, price: n.price })),
      ...(pkg.videos || []).map(v => ({ type: 'video', id: v.id, title: v.title, price: v.price }))
    ];

    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      isActive: pkg.isActive,
      isByPackagePrice: pkg.isByPackagePrice || false, // Added isByPackagePrice
      departmentId: pkg.departmentId || '',
      courseId: pkg.courseId || '',
      packageTypeId: pkg.packageTypeId || '',
      items: existingItems
    });
    setActiveTab('details');
    setShowModal(true);
  };

  const openAddTypeModal = () => {
    setEditingType(null);
    setTypeFormData({ name: '', code: '', description: '', isActive: true });
    setShowTypeModal(true);
  };

  const openEditTypeModal = (type) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      code: type.code,
      description: type.description,
      isActive: type.isActive
    });
    setShowTypeModal(true);
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingType) {
        await API.put(ROUTES.ADMIN.UPDATE_PACKAGE_TYPE(editingType.id), typeFormData);
        addToast('success', 'Package type updated successfully');
      } else {
        await API.post(ROUTES.ADMIN.PACKAGE_TYPES, typeFormData);
        addToast('success', 'Package type created successfully');
      }
      setShowTypeModal(false);
      fetchPackageTypes();
      fetchMetadata(); // Refresh metadata for dropdowns
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to save package type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package type?')) return;
    try {
      await API.delete(ROUTES.ADMIN.DELETE_PACKAGE_TYPE(id));
      addToast('success', 'Package type deleted successfully');
      fetchPackageTypes();
      fetchMetadata();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to delete package type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      console.log('Submitting package data:', formData);
      if (editingPackage) {
        await API.put(ROUTES.ADMIN.UPDATE_PACKAGE(editingPackage.id), formData);
        addToast('success', 'Package updated successfully');
      } else {
        await API.post(ROUTES.ADMIN.CREATE_PACKAGE, formData);
        addToast('success', 'Package created successfully');
      }
      setShowModal(false);
      fetchPackages();
    } catch (error) {
      console.error('Save error detailed:', error.response?.data || error.message);
      addToast('error', error.response?.data?.message || 'Failed to save package');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    
    try {
      await API.delete(ROUTES.ADMIN.DELETE_PACKAGE(id));
      addToast('success', 'Package deleted successfully');
      fetchPackages();
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to delete package');
    }
  };

  const handleAddItem = (type, item) => {
    if (formData.items.some(i => i.type === type && i.id === item.id)) return;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        type, 
        id: item.id, 
        title: item.title || item.fileName,
        price: item.price || 0 // Added item price
      }]
    }));
  };

  const handleRemoveItem = (type, id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => !(i.type === type && i.id === id))
    }));
  };

  const handleItemPriceChange = (type, id, newPrice) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => 
        (i.type === type && i.id === id) 
          ? { ...i, price: parseFloat(newPrice) || 0 }
          : i
      )
    }));
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    const price = parseFloat(bulkPrice) || 0;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => ({ ...i, price }))
    }));
    addToast('success', `Applied price ${price} ETB to all items`);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };



  return (
    <div className="page-container packages-page">
      <div className="page-header">
        <div className="header-title">
          <h1>Package Management</h1>
          <div className="top-tab-switcher">
            <button 
              className={`top-tab-btn ${topTab === 'packages' ? 'active' : ''}`}
              onClick={() => setTopTab('packages')}
            >
              Packages
            </button>
            <button 
              className={`top-tab-btn ${topTab === 'types' ? 'active' : ''}`}
              onClick={() => setTopTab('types')}
            >
              Package Types
            </button>
          </div>
        </div>
        {topTab === 'packages' ? (
          <button className="add-btn" onClick={openAddModal}>
            <Plus size={20} />
            <span>Add New Package</span>
          </button>
        ) : (
          <button className="add-btn" onClick={openAddTypeModal}>
            <Plus size={20} />
            <span>Add Package Type</span>
          </button>
        )}
      </div>

      {topTab === 'packages' && (
        <>
        <div className="content-table-wrapper">
          <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Price (ETB)</th>
                  <th>Content</th>
                  <th>Subscribers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="loading-row">
                      <td colSpan="6">
                        <div className="skeleton-bar"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td>
                      <div 
                        className="package-name-cell clickable-cell" 
                        onClick={() => navigate(`/dashboard/packages/${pkg.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Box size={16} className="item-icon" />
                        <div>
                          <span className="pkg-name text-primary">{pkg.name}</span>
                          <span className="pkg-desc">{pkg.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>{pkg.price} ETB</td>
                    <td>
                      <span className="content-count">
                        {(pkg.exams?.length || 0) + (pkg.files?.length || 0)} items
                      </span>
                    </td>
                    <td>
                      <span className="subscriber-badge">
                        <Users size={14} />
                        {pkg.subscriberCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${pkg.isActive ? 'active' : 'inactive'}`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" onClick={() => openEditModal(pkg)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(pkg.id)}>
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
        <div className="pagination-footer">
          <div className="pagination-info">
            Showing <span>{(currentPage - 1) * limit + 1}</span> to <span>{Math.min(currentPage * limit, totalItems)}</span> of <span>{totalItems}</span> results
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i + 1}
                  className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        </>
      )}

      {topTab === 'types' && (
        <div className="content-table-wrapper">
          <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Type Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr className="loading-row"><td colSpan="4"><div className="skeleton-bar"></div></td></tr>
                ) : (
                  packageTypes.map(type => (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td><code>{type.code}</code></td>
                      <td>
                        <span className={`status-badge ${type.isActive ? 'active' : 'inactive'}`}>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" onClick={() => openEditTypeModal(type)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleTypeDelete(type.id)}>
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
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>{editingPackage ? 'Edit' : 'Add New'} Package</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-tabs">
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Package Details
              </button>
              <button 
                className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                Package Content ({formData.items.length})
              </button>
            </div>

            <form onSubmit={handleSubmit} className="content-form">
              <div className="form-main-scroll">
                
                {activeTab === 'details' ? (
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Package Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                      </div>

                      <div className="form-group">
                        <label>Department (Optional)</label>
                        <select 
                          value={formData.departmentId}
                          onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        >
                          <option value="">General / None</option>
                          {(metadata.departments || []).map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Package Type</label>
                        <select 
                          value={formData.packageTypeId}
                          onChange={(e) => setFormData({...formData, packageTypeId: e.target.value})}
                        >
                          <option value="">None</option>
                          {(metadata.packageTypes || []).map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Course (Optional)</label>
                        <select 
                          value={formData.courseId}
                          onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                        >
                          <option value="">General / None</option>
                          {(metadata.courses || []).map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                          ))}
                        </select>
                      </div>


                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="form-group full-width">
                      <div className="toggle-group">
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={formData.isActive}
                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                          />
                          <span>Active Package</span>
                        </label>
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={formData.isByPackagePrice}
                            onChange={(e) => setFormData({...formData, isByPackagePrice: e.target.checked})}
                          />
                          <span>Set Explicit Package Price</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Price (ETB) {!formData.isByPackagePrice && '(Calculated)'}</label>
                      <input 
                        type="number" 
                        required
                        disabled={!formData.isByPackagePrice}
                        value={formData.isByPackagePrice ? formData.price : formData.items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0)}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Duration (Days)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="items-selection-container">
                    {/* Hierarchical Filters */}
                    <div className="hierarchical-filters">
                      <div className="filter-select-group">
                        <label>Dept</label>
                        <select 
                          value={selectedDept} 
                          onChange={(e) => {
                            setSelectedDept(e.target.value);
                            setSelectedField('');
                            setSelectedCourse('');
                            setSelectedTopic('');
                          }}
                        >
                          <option value="">All</option>
                          {metadata.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>

                      <div className="filter-select-group">
                        <label>Field</label>
                        <select 
                          value={selectedField}
                          onChange={(e) => {
                            setSelectedField(e.target.value);
                            setSelectedCourse('');
                            setSelectedTopic('');
                          }}
                        >
                          <option value="">All</option>
                          {metadata.fields
                            .filter(f => !selectedDept || f.departmentId === parseInt(selectedDept))
                            .map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>

                      <div className="filter-select-group">
                        <label>Course</label>
                        <select 
                          value={selectedCourse}
                          onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedTopic('');
                          }}
                        >
                          <option value="">All</option>
                          {metadata.courses
                            .filter(c => !selectedField || c.fieldId === parseInt(selectedField))
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div className="filter-select-group">
                        <label>Topic</label>
                        <select 
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                          <option value="">All</option>
                          {metadata.topics
                            .filter(t => !selectedCourse || t.courseId === parseInt(selectedCourse))
                            .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="items-filters">
                      <div className="filter-tabs">
                        <button 
                          type="button"
                          className={`filter-pill ${contentFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setContentFilter('all')}
                        >
                          All
                        </button>
                        <button 
                          type="button"
                          className={`filter-pill ${contentFilter === 'exam' ? 'active' : ''}`}
                          onClick={() => setContentFilter('exam')}
                        >
                          Exams
                        </button>
                        <button 
                          type="button"
                          className={`filter-pill ${contentFilter === 'file' ? 'active' : ''}`}
                          onClick={() => setContentFilter('file')}
                        >
                          Files
                        </button>
                        <button 
                          type="button"
                          className={`filter-pill ${contentFilter === 'note' ? 'active' : ''}`}
                          onClick={() => setContentFilter('note')}
                        >
                          Notes
                        </button>
                        <button 
                          type="button"
                          className={`filter-pill ${contentFilter === 'video' ? 'active' : ''}`}
                          onClick={() => setContentFilter('video')}
                        >
                          Videos
                        </button>
                      </div>
                      <div className="items-search">
                        <Search size={18} />
                        <input 
                          type="text" 
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="items-columns">
                      {/* Available Items */}
                      <div className="items-list-column">
                        <h4>Available Content</h4>
                        <div className="items-list">
                          {/* Exams */}
                          {(contentFilter === 'all' || contentFilter === 'exam') && (
                            <>
                              <div className="list-section-header">Exams</div>
                              {availableContent.exams.length === 0 && !contentPagination.exams.loading && (
                                <div className="no-items-small">No exams found</div>
                              )}
                              {availableContent.exams.map(exam => {
                                const isSelected = formData.items.some(i => i.type === 'exam' && i.id === exam.id);
                                return (
                                  <div key={`exam-${exam.id}`} className={`item-row ${isSelected ? 'disabled' : ''}`}>
                                    <div className="item-info">
                                      <FileText size={16} className="item-icon-small exam" />
                                      <span>{exam.title}</span>
                                    </div>
                                    {!isSelected && (
                                      <button 
                                        type="button" 
                                        className="add-item-btn"
                                        onClick={() => handleAddItem('exam', exam)}
                                      >
                                        <Plus size={16} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              {contentPagination.exams.hasMore && (
                                <button 
                                  type="button" 
                                  className="load-more-btn"
                                  onClick={() => handleLoadMore('exams')}
                                  disabled={contentPagination.exams.loading}
                                >
                                  {contentPagination.exams.loading ? 'Loading...' : 'Load More Exams'}
                                </button>
                              )}
                            </>
                          )}

                          {/* Files */}
                          {(contentFilter === 'all' || contentFilter === 'file') && (
                            <>
                              <div className="list-section-header">Files</div>
                              {availableContent.files.length === 0 && !contentPagination.files.loading && (
                                <div className="no-items-small">No files found</div>
                              )}
                              {availableContent.files.map(file => {
                                 const isSelected = formData.items.some(i => i.type === 'file' && i.id === file.id);
                                 return (
                                   <div key={`file-${file.id}`} className={`item-row ${isSelected ? 'disabled' : ''}`}>
                                     <div className="item-info">
                                       <File size={16} className="item-icon-small file" />
                                       <span>{file.fileName}</span>
                                     </div>
                                     {!isSelected && (
                                       <button 
                                         type="button" 
                                         className="add-item-btn"
                                         onClick={() => handleAddItem('file', file)}
                                       >
                                         <Plus size={16} />
                                       </button>
                                     )}
                                   </div>
                                 );
                              })}
                              {contentPagination.files.hasMore && (
                                <button 
                                  type="button" 
                                  className="load-more-btn"
                                  onClick={() => handleLoadMore('files')}
                                  disabled={contentPagination.files.loading}
                                >
                                  {contentPagination.files.loading ? 'Loading...' : 'Load More Files'}
                                </button>
                              )}
                            </>
                          )}
                          
                          {/* Notes */}
                          {(contentFilter === 'all' || contentFilter === 'note') && (
                            <>
                              <div className="list-section-header">Short Notes</div>
                              {availableContent.notes.length === 0 && !contentPagination.notes.loading && (
                                <div className="no-items-small">No notes found</div>
                              )}
                              {availableContent.notes.map(note => {
                                 const isSelected = formData.items.some(i => i.type === 'note' && i.id === note.id);
                                 return (
                                   <div key={`note-${note.id}`} className={`item-row ${isSelected ? 'disabled' : ''}`}>
                                     <div className="item-info">
                                       <FileText size={16} className="item-icon-small note" style={{ color: '#8b5cf6' }} />
                                       <span>{note.title}</span>
                                     </div>
                                     {!isSelected && (
                                       <button 
                                         type="button" 
                                         className="add-item-btn"
                                         onClick={() => handleAddItem('note', note)}
                                       >
                                         <Plus size={16} />
                                       </button>
                                     )}
                                   </div>
                                 );
                              })}
                              {contentPagination.notes.hasMore && (
                                <button 
                                  type="button" 
                                  className="load-more-btn"
                                  onClick={() => handleLoadMore('notes')}
                                  disabled={contentPagination.notes.loading}
                                >
                                  {contentPagination.notes.loading ? 'Loading...' : 'Load More Notes'}
                                </button>
                              )}
                            </>
                          )}

                          {/* Videos */}
                          {(contentFilter === 'all' || contentFilter === 'video') && (
                            <>
                              <div className="list-section-header">Videos</div>
                              {availableContent.videos.length === 0 && !contentPagination.videos.loading && (
                                <div className="no-items-small">No videos found</div>
                              )}
                              {availableContent.videos.map(video => {
                                 const isSelected = formData.items.some(i => i.type === 'video' && i.id === video.id);
                                 return (
                                   <div key={`video-${video.id}`} className={`item-row ${isSelected ? 'disabled' : ''}`}>
                                     <div className="item-info">
                                       <Play size={16} className="item-icon-small video" style={{ color: '#ef4444' }} />
                                       <span>{video.title}</span>
                                     </div>
                                     {!isSelected && (
                                       <button 
                                         type="button" 
                                         className="add-item-btn"
                                         onClick={() => handleAddItem('video', video)}
                                       >
                                         <Plus size={16} />
                                       </button>
                                     )}
                                   </div>
                                 );
                              })}
                              {contentPagination.videos.hasMore && (
                                <button 
                                  type="button" 
                                  className="load-more-btn"
                                  onClick={() => handleLoadMore('videos')}
                                  disabled={contentPagination.videos.loading}
                                >
                                  {contentPagination.videos.loading ? 'Loading...' : 'Load More Videos'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Selected Items */}
                      <div className="items-list-column">
                        <div className="selected-header">
                          <h4>Selected Content ({formData.items.length})</h4>
                          <div className="bulk-controls">
                            <input 
                              type="number" 
                              placeholder="Price" 
                              value={bulkPrice}
                              onChange={(e) => setBulkPrice(e.target.value)}
                              className="bulk-price-input"
                            />
                            <button 
                              type="button" 
                              onClick={applyBulkPrice}
                              className="bulk-apply-btn"
                            >
                              Set All
                            </button>
                          </div>
                        </div>
                        <div className="items-list selected">
                          {formData.items.length === 0 && (
                            <div className="no-items">No items selected</div>
                          )}
                          {formData.items.map((item, idx) => (
                            <div key={`selected-${idx}`} className="item-row">
                              <div className="item-info">
                                {item.type === 'exam' && <FileText size={16} className="item-icon-small exam" />}
                                {item.type === 'file' && <File size={16} className="item-icon-small file" />}
                                {item.type === 'note' && <FileText size={16} className="item-icon-small note" style={{ color: '#8b5cf6' }} />}
                                {item.type === 'video' && <Play size={16} className="item-icon-small video" style={{ color: '#ef4444' }} />}
                                <div className="item-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span>{item.title}</span>
                                  <input 
                                    type="number"
                                    value={item.price}
                                    placeholder="Price"
                                    onChange={(e) => handleItemPriceChange(item.type, item.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="item-price-input"
                                  />
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="remove-item-btn"
                                onClick={() => handleRemoveItem(item.type, item.id)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-pill" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="save-pill" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingPackage ? 'Update Package' : 'Save Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingType ? 'Edit' : 'Add'} Package Type</h2>
              <button className="close-btn" onClick={() => setShowTypeModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleTypeSubmit} className="content-form">
              <div className="form-group">
                <label>Type Name</label>
                <input 
                  type="text" 
                  required 
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({...typeFormData, name: e.target.value})}
                  placeholder="e.g. Premium Access"
                />
              </div>
              <div className="form-group">
                <label>Type Code</label>
                <input 
                  type="text" 
                  required 
                  value={typeFormData.code}
                  onChange={(e) => setTypeFormData({...typeFormData, code: e.target.value})}
                  placeholder="e.g. PREMIUM"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({...typeFormData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={typeFormData.isActive}
                    onChange={(e) => setTypeFormData({...typeFormData, isActive: e.target.checked})}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-pill" onClick={() => setShowTypeModal(false)} disabled={isSaving}>Cancel</button>
                <button type="submit" className="save-pill" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingType ? 'Update Type' : 'Save Type')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
