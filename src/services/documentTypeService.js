import api from '../utils/api';

const documentTypeService = {
  // Get all document types
  getAll: async () => {
    const response = await api.get('/document-types');
    return response.data;
  },

  // Get single document type
  getById: async (id) => {
    const response = await api.get(`/document-types/${id}`);
    return response.data;
  },

  // Create document type
  create: async (data) => {
    const response = await api.post('/document-types', data);
    return response.data;
  },

  // Update document type
  update: async (id, data) => {
    const response = await api.put(`/document-types/${id}`, data);
    return response.data;
  },

  // Delete document type
  delete: async (id) => {
    const response = await api.delete(`/document-types/${id}`);
    return response.data;
  },

  // Assign staff to document type
  assignStaff: async (id, staffId) => {
    const response = await api.post(`/document-types/${id}/staff`, { staffId });
    return response.data;
  },
  // Remove staff from document type
  removeStaff: async (id, staffId) => {
    const response = await api.delete(`/document-types/${id}/staff/${staffId}`);
    return response.data;
  },
};


export default documentTypeService;