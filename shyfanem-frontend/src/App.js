import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [organizations, setOrganizations] = useState([{ name: '', domain: '', mspID: '' }]);
  const [yamlGenerated, setYamlGenerated] = useState(false);

  // Handle adding new organization
  const addOrganization = () => {
    setOrganizations([...organizations, { name: '', domain: '', mspID: '' }]);
  };

  // Handle input changes for each organization
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const newOrganizations = [...organizations];
    newOrganizations[index][name] = value;
    setOrganizations(newOrganizations);
  };

  // Handle form submission to add organizations and generate YAML files
  const handleGenerateFiles = async (event) => {
    event.preventDefault();
    try {
      // Add organizations and generate YAML files
      const response = await axios.post('http://localhost:1337/api/organizations/generate-files', {
        organizations,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      });

      // Handle YAML file download
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-files.zip'; // Download as a ZIP file with all YAML files
      document.body.appendChild(a);
      a.click();
      a.remove();

      setYamlGenerated(true);
    } catch (error) {
      console.error('Error generating files:', error.response || error);
      alert(`Failed to generate files: ${error.response?.data?.error?.message || error.message}`);
    
    }
  };

  return (
    <div className="App">
      <h1>Organization Entry and YAML Generation</h1>
      <form onSubmit={handleGenerateFiles}>
        {organizations.map((org, index) => (
          <div key={index}>
            <label>
              Organization Name:
              <input
                type="text"
                name="name"
                value={org.name}
                onChange={(event) => handleInputChange(index, event)}
                required
              />
            </label>
            <br />
            <label>
              Domain:
              <input
                type="text"
                name="domain"
                value={org.domain}
                onChange={(event) => handleInputChange(index, event)}
                required
              />
            </label>
            <br />
            <label>
              MSP ID:
              <input
                type="text"
                name="mspID"
                value={org.mspID}
                onChange={(event) => handleInputChange(index, event)}
                required
              />
            </label>
            <br />
            <br />
          </div>
        ))}
        <button type="button" onClick={addOrganization}>
          Add Another Organization
        </button>
        <br />
        <br />
        <button type="submit">Add Organizations and Generate YAML Files</button>
      </form>
    </div>
  );
}

export default App;
