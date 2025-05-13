import React from 'react';
import { motion } from 'framer-motion';

const ConfirmationPopup = ({ onConfirm, onCancel }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-xl border border-gray-700 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
      >
        <h2 className="text-4xl font-bold text-btg mb-4">End Lab Confirmation</h2>
        <p className="text-lg text-white mb-6">Are you sure you want to end the lab? Your current progress will be lost.</p>
        <div className="flex justify-center space-x-4">
          <motion.button
            onClick={onConfirm}
            className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-black hover:from-[#09D1C7] hover:to-[#80EE98] transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            End Lab
          </motion.button>
          <motion.button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-500 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationPopup;

