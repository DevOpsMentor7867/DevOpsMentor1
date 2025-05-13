import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="z-50 fixed inset-0 flex items-center justify-center bg-opacity-50">
      <div className="bg-[#1A202C] p-5 rounded-lg shadow-lg">
        <p className="text-4xl text-btg pl-1 text-center">DevOps Mentor</p>
        <div className="flex flex-col items-center mt-5">
          <div className="w-8 h-8 border-4 border-t-4 border-[#80EE98] border-t-[#09D1C7] rounded-full animate-spin"></div>
          <p className="mt-3 text-[#80EE98] text-center">
            Verifying Your Outputs
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
