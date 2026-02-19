import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, Trash2, Edit2, Banknote, Save, X, RefreshCw, AlertCircle 
} from 'lucide-react';
import './BankManagement.css'; // We'll assume a CSS file or re-use SettingsPage.css

const BankManagement = () => {
  const { addToast } = useToast();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    isActive: true
  });

  const isFirebaseConfigured = () => {
    // Basic check to see if placeholders are still present
    try {
      const config = db.app.options;
      return config && config.apiKey && config.apiKey !== "YOUR_API_KEY" && !config.apiKey.includes("YOUR_");
    } catch (e) {
      return false;
    }
  };

  const banksCollection = collection(db, 'company_bank_accounts');

  const fetchBanks = async () => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Please add your keys in src/config/firebase.js');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Set a timeout for the fetch
      const fetchPromise = getDocs(banksCollection);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 10000)
      );
      
      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setBanks(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching banks: ", err);
      if (err.message === 'Firebase timeout') {
        setError('Connection timed out. Check your internet or Firebase config.');
      } else if (err.code === 'permission-denied') {
        setError('Permission denied. Check Firebase rules.');
      } else {
        setError('Failed to load bank accounts. Ensure Firebase is set up correctly.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      accountName: '',
      branch: '',
      isActive: true
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (bank) => {
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      branch: bank.branch || '',
      isActive: bank.isActive ?? true
    });
    setCurrentId(bank.id);
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      return addToast('error', 'Please fill all required fields');
    }

    setLoading(true);
    try {
      if (isEditing && currentId) {
        const bankDoc = doc(db, 'company_bank_accounts', currentId);
        await updateDoc(bankDoc, formData);
        addToast('success', 'Bank account updated successfully');
      } else {
        await addDoc(banksCollection, formData);
        addToast('success', 'Bank account added successfully');
      }
      resetForm();
      fetchBanks();
    } catch (err) {
      console.error("Error saving bank: ", err);
      addToast('error', 'Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;

    setLoading(true);
    try {
      const bankDoc = doc(db, 'company_bank_accounts', id);
      await deleteDoc(bankDoc);
      addToast('success', 'Bank account deleted');
      fetchBanks();
    } catch (err) {
      console.error("Error deleting bank: ", err);
      addToast('error', 'Failed to delete bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-management settings-section">
      <div className="section-header">
        <h3>Bank Account Management</h3>
        <p>Manage company bank accounts for receiving payments</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchBanks} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="bank-content-grid">
        {/* Form Section */}
        <div className="bank-form-card">
          <h4>{isEditing ? 'Edit Bank Account' : 'Add New Bank Account'}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bank Name *</label>
              <div className="input-with-icon">
                <Banknote size={16} />
                <input 
                  type="text" 
                  name="bankName"
                  placeholder="e.g. CBE, Awash Bank"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input 
                type="text" 
                name="accountNumber"
                placeholder="1000..."
                value={formData.accountNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Account Holder Name *</label>
              <input 
                type="text" 
                name="accountName"
                placeholder="Company Name"
                value={formData.accountName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Branch (Optional)</label>
              <input 
                type="text" 
                name="branch"
                placeholder="Main Branch"
                value={formData.branch}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              {isEditing && (
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  <X size={16} /> Cancel
                </button>
              )}
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                {isEditing ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bank-list-card">
          <h4>Existing Accounts</h4>
          {banks.length === 0 ? (
            <div className="empty-state">
              <p>No bank accounts found.</p>
            </div>
          ) : (
            <div className="banks-list">
              {banks.map(bank => (
                <div key={bank.id} className={`bank-item ${!bank.isActive ? 'inactive' : ''}`}>
                  <div className="bank-icon">
                    <Banknote size={24} />
                  </div>
                  <div className="bank-details">
                    <div className="bank-name">
                      {bank.bankName}
                      {!bank.isActive && <span className="inactive-badge">Inactive</span>}
                    </div>
                    <div className="bank-acc-num">{bank.accountNumber}</div>
                    <div className="bank-acc-name">{bank.accountName}</div>
                  </div>
                  <div className="bank-actions">
                    <button 
                      onClick={() => handleEdit(bank)} 
                      className="action-btn edit"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(bank.id)} 
                      className="action-btn delete"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankManagement;
