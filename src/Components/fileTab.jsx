import React, { useContext } from "react";
import { Filelist, openedFile } from './../Context/context';

const FileTab = () => {
    let [files, setFile] = useContext(Filelist);
    let [crrFile, setCrrFile] = useContext(openedFile);

    const generateFiveDigitID = () => {
        return Math.floor(10000 + Math.random() * 90000);
    }

    return (
        <div>
            {files.map((file) => (
                <div className={`tab ${crrFile == file.name ? 'active' : ''} cursor-pointer`}
                    onClick={() => setCrrFile(file.name)} key={generateFiveDigitID()}>
                    {file.name}
                </div>
            ))
            }
        </div>
    );
}

export default FileTab;