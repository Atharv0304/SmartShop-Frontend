import React from 'react';
import './NotificationBadge.css';

/**
 * A reusable red circular notification badge.
 *
 * Props:
 *  - count  {number}  — badge value; hides automatically when 0
 *  - max    {number}  — cap displayed value (default 9+)
 *  - pulse  {boolean} — adds animate-pulse when true (default false)
 */
const NotificationBadge = ({ count = 0, max = 9, pulse = false }) => {
  if (!count || count <= 0) return null;

  const display = count > max ? `${max}+` : count;

  return (
    <span
      className={`notif-badge ${pulse ? 'notif-badge--pulse' : ''}`}
      aria-label={`${count} notifications`}
    >
      {display}
    </span>
  );
};

export default NotificationBadge;
