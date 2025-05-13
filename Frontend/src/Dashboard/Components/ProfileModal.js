import React, { useState, useEffect } from 'react';

const ProfileSetupModal = ({ email, onSave, apiMessage, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    gender: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (apiMessage.type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Close the modal after 2 seconds on success
      return () => clearTimeout(timer);
    }
  }, [apiMessage, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.gender) return;
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  const isFormValid = formData.name && formData.username && formData.gender;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50  min-h-screen ">
      <div className="relative bg-[#1A202C] rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-4xl font-bold text-btg mb-6 text-center">DEV∞OPS Mentor</h2>
          <h2 className="text-xl font-bold text-white mb-6 text-center">Complete Your Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <div className="flex items-center gap-4 group">
                <label htmlFor="name" className="text-[#80EE98] text-lg font-medium w-24">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border border-[#80EE98]/20 group-hover:border-[#80EE98]/40 focus:border-[#80EE98] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#80EE98] transition-colors"
                  placeholder="Enter your name"
                />
              </div>
              <div className="absolute -bottom-1 left-24 right-0 h-px bg-gradient-to-r from-transparent via-[#80EE98]/20 to-transparent" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 group">
                <label htmlFor="email" className="text-[#09D1C7] text-lg font-medium w-24">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="flex-1 bg-[#1A202C]/50 border border-[#09D1C7]/20 text-white/60 rounded-lg px-4 py-2.5 focus:outline-none"
                />
              </div>
              <div className="absolute -bottom-1 left-24 right-0 h-px bg-gradient-to-r from-transparent via-[#09D1C7]/20 to-transparent" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 group">
                <label htmlFor="username" className="text-[#80EE98] text-lg font-medium w-24">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border border-[#80EE98]/20 group-hover:border-[#80EE98]/40 focus:border-[#80EE98] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#80EE98] transition-colors"
                  placeholder="Choose a username"
                />
              </div>
              <div className="absolute -bottom-1 left-24 right-0 h-px bg-gradient-to-r from-transparent via-[#80EE98]/20 to-transparent" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-4 group">
                <label className="text-[#09D1C7] text-lg font-medium w-24">
                  Gender
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                      className="mr-2 text-[#09D1C7] focus:ring-[#09D1C7]"
                    />
                    <span className="text-white">Male</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                      className="mr-2 text-[#09D1C7] focus:ring-[#09D1C7]"
                    />
                    <span className="text-white">Female</span>
                  </label>
                </div>
              </div>
              <div className="absolute -bottom-1 left-24 right-0 h-px bg-gradient-to-r from-transparent via-[#80EE98]/20 to-transparent" />
            </div>

            {apiMessage.content && (
              <div className={`text-center ${apiMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {apiMessage.content}
              </div>
            )}

            <div className="relative pt-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#80EE98]/20 to-transparent" />
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98] transform hover:scale-[1.02]'
                    : 'bg-[#80EE98]/20 text-white/60 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;

