import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  ScrollText, 
  ChevronRight 
} from 'lucide-react';
import './DetailPage.css';

const UniversityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [university, setUniversity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch university details with stats and fields
      const response = await API.get(`${ROUTES.ADMIN.UNIVERSITIES}/${id}`);
      setUniversity(response.data);
    } catch (error) {
      addToast('error', 'Failed to fetch university details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = (fieldId) => {
    navigate(`/dashboard/fields/${fieldId}`);
  };

  if (loading) {
    return <div className="loading-state">Loading university details...</div>;
  }

  if (!university) {
    return <div className="error-state">University not found</div>;
  }

  return (
    <div className="detail-page">
      <div className="detail-nav-bar">
        <button className="back-btn" onClick={() => navigate('/dashboard/universities')}>
          <ArrowLeft size={20} />
          <span>Back to Universities</span>
        </button>
      </div>
      
      <div className="detail-header">
        <div className="detail-title-section">
          <div className="detail-icon">
            <Building2 size={32} />
          </div>
          <div>
            <h1>{university.name}</h1>
            <p className="detail-subtitle">{university.type} • {university.location || 'Location not set'}</p>
          </div>
        </div>
      </div>

      <div className="detail-content">
        {/* Stats Grid */}
        <div className="detail-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{university.stats?.fields || 0}</span>
                <span className="stat-label">Total Fields</span>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{university.stats?.exams || 0}</span>
                <span className="stat-label">Total Exams</span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <ScrollText size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{university.stats?.notes || 0}</span>
                <span className="stat-label">Short Notes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Fields at this University</h2>
            <span className="count-badge">{university.fields?.length || 0} fields</span>
          </div>

          {(!university.fields || university.fields.length === 0) ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>No fields associated with this university</p>
            </div>
          ) : (
            <div className="items-grid">
              {university.fields.map(field => (
                <div 
                  key={field.id} 
                  className="item-card clickable"
                  onClick={() => handleFieldClick(field.id)}
                >
                  <div className="item-card-header">
                    <h3>{field.name}</h3>
                    <ChevronRight size={20} className="nav-arrow" />
                  </div>
                  {field.code && (
                    <span className="item-code">{field.code}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityDetailPage;
