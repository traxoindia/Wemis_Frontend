import React from "react";
import ManufactureNavbar from "./ManufactureNavbar";

function Reports() {
  return (
    <>
      <ManufactureNavbar/>
   
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-10 border-2 border-yellow-400 rounded-2xl shadow-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-yellow-400 mb-4">
          Reports
        </h1>

        <p className="text-xl md:text-2xl text-yellow-300 tracking-wide">
          Will Appear Soon
        </p>

        <div className="mt-6 h-1 w-24 bg-yellow-400 mx-auto rounded-full" />
      </div>
    </div>
     </>
  );
}

export default Reports;
