import React, { useState, useEffect } from "react";

export default function AthleteModal({ isOpen, onClose, onSubmit, title, athleteData, isEdit }) {
  const [formData, setFormData] = useState(
    athleteData || {
      name: "",
      gender: "Male",
      category: "",
      dob: "",
      team: "",
      bodyWeight: "",
      session: "",
      attempt1: "",
      rack: "",
      lotn: "",
    }
  );

  useEffect(() => {
    setFormData(
      athleteData || {
        name: "",
        gender: "Male",
        category: "",
        dob: "",
        team: "",
        bodyWeight: "",
        session: "",
        attempt1: "",
        rack: "",
        lotn: "",
      }
    );
  }, [isOpen, athleteData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.team || !formData.dob) {
      alert("Name, Team/Club, and Date of Birth are required.");
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  // Overlay is semi-transparent, modal content is solid white
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg max-h-[80vh] overflow-y-auto"
        style={{
          background: "#fff", // solid white!
          opacity: 1,         // fully opaque!
        }}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 gap-4">
          <input type="text" name="lotn" value={formData.lotn} onChange={handleChange} placeholder="Lot #" className="p-2 border border-gray-300 rounded-md" />
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="p-2 border border-gray-300 rounded-md" required />
          <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border border-gray-300 rounded-md">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <input type="text" name="category" value={formData.category} readOnly className="p-2 border border-gray-300 rounded-md bg-gray-100" />
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="p-2 border border-gray-300 rounded-md" required />
          <input type="text" name="team" value={formData.team} onChange={handleChange} placeholder="Team/Club" className="p-2 border border-gray-300 rounded-md" required />
          <input type="number" name="bodyWeight" value={formData.bodyWeight || ""} onChange={handleChange} placeholder="Body Weight" className="p-2 border border-gray-300 rounded-md" />
          <input type="text" name="session" value={formData.session} onChange={handleChange} placeholder="Session" className="p-2 border border-gray-300 rounded-md" />
          <input type="number" name="attempt1" value={formData.attempt1 || ""} onChange={handleChange} placeholder="1st Attempt" className="p-2 border border-gray-300 rounded-md" />
          <input type="text" name="rack" value={formData.rack || ""} onChange={handleChange} placeholder="Rack" className="p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEdit ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}