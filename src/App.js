import React, { useState } from 'react';
import './App.css';

// Get the API URL from environment variables or use a default for local development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }

    // Check if file is Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = async () => {
    if (result && result.fileUrl) {
      setDownloadInProgress(true);
      try {
        // Create a direct fetch request to the download endpoint
        const response = await fetch(`${API_URL}${result.fileUrl}`);
        
        if (!response.ok) {
          throw new Error('Download failed');
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a temporary download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'outreach_results.xlsx';
        
        // Append to the document, click, and clean up
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (err) {
        setError('Failed to download the file: ' + err.message);
      } finally {
        setDownloadInProgress(false);
      }
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
                accept=".xlsx, .xls"
                className="file-input"
              />
              <label htmlFor="excelFile" className="file-label">
                {file ? file.name : 'Choose Excel File'}
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !file} 
              className="submit-button"
            >
              {isLoading ? 'Processing...' : 'Generate Outreach Messages'}
            </button>
          </form>
          
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Scraping websites and generating personalized messages...</p>
              <p className="small-text">This may take a few minutes depending on the number of websites.</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="result-container">
              <h3>Processing Complete!</h3>
              <p>Successfully processed {result.processedCount} websites.</p>
              <p>Found contact information for {result.contactsFound} websites.</p>
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
            <li><strong>Prepare Excel File:</strong> Create an Excel file with website URLs in the first column.</li>
            <li><strong>Upload File:</strong> Upload your Excel file using the form above.</li>
            <li><strong>Automated Processing:</strong> Our system will:
              <ul>
                <li>Scrape each website for contact information</li>
                <li>Generate personalized outreach messages with AI</li>
                <li>Compile all data into a downloadable Excel file</li>
              </ul>
            </li>
            <li><strong>Download Results:</strong> Get your enhanced Excel file with contact details and outreach messages.</li>
          </ol>
        </div>
      </main>

      <footer>
        <p>AI Outreach Agent | Automate your lead generation and outreach</p>
      </footer>
    </div>
  );
}

export default App;