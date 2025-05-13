import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import LoadingScreen from "./LoadingPage";
import { Button } from "../UI/button";
import { Card } from "../UI/Card";
import { CardContent } from "../UI/CardContent";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true 
});


const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);
  const { toolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toolName, toolDescription } = location.state || {};

  const handleLabClick = async (lab) => {
    setSelectedLab(lab);
    setIsLoading(true);
    navigate(`/dashboard/labs/${lab._id}/questions`, {
      state: {
        toolName: toolName,
        labName: lab.name,
        docker_image: lab.docker_image,
      },
    });
  };

  const fetchLabs = useCallback(async () => {
    if (!toolId) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/user/${toolId}/labs`);
      if (!Array.isArray(response.data.labs)) {
        throw new Error("Labs data is not an array");
      }
      setLabs(response.data.labs);
      console.log(response.data.labs);
    } catch (error) {
      console.error("Error fetching labs:", error);
      setError("Failed to load labs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    fetchLabs();

    // Scroll to the top when the component loads
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchLabs]);

  if (isLoading) {
    return (
      <LoadingScreen
        toolName={toolName}
        labName={selectedLab ? selectedLab.name : "Loading Lab"}
      />
    );
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-4 w-full mt-3 mx-auto">
      <div className="fixed inset-0 z-0">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative backdrop-blur-sm">
        <div className="p-4 md:p-6 border border-gray-400 bg-white/10">
          <div className="flex flex-row md:flex-row items-center md:items-start">
            <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gtb">
                {toolName} Labs
              </h2>
              <p className="text-base md:text-lg text-btg">{toolDescription}</p>
            </div>
            <img
              src={`/${toolName.toLowerCase()}.png`}
              className="w-36 h-36 md:w-20 md:h-20 md:ml-4 flex-shrink-0"
              alt={`${toolName} logo`}
            />
          </div>
        </div>

        <div className="relative p-4 md:p-6">
          <div className="absolute inset-0 opacity-5" />
          <div className="relative max-w-5xl mx-auto">
            <div className="space-y-6 md:space-y-8">
              <div className="md:absolute md:left-[27px] md:top-0 md:bottom-0 md:w-0.5 bg-[#09D1C7]/70" />

              {labs.map((lab, index) => (
                <div key={lab.name} className="relative md:pl-14">
                  <div className="md:absolute md:left-0 md:w-14 md:h-14 md:rounded-full bg-[#1A202C] md:border-4 md:border-[#09D1C7]/20 md:flex md:items-center md:justify-center">
                    <div
                      className={`md:w-8 md:h-8 rounded-full ${
                        index % 3 === 0
                          ? "md:bg-[#09D1C7]"
                          : index % 3 === 1
                          ? "md:bg-[#80EE98]"
                          : "md:bg-white"
                      }`}
                    />
                  </div>
                  <Card
                    className={`${
                      index % 3 === 0
                        ? "bg-[#1A202C]/50 border-[#09D1C7]/70 hover:bg-[#09D1C7]/5"
                        : index % 3 === 1
                        ? "bg-[#1A202C]/50 border-[#80EE98]/70 hover:bg-[#80EE98]/5"
                        : "bg-[#1A202C]/50 border-white/70 hover:bg-white/5"
                    } transition-colors group`}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="mb-4 md:mb-0">
                          <h2
                            className={`text-xl md:text-2xl font-bold mb-2 pt-2 md:pt-4 ${
                              index % 3 === 0
                                ? "text-[#09D1C7]"
                                : index % 3 === 1
                                ? "text-[#80EE98]"
                                : "text-white"
                            }`}
                          >
                            {lab.name}
                          </h2>
                          <p className="text-white/80 text-sm md:text-base">
                            {lab.description}
                          </p>
                        </div>
                        <Button
                          className={`${
                            index % 3 === 0
                              ? "bg-[#09D1C7]/10 text-[#09D1C7] hover:bg-[#09D1C7]/20"
                              : index % 3 === 1
                              ? "bg-[#80EE98]/10 text-[#80EE98] hover:bg-[#80EE98]/20"
                              : "bg-white/10 text-white hover:bg-white/20"
                          } transition-colors mt-2 md:mt-8 p-2 pl-4 pr-4 md:pl-6 md:pr-6 w-28 md:w-auto`}
                          onClick={() => handleLabClick(lab)}
                        >
                          Start Lab
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Labs;
