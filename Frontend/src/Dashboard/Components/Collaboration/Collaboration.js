import React from 'react';
const dummyUsers = [
  {
    id: 1,
    name: "Alex Morgan",
    expertise: "Full Stack Developer",
    progress: 85,
    location: "San Francisco, CA",
    skills: ["React", "Node.js", "MongoDB"]
  },
  {
    id: 2,
    name: "Sarah Chen",
    expertise: "UI/UX Designer",
    progress: 92,
    location: "Toronto, ON",
    skills: ["Figma", "Adobe XD", "Prototyping"]
  },
  {
    id: 3,
    name: "Marcus Kim",
    expertise: "DevOps Engineer",
    progress: 78,
    location: "Seoul, SK",
    skills: ["Docker", "Kubernetes", "AWS"]
  },
  {
    id: 4,
    name: "Marcus Kim",
    expertise: "DevOps Engineer",
    progress: 78,
    location: "Seoul, SK",
    skills: ["Docker", "Kubernetes", "AWS"]
  },
  {
    id: 5,
    name: "Marcus Kim",
    expertise: "DevOps Engineer",
    progress: 78,
    location: "Seoul, SK",
    skills: ["Docker", "Kubernetes", "AWS"]
  },
  
];



function Collaboration({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  const handleInvite = (userId) => {
    console.log(`Invited user ${userId} to collaborate`);
  };

  return (
    <div className="z-50 backdrop-blur-sm  fixed inset-0 bg-black/50 flex items-center justify-center ">
      <div className="bg-[#1A202C] rounded-lg p-6 w-[900px] max-h-[570px] overflow-y-auto custom-scrollbar mr-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-btg">Online Users</h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {dummyUsers.map((user, index) => (
            <div
              key={user.id}
              className={`
                rounded-lg p-6 border transition-colors
                ${
                  index % 3 === 0
                    ? "bg-[#1A202C]/50 border-[#09D1C7]/20 hover:bg-[#09D1C7]/5"
                    : index % 3 === 1
                    ? "bg-[#1A202C]/50 border-[#80EE98]/20 hover:bg-[#80EE98]/5"
                    : "bg-[#1A202C]/50 border-white/10 hover:bg-white/5"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full  flex items-center justify-center  ${
                    index % 3 === 0
                      ? "bg-[#09D1C7]"
                      : index % 3 === 1
                      ? "bg-[#80EE98] text-black"
                      : "bg-white"
                  }`}>
                  <span className={`text-lg ${
                    index % 3 === 0
                      ? ""
                      : index % 3 === 1
                      ? " text-black"
                      : "text-black"
                  } `}>{user.name[0]}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-bold mb-1 ${
                    index % 3 === 0
                      ? "text-[#09D1C7]"
                      : index % 3 === 1
                      ? "text-[#80EE98]"
                      : "text-white"
                  }`}>
                    {user.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-2">{user.expertise}</p>
                  <p className="text-white/40 text-sm mb-3">{user.location}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.skills.map((skill, i) => (
                      <span
                        key={i}
                        className={`
                          px-2 py-1 rounded-full text-xs
                          ${
                            index % 3 === 0
                              ? "bg-[#09D1C7]/10 text-[#09D1C7]"
                              : index % 3 === 1
                              ? "bg-[#80EE98]/10 text-[#80EE98]"
                              : "bg-white/10 text-white"
                          }
                        `}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleInvite(user.id)}
                    className={`
                      w-50 pt-1 pb-1 pl-4 pr-4 rounded-md text-sm font-medium transition-colors
                      ${
                        index % 3 === 0
                          ? "bg-[#09D1C7]/10 text-[#09D1C7] hover:bg-[#09D1C7]/20"
                          : index % 3 === 1
                          ? "bg-[#80EE98]/10 text-[#80EE98] hover:bg-[#80EE98]/20"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }
                    `}
                  >
                    Invite
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Collaboration;

