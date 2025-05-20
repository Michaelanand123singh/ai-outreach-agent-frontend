import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ai-outreach-agent-backend-2.onrender.com';

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = ['.xlsx', '.xls'];
    const fileExt = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const createFormData = () => {
    const formData = new FormData();
    formData.append('excelFile', file);
    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        body: createFormData(),
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || errorData.message || 'Processing failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = async () => {
    if (!result?.fileUrl) return;

    setDownloadInProgress(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${result.fileUrl}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'outreach_results.xlsx';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download: ' + err.message);
    } finally {
      setDownloadInProgress(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Outreach Agent</h1>
        <p>Upload a list of websites and get personalized outreach messages</p>
      </header>

      <main>
        <div className="card">
          <h2>Upload Website List</h2>
          <form onSubmit={handleSubmit}>
            <div className="file-input-container">
              <input 
                type="file" 
                id="excelFile" 
                onChange={handleFileChange} 
                accept=".xlsx,.xls"
                className="file-input"
                disabled={isLoading}
              />
              <label htmlFor="excelFile" className="file-label">
                {file ? file.name : 'Choose Excel File (.xlsx, .xls)'}
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !file}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : 'Generate Outreach Messages'}
            </button>
          </form>
          
          {isLoading && (
            <div className="loading-container">
              <p>Processing your file...</p>
              <p className="small-text">
                This may take several minutes depending on file size.
              </p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button 
                onClick={() => setError(null)}
                className="dismiss-button"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {result && (
            <div className="result-container">
              <h3>Processing Complete!</h3>
              <p>Websites processed: {result.processedCount || 0}</p>
              <p>Contacts found: {result.contactsFound || 0}</p>
              
              <button 
                onClick={downloadResults}
                className="download-button"
                disabled={downloadInProgress}
              >
                {downloadInProgress ? 'Downloading...' : 'Download Results'}
              </button>
            </div>
          )}
        </div>

        <div className="instructions-card">
          <h2>How It Works</h2>
          <ol>
            <li><strong>Prepare Excel File:</strong> Column A should contain website URLs</li>
            <li><strong>Upload File:</strong> Maximum file size 5MB</li>
            <li><strong>Processing:</strong> Our AI will:
              <ul>
                <li>Scrape each website for contact info</li>
                <li>Generate personalized messages</li>
                <li>Compile results</li>
              </ul>
            </li>
            <li><strong>Download:</strong> Get your enhanced Excel file</li>
          </ol>
        </div>
      </main>

      <footer>
        <p>AI Outreach Agent | {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;