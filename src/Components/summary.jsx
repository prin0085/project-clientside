/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import { dataContext } from "../Context/context";
import FileErrorlist from "./filetabComponents/FileErrorlist";

export default function Summary() {
    let [[analizeData, setAnalyzeData]] = useContext(dataContext);
    const displayDataAnalize = () => {
        console.log(analizeData)
        return analizeData.map((row, rowIndex) => (
            <div key={rowIndex}>
                {<FileErrorlist data={[row[1].originalname, row[0]]} />}
            </div>
        ));
    }

    return (
        <div className="overflow-hidden">
            {
                analizeData != 0 && displayDataAnalize()
            }
        </div>
    )
}