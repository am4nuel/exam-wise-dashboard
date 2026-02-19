import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CreditCard, Box, Tag, Calendar } from 'lucide-react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import './DetailPage.css'; // Shared CSS for detail pages

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await API.get(ROUTES.ADMIN.PACKAGE_DETAILS(id));
        setPackageData(response.data);
      } catch (error) {
        console.error('Failed to fetch package details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!packageData) return <div className="error-state">Package not found</div>;

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-info">
          <h1>{packageData.name}</h1>
          <span className={`status-badge ${packageData.status || 'active'}`}>
            {packageData.status || 'Active'}
          </span>
        </div>
      </header>

      <div className="detail-grid">
        {/* Info Card */}
        <div className="info-card">
          <h3>Package Info</h3>
          <div className="info-row">
            <span className="label"><CreditCard size={16} /> Price</span>
            <span className="value">{packageData.price} ETB</span>
          </div>
          <div className="info-row">
            <span className="label"><Tag size={16} /> Discount</span>
            <span className="value">{packageData.discount}%</span>
          </div>
          <div className="info-row">
            <span className="label"><Calendar size={16} /> Duration</span>
            <span className="value">{packageData.duration} Days</span>
          </div>
          <div className="info-description">
            <h4>Description</h4>
            <p>{packageData.description}</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="stats-card">
          <div className="stat-item">
            <Users size={24} className="stat-icon" />
            <div className="stat-text">
              <span className="stat-value">{packageData.subscriptions?.length || 0}</span>
              <span className="stat-label">Active Subscribers</span>
            </div>
          </div>
          <div className="stat-item">
            <CreditCard size={24} className="stat-icon" />
            <div className="stat-text">
              <span className="stat-value">
                {((packageData.subscriptions?.length || 0) * packageData.price).toLocaleString()} ETB
              </span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="detail-section">
        <h3>Enrolled Students</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Phone Number</th>
                <th>Enrolled Date</th>
                <th>Expires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {packageData.subscriptions?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">No active subscribers</td>
                </tr>
              ) : (
                packageData.subscriptions.map(sub => (
                  <tr key={sub.id} onClick={() => sub.user && navigate(`/dashboard/users/${sub.user.id}`)} className="clickable-row">
                    <td>{sub.user?.fullName || 'Unknown'}</td>
                    <td>{sub.user?.phoneNumber || '-'}</td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                    <td>
                      <button className="view-btn">View User</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
