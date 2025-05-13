import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteAccountPopup = ({ isOpen, onClose, onDelete, apiMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDelete(email, password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm "
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#1A202C] p-6 rounded-lg shadow-xl max-w-md w-full ml-12"
          >
            <h2 className="text-2xl font-bold text-gtb mb-4">Delete Account</h2>
            <p className="text-white mb-4">Please confirm your email and password to delete your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Confirm Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-[#80EE98]/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#09D1C7]"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-[#80EE98]/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#09D1C7]"
                required
              />
              {apiMessage.content && (
              <div
                className={`mt-4 px-4 py-2 rounded-md text-sm font-medium ${
                  apiMessage.type === "success"
                    ? "bg-[#80EE98]/20 text-[#80EE98]"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {apiMessage.content}
              </div>
            )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Initiate Account Deletion
                </button>
              </div>
            </form>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountPopup;

