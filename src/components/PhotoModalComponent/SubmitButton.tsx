import React from 'react';

interface SubmitButtonProps {
  label?: string;
  className?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ label = 'Submit', className = '' }) => {
  return (
    <button
      type="button"
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${className}`}
    >
      {label}
    </button>
  );
};

export default SubmitButton;
