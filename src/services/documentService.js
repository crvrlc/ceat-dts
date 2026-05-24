import api from '../utils/api';

const documentService = {
  // Get all documents (filtered by role automatically in backend)
  getAll: async (params = {}) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  // Get single document
  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Submit new document (student)
  submit: async (formData) => {
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Track document by tracking code (public)
  track: async (trackingCode) => {
    const response = await api.get(`/documents/track/${trackingCode}`);
    return response.data;
  },

  // Assign document to staff (admin/staff)
  assign: async (id, staffId) => {
    const response = await api.patch(`/documents/${id}/assign`, {
      staffId: staffId || null
    });
    return response.data;
  },

  // Update document status (staff/admin) - supports file upload + reassignment
  updateStatus: async (id, { status, remarks, notifyStudent, reassignToStaffId, file } = {}) => {
    const formData = new FormData();
    formData.append('status', status);
    if (remarks) formData.append('remarks', remarks);
    if (notifyStudent !== undefined) formData.append('notifyStudent', notifyStudent);
    if (reassignToStaffId) formData.append('reassignToStaffId', reassignToStaffId);
    if (file) formData.append('file', file);

    const response = await api.patch(`/documents/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Mark in-person document as received (staff/admin)
  receive: async (id, remarks) => {
    const response = await api.patch(`/documents/${id}/receive`, { remarks });
    return response.data;
  },

  // Notify student via email about status update (staff/admin)
  notifyStudent: async (id, status, remark) => {
    const response = await api.post(`/documents/${id}/notify`, { status, remark });
    return response.data;
  },

  // Delete document
  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Get document stats
  getStats: async () => {
    const response = await api.get('/documents/stats');
    return response.data;
  },
};

export default documentService;