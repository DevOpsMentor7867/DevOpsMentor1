"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"
import { Bell, Calendar, ChevronDown, Clock, FileText, LayoutDashboard, Settings, User } from "lucide-react"

// Hardcoded fallback data
const fallbackData = {
  toolsProgress: [
    { name: "Linux Foundation", progress: 25, labsCompleted: 2, totalLabs: 4 },
    { name: "Docker", progress: 40, labsCompleted: 3, totalLabs: 5 },
    { name: "Kubernetes", progress: 0, labsCompleted: 0, totalLabs: 6 },
    { name: "Terraform", progress: 0, labsCompleted: 0, totalLabs: 4 },
    { name: "Jenkins", progress: 0, labsCompleted: 0, totalLabs: 5 },
    { name: "Ansible", progress: 0, labsCompleted: 0, totalLabs: 4 },
  ],
  labsProgress: [
    {
      toolName: "Linux Foundation",
      labs: [
        {
          name: "Basic Commands",
          completion: 100,
          questionsCompleted: 10,
          totalQuestions: 10,
          attemptStats: {
            firstAttempt: 8,
            secondAttempt: 2,
            thirdOrMore: 0,
            averageAttempts: 1.2,
          },
        },
        {
          name: "File Management",
          completion: 80,
          questionsCompleted: 8,
          totalQuestions: 10,
          attemptStats: {
            firstAttempt: 6,
            secondAttempt: 2,
            thirdOrMore: 0,
            averageAttempts: 1.25,
          },
        },
        {
          name: "Process Management",
          completion: 0,
          questionsCompleted: 0,
          totalQuestions: 8,
          attemptStats: {
            firstAttempt: 0,
            secondAttempt: 0,
            thirdOrMore: 0,
            averageAttempts: 0,
          },
        },
      ],
    },
    {
      toolName: "Docker",
      labs: [
        {
          name: "Container Basics",
          completion: 100,
          questionsCompleted: 12,
          totalQuestions: 12,
          attemptStats: {
            firstAttempt: 10,
            secondAttempt: 2,
            thirdOrMore: 0,
            averageAttempts: 1.17,
          },
        },
        {
          name: "Docker Compose",
          completion: 75,
          questionsCompleted: 9,
          totalQuestions: 12,
          attemptStats: {
            firstAttempt: 7,
            secondAttempt: 1,
            thirdOrMore: 1,
            averageAttempts: 1.33,
          },
        },
        {
          name: "Docker Networking",
          completion: 0,
          questionsCompleted: 0,
          totalQuestions: 10,
          attemptStats: {
            firstAttempt: 0,
            secondAttempt: 0,
            thirdOrMore: 0,
            averageAttempts: 0,
          },
        },
      ],
    },
  ],
  attemptStats: {
    firstAttempt: 63,
    secondAttempt: 25,
    thirdOrMore: 12,
    averageAttempts: 1.5,
    totalQuestions: 45,
  },
  overallCompletion: 15,
}

// Theme colors from the provided function
const getThemeColor = (index) => {
  if (index % 3 === 0)
    return {
      primary: "text-[#09D1C7]",
      bg: "bg-[#09D1C7]",
      bgLight: "bg-[#09D1C7]/10",
      bgHover: "hover:bg-[#09D1C7]/20",
      border: "border-[#09D1C7]/20",
    }
  else if (index % 3 === 1)
    return {
      primary: "text-[#80EE98]",
      bg: "bg-[#80EE98]",
      bgLight: "bg-[#80EE98]/10",
      bgHover: "hover:bg-[#80EE98]/20",
      border: "border-[#80EE98]/20",
    }
  return {
    primary: "text-white",
    bg: "bg-white",
    bgLight: "bg-white/10",
    bgHover: "hover:bg-white/20",
    border: "border-white/10",
  }
}

// Theme colors for the dashboard
const themeColors = {
  primary: "#09D1C7", // Cyan
  secondary: "#80EE98", // Green
  tertiary: "#FFFFFF", // White
  background: "#0F172A", // Dark blue
  cardBg: "rgba(16, 23, 36, 0.7)",
  chartColors: ["#09D1C7", "#80EE98", "#FFFFFF"],
  gradients: {
    primary: "linear-gradient(135deg, #09D1C7 0%, #80EE98 100%)",
    secondary: "linear-gradient(135deg, #09D1C7 0%, #0F172A 100%)",
    card: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)",
  },
}

