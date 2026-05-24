import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SubmittedDocuments from "./pages/SubmittedDocuments";
import MyAssignments from "./pages/MyAssignments";
import DocumentDetails from "./pages/DocumentDetails";
import AppLayout from "../src/layout/AppLayout";
import ManageStaff from "./pages/ManageStaff";
import ManageStudents from "./pages/ManageStudents";
import DocumentTypes from "./pages/DocumentTypes";
import ManageSemesters from "./pages/ManageSemesters";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import ActivityLogs from './pages/ActivityLogs';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster position="top-right" />
        <Routes>
          {/* Login WITHOUT layout */}
          <Route path="/" element={<LoginPage />} />

          <Route path="/auth/success" element={<LoginPage />} />

          {/* Protected Pages WITH Header + Sidebar */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* All users */}
            <Route path="/submitted-documents" element={<SubmittedDocuments />} />
            <Route path="/documents/:trackingNumber" element={<DocumentDetails />} />
            
            {/* Staff and Admin only */}
            <Route path="/my-assignments" element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <MyAssignments />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* Admin only */}
            <Route path="/manage-staff" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStaff />
              </ProtectedRoute>
            } />
            <Route path="/manage-students" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStudents />
              </ProtectedRoute>
            } />
            <Route path="/manage-semesters" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageSemesters />
              </ProtectedRoute>
            } />
            <Route path="/document-types" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DocumentTypes />
              </ProtectedRoute>
            } />
            <Route path="/activity-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ActivityLogs />
              </ProtectedRoute>
            } />
          </Route>
          

          {/* Catch all - redirect to submitted documents */}
          <Route path="*" element={<Navigate to="/submitted-documents" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
