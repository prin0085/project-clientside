/* eslint-disable no-unused-vars */
import React, { useContext, useEffect } from "react";
import { dataContext } from "../Context/context";
import FileErrorlist from "./filetabComponents/FileErrorlist";
import des from '../Utilities/RuleDescription.json';
import { ruleDescriptionDisplayer } from './globalFunction';

const filesData = {
}

export default function Summary() {
    const [[analizeData, setAnalyzeData], [files, setFile], [fileName, setFileName], [activePage, setActivePage]] = useContext(dataContext);

    const displayDataAnalize = () => {
        return (<FileErrorlist data={null} ndata={analizeData} />)
    }

    const displayActivePage = () => {
        const description = des.find(w => w.ruleId == activePage.ruleId);
        const filedata = analizeData.map(subArray => subArray[1]);
        const content = filedata.find(w => w.originalname === activePage.filename).data
        if (description) {
            return (
                <div>
                    <div><strong className="text-xl">{description.title}</strong></div>
                    <p className="text-slate-400 text-sm">บรรทัดที่ : {activePage.line}</p>
                    <p className="text-slate-400 text-sm">{description.description}</p>
                    <div className="m-5">{description.message}</div>

                    {ruleDescriptionDisplayer(content, activePage, description)}
                </div>
            )
        }
        return <>
            no data
        </>
    }

    const readFileFromBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    };

    const handleFileRead = async (f) => {
        try {
            const fileContent = await readFileFromBuffer(f);

            filesData[f.name] = {
                name: f.name,
                value: fileContent
            };
        } catch (error) {
            console.error('Error reading the file:', error);
        }
    };

    return (
        <div className="overflow-hidden flex">
            <div className="w-1/4">
                {analizeData && displayDataAnalize()}
            </div>
            <div className="w-3/4">
                <div className="p-5 overflow-auto h-90 invisble-scrollbar">
                    {activePage && displayActivePage()}
                </div>
            </div>
        </div>
    )
}