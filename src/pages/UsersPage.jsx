import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Search, UserCheck, UserMinus, Shield, Phone, 
  Calendar, Edit, Trash2, UserPlus, X, Loader2, Eye, Send,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import './UsersPage.css';
import FCMUserModal from '../components/FCMUserModal';
import AutocompleteSelect from '../components/AutocompleteSelect';

const UsersPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  // Metadata
  const [fields, setFields] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'student',
    gender: 'Male',
    fieldId: ''
  });

  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState(null);

  const fetchUsers = async (page = 1, search = searchTerm) => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.USERS, { params: { page, limit, search } });
      setUsers(response.data.data);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.METADATA);
      setFields(response.data.fields || []);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  useEffect(() => {
    fetchUsers(1, '');
    fetchFields();
  }, []);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchUsers(newPage, searchTerm);
  };



  const resetForm = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      password: '',
      role: 'student',
      gender: 'Male',
      fieldId: ''
    });
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      password: '', // Don't show password
      role: user.role,
      gender: user.gender || 'Male',
      fieldId: user.fieldId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => { e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await API.put(ROUTES.ADMIN.UPDATE_USER(editingUser.id), formData);
      } else {
        await API.post(ROUTES.ADMIN.CREATE_USER, formData);
      }
      resetForm();
      fetchUsers(currentPage);
      addToast('success', editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(ROUTES.ADMIN.DELETE_USER(id));
        addToast('success', 'User deleted successfully');
        fetchUsers(currentPage);
      } catch (error) {
        addToast('error', 'Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await API.patch(ROUTES.ADMIN.TOGGLE_USER_STATUS(id));
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
      addToast('success', 'User status updated');
    } catch (error) {
      addToast('error', 'Failed to update status');
    }
  };

  return (
    <div className="page-container users-page">
      <header className="page-header">
        <div className="header-title">
          <h1>User Management</h1>
          <p>Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalItems)} of {totalItems} users</p>
        </div>
        <div className="header-right">
          {totalItems > 0 && (
            <div className="pagination-controls" style={{ marginRight: '16px' }}>
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
          )}
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </header>

      <div className="content-table-wrapper">
        <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Joined</th>
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
                  users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      {searchTerm ? `No users matching "${searchTerm}"` : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id}>
                      <td className="index-cell">{(currentPage - 1) * limit + index + 1}</td>
                      <td>
                        <span className="user-name-text">{user.fullName}</span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span><Phone size={14} /> {user.phoneNumber}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span><Calendar size={14} /> {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <button 
                          className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleStatus(user.id)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                           {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button 
                            className="action-btn view" 
                            onClick={() => navigate(`/dashboard/users/${user.id}`)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="action-btn fcm" 
                            onClick={() => {
                              setPushTarget(user);
                              setIsPushModalOpen(true);
                            }}
                            title="Send Push Notification"
                          >
                            <Send size={16} />
                          </button>
                          <button className="action-btn edit" onClick={() => handleEdit(user)}>
                            <Edit size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(user.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
              </tbody>
            </table>
        </div>


      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Gender</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        value="Male" 
                        checked={formData.gender === 'Male'}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      /> Male
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        value="Female" 
                        checked={formData.gender === 'Female'}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      /> Female
                    </label>
                  </div>
                </div>
                <div className="form-group full-width">
                  <AutocompleteSelect
                    label="Academic Field (Optional)"
                    value={formData.fieldId}
                    onChange={(val) => setFormData({...formData, fieldId: val})}
                    options={fields}
                    placeholder="Search and select academic field..."
                    displayKey="name"
                    valueKey="id"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingUser ? 'Save Changes' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <FCMUserModal 
        userId={pushTarget?.id}
        userName={pushTarget?.fullName}
        isOpen={isPushModalOpen}
        onClose={() => {
          setIsPushModalOpen(false);
          setPushTarget(null);
        }}
      />
    </div>
  );
};

export default UsersPage;
