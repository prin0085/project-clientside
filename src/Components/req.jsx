import { useState } from 'react';

const SonarQubeCodeSmells = () => {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleAnalysis = () => {
        // if (!file) {
        //     alert('Please select a file for analysis.');
        //     return;
        // }

        // Set up form data
        const formData = new FormData();
        formData.append('file', file);

        const apiUrl = 'http://localhost:9000/api/issues/search';
        //const apiUrl = 'http://localhost:9000/api/authentication/login';
        const apiToken = 'sqa_56c1d49233fe53448f70b50e41bf7d2a75bbc5f7';
        //const encodedToken = btoa(`${apiToken}:`);
        // Make the API request
        fetch(apiUrl, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
            },
        })
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleAnalysis}>Analyze File</button>
        </div>
    );
};

export default SonarQubeCodeSmells;
