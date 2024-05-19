import React, { useContext } from "react";
import { dataContext } from './../Context/context';

const FileTab = () => {
    let [[analizeData, setAnalyzeData], [files, setFile], [fileName, setFileName]] = useContext(dataContext);

    const generateFiveDigitID = () => {
        return Math.floor(10000 + Math.random() * 90000);
    }

    return (
        <div>
            {files.map((file) => (
                <div className={`tab ${fileName == file.name ? 'active' : ''} cursor-pointer`}
                    onClick={() => setFileName(file.name)} key={generateFiveDigitID()}>
                    {file.name}
                </div>
            ))}
        </div>
    );
}

export default FileTab;