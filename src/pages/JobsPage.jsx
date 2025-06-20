// src/pages/JobsPage.jsx
import React, { useState } from 'react';
import { useJobs } from '@/contexts/JobsContext';
import { useShips } from '@/contexts/ShipsContext';
import { useComponents } from '@/contexts/ComponentsContext';
import { useAuth } from '@/contexts/AuthContext';
import JobForm from '@/components/Jobs/JobForm';
import TimeAgo from '@/components/TimeAgo'; // Assuming you have this now

// Import the JobCalendar component
import JobCalendar from '@/components/Jobs/JobCalendar';

function JobsPage() {
  const { jobs, loading: loadingJobs, error: errorJobs, deleteJob } = useJobs();
  const { ships, loading: loadingShips, error: errorShips } = useShips();
  const { components, loading: loadingComponents, error: errorComponents } = useComponents();
  const { users: allUsers, loading: loadingUsers, hasRole, error: errorUsers } = useAuth();

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false); // NEW STATE for calendar toggle

  const [filterShipId, setFilterShipId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const filteredJobs = jobs.filter(job => {
    if (filterShipId && job.shipId !== filterShipId) {
      return false;
    }
    if (filterStatus && job.status !== filterStatus) {
      return false;
    }
    if (filterPriority && job.priority !== filterPriority) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleCreateJobClick = () => {
    setJobToEdit(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    setJobToEdit(job);
    setShowJobForm(true);
  };

  const handleDeleteJob = async (jobId, jobDescription, shipId, componentId) => {
    const shipName = getShipName(shipId);
    const componentName = getComponentName(componentId);

    if (window.confirm(`Are you sure you want to delete job "${jobDescription}" for ship "${shipName}" component "${componentName}"? This action cannot be undone.`)) {
      try {
        await deleteJob(jobId);
        alert(`Job "${jobDescription}" deleted successfully!`);
      } catch (err) {
        alert(`Failed to delete job "${jobDescription}". Error: ${err.message}`);
      }
    }
  };

  const handleCloseForm = () => {
    setShowJobForm(false);
    setJobToEdit(null);
  };

  const getShipName = (shipId) => {
    const ship = ships.find(s => s.id === shipId);
    return ship ? ship.name : 'Unknown Ship';
  };

  const getComponentName = (componentId) => {
    const component = components.find(c => c.id === componentId);
    return component ? `${component.name} (${component.serialNumber})` : 'N/A';
  };

  const getEngineerEmail = (engineerId) => {
    const engineer = allUsers.find(u => u.id === engineerId && u.role === 'Engineer');
    return engineer ? engineer.email : 'Unassigned';
  };

  if (loadingJobs || loadingShips || loadingComponents || loadingUsers) {
    return <div className="loading-fullscreen">Loading jobs...</div>;
  }
  if (errorJobs || errorShips || errorComponents || errorUsers) {
    return <div className="error-message">Error loading data: {errorJobs || errorShips || errorComponents || errorUsers}</div>;
  }

  return (
    <div className="jobs-page">
      <div className="main-content-header">
        <h1>Maintenance Jobs</h1>
        <div> {/* Group buttons for styling */}
          {hasRole(['Admin', 'Inspector']) && (
            <button onClick={handleCreateJobClick} style={{marginRight: '10px'}}>Create New Job</button>
          )}
          {/* Calendar Toggle Button */}
          <button onClick={() => setShowCalendar(!showCalendar)} className="btn-secondary">
            {showCalendar ? 'View Job List' : 'View Calendar'}
          </button>
        </div>
      </div>

      {/* Conditional Rendering for Job Form */}
      {showJobForm && (
        <JobForm jobToEdit={jobToEdit} onClose={handleCloseForm} />
      )}

      {/* Conditional Rendering for Job List or Calendar */}
      {!showJobForm && ( // Only show list or calendar if form is NOT open
        <>
          {showCalendar ? (
            <JobCalendar /> // RENDER THE CALENDAR
          ) : (
            // RENDER THE JOB LIST FILTERS AND TABLE
            <>
              <div className="card filters-section">
                <h2>Filters</h2>
                <div className="form-group">
                  <label htmlFor="filterShip">Filter by Ship:</label>
                  <select id="filterShip" value={filterShipId} onChange={(e) => setFilterShipId(e.target.value)}>
                    <option value="">All Ships</option>
                    {ships.map(ship => (
                      <option key={ship.id} value={ship.id}>{ship.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="filterStatus">Filter by Status:</label>
                  <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="filterPriority">Filter by Priority:</label>
                  <select id="filterPriority" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="card job-list-section">
                <h2>Job List</h2>
                {filteredJobs.length > 0 ? (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Job ID</th>
                          <th>Ship</th>
                          <th>Component</th>
                          <th>Type</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Scheduled Date</th>
                          <th>Last Update</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map(job => (
                          <tr key={job.id}>
                            <td>{job.id.substring(0, 6)}...</td>
                            <td>{getShipName(job.shipId)}</td>
                            <td>{getComponentName(job.componentId)}</td>
                            <td>{job.type}</td>
                            <td>{job.priority}</td>
                            <td>{job.status}</td>
                            <td>{getEngineerEmail(job.assignedEngineerId)}</td>
                            <td>{job.scheduledDate}</td>
                            <td><TimeAgo date={job.updatedAt || job.createdAt} /></td>
                            <td>
                              {hasRole(['Admin', 'Engineer']) && (
                                <>
                                  <button onClick={() => handleEditJob(job)} className="btn-secondary" style={{ marginRight: '10px' }}>Edit</button>
                                  <button onClick={() => handleDeleteJob(job.id, job.description, job.shipId, job.componentId)} className="btn-danger">Delete</button>
                                </>
                              )}
                              {!hasRole(['Admin', 'Engineer']) && (
                                <button className="btn-secondary">View</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No jobs found matching your criteria. {hasRole(['Admin', 'Inspector']) && 'Click "Create New Job" to add one.'}</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default JobsPage;