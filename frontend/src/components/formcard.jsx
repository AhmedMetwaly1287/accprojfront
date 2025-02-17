import React from 'react';

const FormCard = ({ title, description, onClick }) => (
  <div
    className="p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    onClick={onClick}
  >
    <h3 className="font-medium">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default FormCard;