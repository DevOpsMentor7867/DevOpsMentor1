function TerminalComponent() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [containerStopped, setContainerStopped] = useState(false);
    const [time, setTime] = useState(3600); // 1 hour in seconds
    const [isDragging, setIsDragging] = useState(false);
    const [terminalWidth, setTerminalWidth] = useState(50); // 50% by default
    const [showHint, setShowHint] = useState(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(0);
    const terminalRef = useRef(null);
    const socketRef = useRef(null);
    const termInstanceRef = useRef(null);
  
    const questions = [
      {
        id: 1,
        text: "Stop the container you just created",
        hint: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Autem at doloribus ut excepturi iure inventore natus dignissimos id consectetur vel reiciendis tempora cumque expedita ab mollitia sunt nam, iusto porro commodi aut qui rerum molestiae. Accusantium qui porro sapiente ullam! Minima est repellat architecto quod molestiae eius odit iure ducimus."
      },
      {
        id: 2,
        text: "How do you stop a running container?",
        hint: "Use the container ID or name",
      },
      {
        id: 3,
        text: "What command creates a new container from an image?",
        hint: "Start a new container instance",
      },
    ];
  
    useEffect(() => {
      const timer = setInterval(() => {
        setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
  
      return () => clearInterval(timer);
    }, []);
  
    useEffect(() => {
      socketRef.current = new WebSocket("ws://localhost:6060");
      termInstanceRef.current = new Terminal({ cursorBlink: true });
      termInstanceRef.current.open(terminalRef.current);
  
      socketRef.current.onmessage = (event) => {
        termInstanceRef.current.write(event.data);
      };
  
      termInstanceRef.current.onKey(({ key }) => {
        socketRef.current.send(key);
      });
  
      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    }, []);
  
    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isDragging) return;
        const containerRect = document.querySelector(".container")?.getBoundingClientRect();
        if (!containerRect) return;
        const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
        setTerminalWidth(Math.min(Math.max(newWidth, 30), 70));
      };
  
      const handleMouseUp = () => {
        setIsDragging(false);
      };
  
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
  
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging]);
  
    useEffect(() => {
      const handleResize = () => {
        const containerRect = document.querySelector(".container")?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = (terminalWidth / 100) * containerRect.width;
          setTerminalWidth((newWidth / containerRect.width) * 100);
        }
      };
  
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [terminalWidth]);
  
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };
  
    const handleCheck = () => {
      setIsChecked(true);
      setContainerStopped(true);
      fetch("http://localhost:5500/done_lab", { method: "GET" })
        .then((response) => {
          if (response.ok) {
            console.log("Lab checked successfully");
          } else {
            console.error("Error checking lab");
          }
        })
        .catch((error) => console.error("Error:", error));
    };
  
    const handleNext = () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setIsChecked(false);
        setContainerStopped(false);
      }
    };
  
    const handleDragStart = (e) => {
      setIsDragging(true);
      dragStartX.current = e.clientX;
      const containerRect = document.querySelector(".container")?.getBoundingClientRect();
      if (containerRect) {
        dragStartWidth.current = (terminalWidth / 100) * containerRect.width;
      }
    };
  
    const toggleHint = () => {
      setShowHint((prev) => !prev);
    };
  
    return (
      <div className="mt-2">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-white font-mono">sk</span>
              <button onClick={toggleHint} className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors duration-200">
                Hint
              </button>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(time)}</span>
            </div>
          </div>
  
          <div className="flex flex-row h-[calc(95vh-120px)]">
            {/* Question Section */}
            <div
              className="relative overflow-hidden backdrop-blur-md bg-white bg-opacity-10 transition-all duration-300 h-full"
              style={{ width: `${100 - terminalWidth}%` }}
            >
              <div className="p-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 17 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full ${i <= currentQuestion ? "bg-blue-500" : "bg-gray-700"}`}
                      />
                    ))}
                  </div>
                </div>
  
                <div className="min-h-[120px] text-white mt-6">
                  <p className="text-xl font-semibold mb-4">{questions[currentQuestion].text}</p>
                  {containerStopped && (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Container Stopped</span>
                    </div>
                  )}
                </div>
  
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleCheck}
                    className={`w-full py-3 text-base font-medium rounded-full overflow-hidden relative ${
                      isChecked ? "text-green-500" : "text-white"
                    } bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-transparent bg-clip-padding cursor-pointer`}
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      {isChecked ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Checked
                        </>
                      ) : (
                        "Check"
                      )}
                    </div>
                  </button>
                  {isChecked && (
                    <button
                      onClick={handleNext}
                      className="w-full py-3 text-base font-medium text-white rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-none cursor-pointer"
                    >
                      Next
                    </button>
                  )}
                </div>
  
                <div className="flex justify-between text-gray-400 text-sm mt-4">
                  <span>{currentQuestion + 1} / 17</span>
                </div>
              </div>
            </div>
  
            <div
              className="-ml-2 left-0 top-0 bottom-0 w-3 bg-gray-600 hover:bg-cyan-600 transition-colors duration-500 cursor-ew-resize flex items-center justify-center z-[100]"
              onMouseDown={handleDragStart}
            >
              <div className="h-8 w-[10px] bg-current rounded-full" />
            </div>
  
            {/* Terminal Section */}
            <div
              className="relative overflow-hidden backdrop-blur-md bg-white bg-opacity-10 transition-all duration-300 h-full"
              style={{ width: `${terminalWidth}%` }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white border-opacity-10 p-2">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-mono text-sm">Terminal 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="bg-transparent border-none text-gray-400 cursor-pointer">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button className="bg-transparent border-none text-gray-400 cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="bg-transparent border-none text-gray-400 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div ref={terminalRef} className="h-[400px]" />
              </div>
            </div>
          </div>
  
          {/* Hint Popup */}
          {showHint && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[2000]"
              onClick={toggleHint}
            >
              <div
                className="relative overflow-hidden backdrop-blur-md bg-white bg-opacity-20 border-none rounded-lg p-6 max-w-md w-full transform transition-all duration-300 scale-90 opacity-100 animate-in "
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleHint}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors duration-200 "
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-4xl font-bold  text-white  mb-4">Hint</h3>
                <p className="text-gray-300"><code> {questions[currentQuestion].hint} </code></p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default TerminalComponent;

  //////////////////////////////////////////

  import React, { useState, useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

const TerminalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="red"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

const CheckCircle2 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const Clock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const Maximize2 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#gradient)" // Reference the gradient by its ID
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#06b6d4", stopOpacity: 1 }} />{" "}
        {/* cyan-500 */}
        <stop
          offset="100%"
          style={{ stopColor: "#3b82f6", stopOpacity: 1 }}
        />{" "}
        {/* blue-500 */}
      </linearGradient>
    </defs>
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
);



const X = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#gradientX)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="gradientX" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />{" "}
        {/* cyan-500 */}
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />{" "}
        {/* blue-500 */}
      </linearGradient>
    </defs>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const tools = {
  docker: {
    name: "Docker",
    labs: [
      {
        id: "docker-basics",
        name: "Docker Basics",
        questions: [
          {
            id: 1,
            text: "Create a new container from nginx image",
            hint: "Use docker run command with the nginx image",
          },
          {
            id: 2,
            text: "List all running containers",
            hint: "Use docker ps command",
          },
        ],
      },
      {
        id: "docker-compose",
        name: "Docker Compose",
        questions: [
          {
            id: 1,
            text: "Create a docker-compose.yml file",
            hint: "Define services, networks, and volumes",
          },
        ],
      },
    ],
  },
  kubernetes: {
    name: "Kubernetes",
    labs: [
      {
        id: "k8s-pods",
        name: "Pod Management",
        questions: [
          {
            id: 1,
            text: "Create a new pod using nginx image",
            hint: "Use kubectl run command",
          },
        ],
      },
    ],
  },
  git: {
    name: "Git",
    labs: [
      {
        id: "git-basics",
        name: "Git Fundamentals",
        questions: [
          {
            id: 1,
            text: "Initialize a new git repository",
            hint: "Use git init command",
          },
        ],
      },
    ],
  },
};

function TerminalComponent() {
  const [currentTool, setCurrentTool] = useState("docker");
  const [currentLab, setCurrentLab] = useState("docker-basics");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [containerStopped, setContainerStopped] = useState(false);
  const [time, setTime] = useState(3600);
  const [isDragging, setIsDragging] = useState(false);
  const [terminalWidth, setTerminalWidth] = useState(50);
  const [showHint, setShowHint] = useState(false);

  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const termInstanceRef = useRef(null);

  const getCurrentLab = () =>
    tools[currentTool].labs.find((lab) => lab.id === currentLab);
  const totalQuestions = getCurrentLab()?.questions.length || 0;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // Terminal setup and event handlers remain the same...
  // (useEffect blocks for terminal, dragging, and timer remain unchanged)

  return (
    <div className="">
      {/* Top Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 my-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <h1 className="text-2xl font-bold text-cgrad">
                  {tools[currentTool].name}
                </h1>
                <p className="text-sm text-gray-400 ">
                  {getCurrentLab()?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className=" rounded-lg p-2 shadow-xl ">
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Progress</p>
                    <div className="flex items-center mt-2">
                      <div className="w-64 h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="ml-2 text-white">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Time</p>
                    <div className="flex items-center mt-2 text-white">
                      <Clock className="w-4 h-4 mr-2 " />
                      <span className="text-red-700 ml-2">
                        {Math.floor(time / 60)}:
                        {(time % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 -my-8">
        <div className="flex flex-row h-[calc(90vh-120px)] gap-2">
          {/* Questions Section */}
          <div
            className="relative rounded-xl overflow-hidden backdrop-blur-md bg-gray-800/50 border border-gray-700 transition-all duration-300"
            style={{ width: `${100 - terminalWidth}%` }}
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-cgrad">
                    Question {currentQuestion + 1}
                  </h2>
                  <button
                    onClick={() => setShowHint(true)}
                    className="px-4 py-2 rounded-lg bg-gray-700 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-colors text-white"
                  >
                    Hint
                  </button>
                </div>

                <div className="prose prose-invert">
                  <p className="text-lg text-gray-200">
                    {getCurrentLab()?.questions[currentQuestion]?.text}
                  </p>
                </div>

                {containerStopped && (
                  <div className="mt-4 flex items-center text-green-500">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    <span>Success!</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-auto">
                <button
                  onClick={() => setIsChecked(true)}
                  className={`
                    w-full py-3 rounded-lg font-medium
                    ${
                      isChecked
                        ? "bg-green-500 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                    }
                    transition-all duration-300 hover:opacity-90
                  `}
                >
                  {isChecked ? "Completed!" : "Check Answer"}
                </button>

                {isChecked && (
                  <button
                    onClick={() => {
                      setCurrentQuestion((prev) => prev + 1);
                      setIsChecked(false);
                    }}
                    className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white hover:opacity-90 transition-all duration-300"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Drag Handle */}
          <div
            className="w-2 cursor-col-resize bg-gray-700 hover:bg-cyan-600 transition-colors duration-300 rounded-full"
            onMouseDown={(e) => {
              setIsDragging(true);
              dragStartX.current = e.clientX;
              dragStartWidth.current = terminalWidth;
            }}
          />

          {/* Terminal Section */}
          <div
            className="relative rounded-xl overflow-hidden backdrop-blur-md bg-gray-800/50 border border-gray-700 transition-all duration-300"
            style={{ width: `${terminalWidth}%` }}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <TerminalIcon className="w-4 h-4 text-red-700" />
                  <span className="text-cgrad font-mono text-sm">Terminal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Maximize2 className="w-4 h-4 text-gray-400" />
                  </button>
                  {/* <button className="p-1 hover:bg-gray-700 rounded">
                    <Plus className="w-4 h-4 " />
                  </button> */}
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div ref={terminalRef} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Hint Modal */}
      {showHint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Hint</h3>
              <button
                onClick={() => setShowHint(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-200">
              {getCurrentLab()?.questions[currentQuestion]?.hint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerminalComponent;
