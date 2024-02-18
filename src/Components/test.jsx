import React, { useState } from 'react';

function Test() {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleAnalysis = async () => {
        if (!file) {
            alert('Please select a file for analysis.');
            return;
        }

        const apiUrl = 'http://localhost:3001/test';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(apiUrl, {
                method: 'GET',
                mode: 'no-cors',
                // body: formData,
                // headers: {
                //     'Content-Type': 'application/json; charset=utf-8',
                //     'Access-Control-Allow-Origin': 'http://localhost:5173/',
                // },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Response Data:', data);
            } else {
                console.error('Server returned an error:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error analyzing file:', error);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleAnalysis}>Analyze File</button>
            </header>
        </div>
    );
}

export default Test;
