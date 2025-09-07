import React from 'react';
import '../../CSS/submit.css'; // Import the CSS

interface SubmitButtonProps {
  label?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  label = 'Submit', 
  className = '', 
  onClick,
  disabled = false,
  loading = false
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`submit-button ${loading ? 'loading' : ''} ${className}`}
    >
      {!loading ? label : ''}
    </button>
  );
};

export default SubmitButton;