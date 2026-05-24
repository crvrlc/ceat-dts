import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import "../css/Sidebar.css";

export default function Sidebar({ collapsed, onClose }) {
  const { isAdmin, isStaff } = useAuth();
  const isStudent = !isAdmin && !isStaff;

  if (isStudent) return null;

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  return (
    <>
      {!collapsed && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <nav>
          <ul>
            <li>
              <NavLink to="/submitted-documents" onClick={handleNavClick}>
                <i className="bi bi-file-earmark-text"></i> All Documents
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-assignments" onClick={handleNavClick}>
                <i className="bi bi-clipboard-check"></i> My Assignments
              </NavLink>
            </li>

            {isAdmin && (
              <>
                <li>
                  <NavLink to="/manage-students" onClick={handleNavClick}>
                    <i className="bi bi-people"></i> Manage Students
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manage-staff" onClick={handleNavClick}>
                    <i className="bi bi-person-badge"></i> Manage Staff
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manage-semesters" onClick={handleNavClick}>
                    <i className="bi bi-calendar3"></i> Manage Semesters
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/document-types" onClick={handleNavClick}>
                    <i className="bi bi-files"></i> Document Types
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <NavLink to="/reports" onClick={handleNavClick}>
                <i className="bi bi-bar-chart-line"></i> Reports
              </NavLink>
            </li>

            {isAdmin && (
              <li>
                <NavLink to="/activity-logs" onClick={handleNavClick}>
                  <i className="bi bi-clock-history"></i> Activity Logs
                </NavLink>
              </li>
            )}

          </ul>
        </nav>
      </aside>
    </>
  );
}