import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function DocumentTypeModal({ show, onHide, onSave, documentType }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
  });

  useEffect(() => {
    if (documentType) {
      setFormData({
        name: documentType.name,
        code: documentType.code,
        isActive: documentType.isActive,
      });
    } else {
      setFormData({ name: '', code: '', isActive: true });
    }
  }, [documentType, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{documentType ? 'Edit Document Type' : 'Add Document Type'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>

          <Form.Group className="mb-3">
            <Form.Label>Code <span className="required">*</span></Form.Label>
            <Form.Control
              type="text" name="code" value={formData.code}
              onChange={handleChange} placeholder="e.g., COI"
              required maxLength={10}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Name <span className="required">*</span></Form.Label>
            <Form.Control
              type="text" name="name" value={formData.name}
              onChange={handleChange} placeholder="e.g., Consent of Instructor"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox" name="isActive"
              label="Active (students can submit this type)"
              checked={formData.isActive} onChange={handleChange}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit">
              {documentType ? 'Update' : 'Create'}
            </Button>
          </div>

        </Form>
      </Modal.Body>
    </Modal>
  );
}