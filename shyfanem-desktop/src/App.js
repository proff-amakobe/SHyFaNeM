import React, { useState, useEffect } from 'react';


function App() {
  const [folderName, setFolderName] = useState('');
  const [parentDir, setParentDir] = useState('');
  const [organizations, setOrganizations] = useState([
    { name: '', domain: '', mspID: '' }
  ]);
  const [result, setResult] = useState(null);
  const [hyperledgerVersion, setHyperledgerVersion] = useState('Checking...');

  useEffect(() => {
    // Fetch Hyperledger version when the component mounts
    async function fetchVersion() {
      const response = await window.electron.getHyperledgerVersion();
      if (response.success) {
        setHyperledgerVersion(response.version);
      } else {
        setHyperledgerVersion(`Error: ${response.message}`);
      }
    }

    fetchVersion();
  }, []);

  const handleSelectDirectory = async () => {
    const result = await window.electron.openDirectoryDialog();
    if (!result.canceled) {
      setParentDir(result.filePath);
    }
  };

  const handleCreateFolder = async () => {
    if (folderName && parentDir && organizations.length > 0) {
      try {
        const response = await window.electron.createFolder({ folderName, parentDir, organizations });
        setResult(response);
      } catch (error) {
        setResult({
          success: false,
          message: `Error: ${error.message}`,
          details: { errorStack: error.stack }
        });
      }
    } else {
      setResult({
        success: false,
        message: 'Please enter a folder name, select a parent directory, and add at least one organization.'
      });
    }
  };

  const handleOrganizationChange = (index, field, value) => {
    const updatedOrganizations = organizations.map((org, i) =>
      i === index ? { ...org, [field]: value } : org
    );
    setOrganizations(updatedOrganizations);
  };

  const handleAddOrganization = () => {
    setOrganizations([...organizations, { name: '', domain: '', mspID: '' }]);
  };

  return (
    <div className="App">
      <h1>Folder Creator with Organization Details</h1>

      <div>
        <p><strong>Hyperledger Version:</strong> {hyperledgerVersion}</p>
      </div>

      <div>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
        />
        <button onClick={handleSelectDirectory}>Select Directory</button>
      </div>

      {parentDir && <p>Selected directory: {parentDir}</p>}

      <div>
        <h2>Organization Details</h2>
        {organizations.map((org, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={org.name}
              onChange={(e) => handleOrganizationChange(index, 'name', e.target.value)}
              placeholder="Organization Name"
              style={{ marginRight: '10px' }}
            />
            <input
              type="text"
              value={org.domain}
              onChange={(e) => handleOrganizationChange(index, 'domain', e.target.value)}
              placeholder="Organization Domain"
              style={{ marginRight: '10px' }}
            />
            <input
              type="text"
              value={org.mspID}
              onChange={(e) => handleOrganizationChange(index, 'mspID', e.target.value)}
              placeholder="MSP ID"
            />
          </div>
        ))}
        <button onClick={handleAddOrganization}>Add Another Organization</button>
      </div>

      <button onClick={handleCreateFolder} disabled={!folderName || !parentDir || organizations.some(org => !org.name || !org.domain || !org.mspID)}>
        Create Folder and Generate YAML Files
      </button>

      {result && (
        <div>
          <h2>{result.success ? 'Success' : 'Error'}</h2>
          <p>{result.message}</p>
          {result.details && (
            <ul>
              {Object.entries(result.details).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {String(value)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
