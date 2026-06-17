import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { List, FileText, ChevronDown } from "react-bootstrap-icons";
import Dropdown from 'react-bootstrap/Dropdown';
import "../css/Header.css";
import ceat_logo from '../images/ceat-logo.png';

export default function Header({ userName, onToggleSidebar }) {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const isStudent = !isAdmin && !isStaff;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <header className="header">
      {/* Left: hamburger + logo + title */}
      <div className="header-left">
        {!isStudent && (
          <button
            className="header-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <List size={24} />
          </button>
        )}

        <img src={ceat_logo} alt="CEAT Logo" className="header-logo" />

        <h5 className="header-title">
          <span className="header-title-full">CEAT OCS Document Submission & Tracking System</span>
          <span className="header-title-short">CEAT OCS DSTS</span>
        </h5>
      </div>

      {/* Right: nav link + user chip */}
      <div className="header-right">
        {isStudent && (
          <NavLink to="/submitted-documents" className="header-nav-link">
            <FileText size={15} />
            <span className="header-nav-label">My Submitted Documents</span>
          </NavLink>
        )}
        <a 
         href="https://ceatocs.uplb.edu.ph/ceat-downloadable-forms/"
          target="_blank"
          rel="noreferrer"
          className="header-nav-link"
        >
          <i className="bi bi-info-circle" style={{ fontSize: '15px' }} />
          <span className="header-nav-label">CEAT Downloadable Forms</span>
        </a>

        <Dropdown align="end">
          <Dropdown.Toggle as="div" className="header-user-chip" bsPrefix="header-user-chip">
            <div className="header-avatar">
              {getInitials(user?.name)}
            </div>
            <span className="header-username">{user?.name || 'User'}</span>
            <ChevronDown size={14} className="header-chevron" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="header-dropdown-menu">
            <Dropdown.Item onClick={handleLogout}>
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}