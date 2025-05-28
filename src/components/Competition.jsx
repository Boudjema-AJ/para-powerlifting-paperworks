import React, { useState } from "react";

function CompetitionModal({ isOpen, onClose, onSubmit, title, competitionData, isEdit }) {
  const [formData, setFormData] = useState(competitionData || {
    name: "", location: "", date: "", type: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.location || !formData.date || !formData.type) {
      alert("All fields are required.");
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 gap-4">
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Competition Name" className="p-2 border border-gray-300 rounded-md" />
          <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="p-2 border border-gray-300 rounded-md" />
          <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border border-gray-300 rounded-md" />
          <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="Competition Type" className="p-2 border border-gray-300 rounded-md" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEdit ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}

function Competition({ competitions, setCompetitions }) {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCompetition, setCurrentCompetition] = useState(null);

  const handleAddSubmit = (formData) => {
    const newCompetition = {
      id: competitions.length + 1,
      ...formData,
    };
    const updatedCompetitions = [...competitions, newCompetition];
    setCompetitions(updatedCompetitions);
    setSuccess("Competition added successfully.");
    setError(null);
  };

  const handleEditSubmit = (formData) => {
    const updatedCompetitions = competitions.map(c =>
      c.id === currentCompetition.id ? { ...c, ...formData } : c
    );
    setCompetitions(updatedCompetitions);
    setSuccess("Competition updated successfully.");
    setError(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this competition?")) {
      const updatedCompetitions = competitions.filter(c => c.id !== id);
      setCompetitions(updatedCompetitions);
      setSuccess("Competition deleted successfully.");
      setError(null);
    }
  };

  const openEditModal = (competition) => {
    setCurrentCompetition(competition);
    setIsEditModalOpen(true);
  };

  return (
    <div className="container">
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">{success}</div>}
      <h1 className="text-white font-bold mb-8 text-center text-white-800">Create New Competition</h1>
      <section className="mb-12">
        <div className="table-wrapper">
          <h2 className="text-2xl font-semibold mb-4">Competition Database</h2>
          <div className="flex justify-between mb-4">
            <span className="text-gray-700">{competitions.length} competition(s) displayed</span>
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add New Competition</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Competition Name</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map(comp => (
                  <tr key={comp.id}>
                    <td>{comp.name}</td>
                    <td>{comp.location}</td>
                    <td>{comp.date}</td>
                    <td>{comp.type}</td>
                    <td>
                      <button className="action-btn edit mr-2" onClick={() => openEditModal(comp)}>Edit</button>
                      <button className="action-btn delete" onClick={() => handleDelete(comp.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <CompetitionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddSubmit} title="Add New Competition" competitionData={null} isEdit={false} />
      <CompetitionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleEditSubmit} title="Edit Competition" competitionData={currentCompetition} isEdit={true} />
    </div>
  );
}

export default Competition;