// Custom tooltip styles for charts
const CustomTooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  border: `1px solid ${themeColors.primary}40`,
  borderRadius: "8px",
  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px ${themeColors.primary}20`,
  padding: "8px 12px",
  color: "#fff",
}

const DashboardOverview = () => {
  const { user } = useAuthContext()
  const [progressData, setProgressData] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)
  const [selectedLab, setSelectedLab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedToolData, setSelectedToolData] = useState(null)
  const [selectedLabData, setSelectedLabData] = useState(null)
  const [overallCompletion, setOverallCompletion] = useState(0)
  const [toolsQuestionData, setToolsQuestionData] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())

  const navigate = useNavigate()

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true)

        if (!user?._id) {
          // If no user, use fallback data
          setProgressData(fallbackData)
          setSelectedTool(fallbackData.toolsProgress[0].name)
          setLoading(false)
          return
        }

        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL || "http://localhost:8000/api"}/analytics/progress?userId=${user._id}`,
        )

        const data = response.data
        console.log("Progress data:", data)

        // Use real data if available, otherwise use fallback
        setProgressData(data || fallbackData)
        if (data?.toolsProgress?.length > 0) {
          setSelectedTool(data.toolsProgress[0].name)
        } else if (fallbackData.toolsProgress.length > 0) {
          setSelectedTool(fallbackData.toolsProgress[0].name)
        }
      } catch (error) {
        console.error("Error fetching progress data:", error)
        // Use fallback data on error
        setProgressData(fallbackData)
        setSelectedTool(fallbackData.toolsProgress[0].name)
      } finally {
        setLoading(false)
      }
    }

    fetchProgressData()
  }, [user, navigate])

  // Process data when progressData or selectedTool changes
  useEffect(() => {
    if (!progressData) return

    // Get selected tool data
    const selectedData = progressData.labsProgress.find((t) => t.toolName === selectedTool)
    setSelectedToolData(selectedData)

    // Set default selected lab if not already set or if changing tools
    if (selectedData && (!selectedLab || !selectedData.labs.find((lab) => lab.name === selectedLab))) {
      setSelectedLab(selectedData.labs[0]?.name || null)
    }

    // Calculate overall completion
    const totalQuestions = progressData.labsProgress.reduce(
      (sum, tool) => sum + tool.labs.reduce((labSum, lab) => labSum + lab.totalQuestions, 0),
      0,
    )

    const completedQuestions = progressData.labsProgress.reduce(
      (sum, tool) => sum + tool.labs.reduce((labSum, lab) => labSum + lab.questionsCompleted, 0),
      0,
    )

    const overall = totalQuestions > 0 ? ((completedQuestions / totalQuestions) * 100).toFixed(2) : 0
    setOverallCompletion(overall)

    // Prepare data for tools question completion chart
    const toolsData = progressData.labsProgress.map((tool) => {
      const totalToolQuestions = tool.labs.reduce((sum, lab) => sum + lab.totalQuestions, 0)
      const completedToolQuestions = tool.labs.reduce((sum, lab) => sum + lab.questionsCompleted, 0)

      return {
        name: tool.toolName,
        questionsCompleted: completedToolQuestions,
        totalQuestions: totalToolQuestions,
        completionPercentage:
          totalToolQuestions > 0 ? Math.round((completedToolQuestions / totalToolQuestions) * 100) : 0,
      }
    })

    setToolsQuestionData(toolsData)
  }, [progressData, selectedTool, selectedLab])

  // Update selected lab data when selectedLab changes
  useEffect(() => {
    if (!selectedToolData || !selectedLab) return

    const labData = selectedToolData.labs.find((lab) => lab.name === selectedLab)
    setSelectedLabData(labData)
  }, [selectedToolData, selectedLab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#09D1C7] mx-auto mb-4"></div>
          <p className="text-[#09D1C7]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Always have data to display (either real or fallback)
  const data = progressData || fallbackData

  // Calculate tools progress data dynamically
  const toolsProgressData = data.toolsProgress.map((tool) => {
    const toolLabs = data.labsProgress.find((t) => t.toolName === tool.name)?.labs || []
    const totalCompletion = toolLabs.reduce((sum, lab) => sum + lab.completion, 0)
    const avgCompletion = toolLabs.length > 0 ? (totalCompletion / toolLabs.length).toFixed(2) : 0

    return {
      name: tool.name,
      progress: Number(avgCompletion), // Convert to number for chart
      labsCompleted: toolLabs.filter((lab) => lab.completion === 100).length,
      totalLabs: toolLabs.length,
    }
  })

  // Get attempt statistics for the selected lab
  const attemptData = selectedLabData?.attemptStats || data.attemptStats
  const attemptChartData = [
    { name: "1st Attempt", value: attemptData.firstAttempt || 0 },
    { name: "2nd Attempt", value: attemptData.secondAttempt || 0 },
    { name: "3+ Attempts", value: attemptData.thirdOrMore || 0 },
  ]

  // Function to get color based on tool name
  // eslint-disable-next-line
  const getToolColor = (toolName, opacity = 1) => {
    const colorMap = {
      Docker: `rgba(9, 209, 199, ${opacity})`,
      Kubernetes: `rgba(128, 238, 152, ${opacity})`,
      Jenkins: `rgba(255, 255, 255, ${opacity})`,
      "Linux Foundation": `rgba(9, 209, 199, ${opacity})`,
      Terraform: `rgba(128, 238, 152, ${opacity})`,
      Ansible: `rgba(255, 255, 255, ${opacity})`,
    }

    // Return mapped color or fallback to primary
    return colorMap[toolName] || `rgba(9, 209, 199, ${opacity})`
  }

  // Format date for header
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format time for header
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header with navigation */}
      <header className="bg-[#0F172A] border-b border-[#09D1C7]/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-[#09D1C7]" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#09D1C7] to-[#80EE98] bg-clip-text text-transparent">
              DevOps Learning Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-[#09D1C7]/10 hover:bg-[#09D1C7]/20 transition-colors">
              <Bell className="h-5 w-5 text-[#09D1C7]" />
            </button>
            <button className="p-2 rounded-full bg-[#09D1C7]/10 hover:bg-[#09D1C7]/20 transition-colors">
              <Settings className="h-5 w-5 text-[#09D1C7]" />
            </button>
            <div className="flex items-center space-x-2 bg-[#09D1C7]/10 hover:bg-[#09D1C7]/20 transition-colors rounded-full px-3 py-1.5 cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-[#09D1C7]/30 flex items-center justify-center">
                <User className="h-5 w-5 text-[#09D1C7]" />
              </div>
              <span className="text-sm font-medium">{user?.name || "User"}</span>
              <ChevronDown className="h-4 w-4 text-[#09D1C7]" />
            </div>
          </div>
        </div>
      </header>

      {/* Welcome section */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-b border-[#09D1C7]/10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                <span className="text-white">{getGreeting()}, </span>
                <span className="text-[#09D1C7]">{user?.name || "User"}</span>
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-[#09D1C7]" />
                  <span>{formatDate(currentTime)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-[#09D1C7]" />
                  <span>{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-[#09D1C7]/10 rounded-lg px-4 py-2">
              <div className="text-right">
                <div className="text-sm text-gray-400">Overall Completion</div>
                <div className="text-2xl font-bold text-[#09D1C7]">{overallCompletion}%</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#09D1C7]/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#09D1C7]" />
              </div>
            </div>
          </div>

          {/* Progress summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-[#09D1C7]/20 to-[#09D1C7]/5 rounded-xl p-4 border border-[#09D1C7]/20 backdrop-blur-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-400 text-sm">Tools Explored</h3>
                  <p className="text-2xl font-bold text-white mt-1">
                    {
                      data.toolsProgress.filter((t) =>
                        data.labsProgress.find(
                          (lp) => lp.toolName === t.name && lp.labs.some((l) => l.questionsCompleted > 0),
                        ),
                      ).length
                    }
                    <span className="text-sm text-gray-400 font-normal">/ {data.toolsProgress.length}</span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#09D1C7]/20 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full bg-[#09D1C7]"></div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-[#09D1C7]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#09D1C7] rounded-full"
                  style={{
                    width: `${
                      (data.toolsProgress.filter((t) =>
                        data.labsProgress.find(
                          (lp) => lp.toolName === t.name && lp.labs.some((l) => l.questionsCompleted > 0),
                        ),
                      ).length /
                        data.toolsProgress.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#80EE98]/20 to-[#80EE98]/5 rounded-xl p-4 border border-[#80EE98]/20 backdrop-blur-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-400 text-sm">Labs Completed</h3>
                  <p className="text-2xl font-bold text-white mt-1">
                    {data.labsProgress.reduce(
                      (sum, tool) => sum + tool.labs.filter((lab) => lab.completion === 100).length,
                      0,
                    )}
                    <span className="text-sm text-gray-400 font-normal">
                      / {data.labsProgress.reduce((sum, tool) => sum + tool.labs.length, 0)}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#80EE98]/20 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full bg-[#80EE98]"></div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-[#80EE98]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#80EE98] rounded-full"
                  style={{
                    width: `${
                      (data.labsProgress.reduce(
                        (sum, tool) => sum + tool.labs.filter((lab) => lab.completion === 100).length,
                        0,
                      ) /
                        data.labsProgress.reduce((sum, tool) => sum + tool.labs.length, 0)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/20 to-white/5 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-400 text-sm">Questions Answered</h3>
                  <p className="text-2xl font-bold text-white mt-1">
                    {data.labsProgress.reduce(
                      (sum, tool) => sum + tool.labs.reduce((labSum, lab) => labSum + lab.questionsCompleted, 0),
                      0,
                    )}
                    <span className="text-sm text-gray-400 font-normal">
                      /{" "}
                      {data.labsProgress.reduce(
                        (sum, tool) => sum + tool.labs.reduce((labSum, lab) => labSum + lab.totalQuestions, 0),
                        0,
                      )}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <div className="h-5 w-5 rounded-full bg-white"></div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${overallCompletion}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Tools Progress Row - Bar Chart and Visual Cards side by side */}
          <div className="col-span-12 grid grid-cols-12 gap-6">
            {/* Tools Progress Overview - Bar Chart */}
            <div className="col-span-12 lg:col-span-7 rounded-xl p-6 border border-[#09D1C7]/20 bg-[#0F172A]/80 backdrop-blur-sm shadow-lg shadow-[#09D1C7]/5">
              <h2 className="text-xl font-semibold mb-6 text-[#09D1C7] flex items-center">
                <span className="inline-block h-4 w-4 rounded-full bg-[#09D1C7] mr-2"></span>
                Tools Progress
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toolsProgressData}>
                    <defs>
                      <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="labsCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.secondary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.secondary} stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="totalLabsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.tertiary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.tertiary} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Legend
                      wrapperStyle={{ paddingTop: "10px" }}
                      formatter={(value) => <span style={{ color: "rgba(255,255,255,0.8)" }}>{value}</span>}
                    />
                    <Bar
                      dataKey="progress"
                      fill="url(#progressGradient)"
                      name="Completion %"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="labsCompleted"
                      fill="url(#labsCompletedGradient)"
                      name="Labs Completed"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="totalLabs"
                      fill="url(#totalLabsGradient)"
                      name="Total Labs"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tools Progress Visual Cards */}
            <div className="col-span-12 lg:col-span-5 rounded-xl p-6 border border-[#80EE98]/20 bg-[#0F172A]/80 backdrop-blur-sm shadow-lg shadow-[#80EE98]/5">
              <h2 className="text-xl font-semibold mb-6 text-[#80EE98] flex items-center">
                <span className="inline-block h-4 w-4 rounded-full bg-[#80EE98] mr-2"></span>
                Tools Progress
              </h2>
              <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#80EE98]/20 scrollbar-track-transparent">
                {toolsProgressData.map((tool, index) => (
                  <div
                    key={tool.name}
                    className={`${getThemeColor(index).bgLight} backdrop-blur-sm rounded-xl p-4 border ${
                      getThemeColor(index).border
                    } transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-white">{tool.name}</h3>
                      <span className={getThemeColor(index).primary}>{Math.round(tool.progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${tool.progress}%`,
                          background: index % 3 === 0 ? "#09D1C7" : index % 3 === 1 ? "#80EE98" : "#FFFFFF",
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-400 flex justify-between">
                      <span>
                        Labs: {tool.labsCompleted}/{tool.totalLabs}
                      </span>
                      <span className={getThemeColor(index).primary}>
                        {tool.labsCompleted > 0
                          ? `${Math.round((tool.labsCompleted / tool.totalLabs) * 100)}% complete`
                          : "Not started"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lab Progress for Selected Tool */}
          <div className="col-span-12 lg:col-span-8 rounded-xl p-6 border border-[#09D1C7]/20 bg-[#0F172A]/80 backdrop-blur-sm shadow-lg shadow-[#09D1C7]/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-[#09D1C7] flex items-center">
                <span className="inline-block h-4 w-4 rounded-full bg-[#09D1C7] mr-2"></span>
                Lab Progress
              </h2>
              <select
                className="rounded-lg px-4 py-2 text-white border border-[#09D1C7]/30 bg-[#1E293B]/80 focus:outline-none focus:ring-2 focus:ring-[#09D1C7]/50 transition-all"
                value={selectedTool || ""}
                onChange={(e) => setSelectedTool(e.target.value)}
              >
                {data.toolsProgress.map((tool) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[300px]">
              {selectedToolData && selectedToolData.labs && selectedToolData.labs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedToolData.labs}>
                    <defs>
                      <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="questionsCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.secondary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.secondary} stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="totalQuestionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeColors.tertiary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={themeColors.tertiary} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: "rgba(255,255,255,0.7)" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                    />
                    <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Legend
                      wrapperStyle={{ paddingTop: "10px" }}
                      formatter={(value) => <span style={{ color: "rgba(255,255,255,0.8)" }}>{value}</span>}
                    />
                    <Bar
                      dataKey="completion"
                      fill="url(#completionGradient)"
                      name="Completion %"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="questionsCompleted"
                      fill="url(#questionsCompletedGradient)"
                      name="Completed Questions"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="totalQuestions"
                      fill="url(#totalQuestionsGradient)"
                      name="Total Questions"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No labs data available for this tool</p>
                </div>
              )}
            </div>
          </div>

          {/* Attempt Statistics */}
          <div className="col-span-12 lg:col-span-4 rounded-xl p-6 border border-[#80EE98]/20 bg-[#0F172A]/80 backdrop-blur-sm shadow-lg shadow-[#80EE98]/5">
            <div className="flex flex-col gap-4 mb-6">
              <h2 className="text-xl font-semibold text-[#80EE98] flex items-center">
                <span className="inline-block h-4 w-4 rounded-full bg-[#80EE98] mr-2"></span>
                Attempt Statistics
              </h2>
              <div className="flex flex-col gap-2">
                <select
                  className="rounded-lg px-4 py-2 text-white border border-[#80EE98]/30 bg-[#1E293B]/80 focus:outline-none focus:ring-2 focus:ring-[#80EE98]/50 transition-all w-full"
                  value={selectedLab || ""}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  disabled={!selectedToolData?.labs?.length}
                >
                  {selectedToolData?.labs?.map((lab) => (
                    <option key={lab.name} value={lab.name}>
                      {lab.name}
                    </option>
                  )) || <option>No labs available</option>}
                </select>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attemptChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    animationDuration={1500}
                    animationBegin={300}
                  >
                    {themeColors.chartColors.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} stroke={color} strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    formatter={(value) => <span style={{ color: "rgba(255,255,255,0.8)" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 space-y-2">
              <div className="bg-[#80EE98]/10 rounded-lg p-3 border border-[#80EE98]/20">
                <p className="text-[#80EE98] font-medium">
                  Average Attempts:{" "}
                  {typeof (selectedLabData?.attemptStats?.averageAttempts || data.attemptStats.averageAttempts) ===
                  "number"
                    ? (selectedLabData?.attemptStats?.averageAttempts || data.attemptStats.averageAttempts).toFixed(2)
                    : "0.00"}
                </p>
              </div>
              <div className="bg-[#09D1C7]/10 rounded-lg p-3 border border-[#09D1C7]/20">
                <p className="text-[#09D1C7] font-medium">Total Questions: {selectedLabData?.totalQuestions || 0}</p>
              </div>
            </div>
          </div>

          {/* Overall Progress - Tool Question Completion */}
          <div className="col-span-12 rounded-xl p-6 border border-white/20 bg-[#0F172A]/80 backdrop-blur-sm shadow-lg shadow-white/5">
            <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
              <span className="inline-block h-4 w-4 rounded-full bg-white mr-2"></span>
              Overall Progress by Tool
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={toolsQuestionData}>
                  <defs>
                    <linearGradient id="questionsCompletedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColors.primary} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={themeColors.primary} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="totalQuestionsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColors.tertiary} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={themeColors.tertiary} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="completionPercentageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={themeColors.secondary} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={themeColors.secondary} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: "rgba(255,255,255,0.7)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: "rgba(255,255,255,0.7)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  />
                  <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px" }}
                    formatter={(value) => <span style={{ color: "rgba(255,255,255,0.8)" }}>{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="questionsCompleted"
                    stroke={themeColors.primary}
                    fill="url(#questionsCompletedAreaGradient)"
                    name="Questions Completed"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalQuestions"
                    stroke={themeColors.tertiary}
                    fill="url(#totalQuestionsAreaGradient)"
                    name="Total Questions"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionPercentage"
                    stroke={themeColors.secondary}
                    fill="url(#completionPercentageGradient)"
                    name="Completion %"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="bg-gradient-to-r from-[#09D1C7]/20 to-[#80EE98]/20 rounded-xl p-4 border border-[#09D1C7]/20 backdrop-blur-sm max-w-md w-full">
                <div className="text-center">
                  <p className="text-gray-400 mb-1">Overall Completion</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#09D1C7] to-[#80EE98] bg-clip-text text-transparent">
                    {overallCompletion}%
                  </p>
                  <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${overallCompletion}%`,
                        background: "linear-gradient(90deg, #09D1C7 0%, #80EE98 100%)",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
