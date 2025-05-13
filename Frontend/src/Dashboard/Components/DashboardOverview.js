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
} from "recharts"
import axios from "axios"
import { useAuthContext } from "../../Context/AuthContext"

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

// Enhanced theme colors with vibrant gradients
const themeColors = {
  primary: "#09D1C7", // Cyan
  secondary: "#80EE98", // Green
  tertiary: "#845EF7", // Purple
  accent: "#FF6B6B", // Red accent
  background: "#121826", // Dark blue-gray
  cardBg: "rgba(16, 23, 36, 0.7)", // Slightly transparent dark blue
  chartColors: ["#09D1C7", "#80EE98", "#845EF7"],
  gradients: {
    primary: "linear-gradient(135deg, #09D1C7 0%, #80EE98 100%)",
    secondary: "linear-gradient(135deg, #845EF7 0%, #09D1C7 100%)",
    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    card: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)",
  },
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

  const navigate = useNavigate()

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
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        style={{ background: themeColors.gradients.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            style={{ borderColor: themeColors.primary }}
          ></div>
          <p className="text-primary" style={{ color: themeColors.primary }}>
            Loading progress data...
          </p>
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
  const getToolColor = (toolName) => {
    const colorMap = {
      Docker: "#09D1C7",
      Kubernetes: "#80EE98",
      Jenkins: "#845EF7",
      "Linux Foundation": "#FF6B6B",
      Terraform: "#FF9F45",
      Ansible: "#FF6B6B",
    }

    // Return mapped color or fallback to primary
    return colorMap[toolName] || themeColors.primary
  }

  return (
    <div
      className="min-h-screen p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]"
      style={{ background: themeColors.gradients.background }}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Tools Progress Row - Bar Chart and Visual Cards side by side */}
        <div className="col-span-12 grid grid-cols-12 gap-6">
          {/* Tools Progress Overview - Bar Chart */}
          <div
            className="col-span-7 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm"
            style={{ background: themeColors.gradients.card, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
          >
            <h2 className="text-xl font-semibold mb-6" style={{ color: themeColors.primary }}>
              Tools Progress
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolsProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(9, 209, 199, 0.3)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="progress" fill={themeColors.primary} name="Completion %" />
                  <Bar dataKey="labsCompleted" fill={themeColors.secondary} name="Labs Completed" stackId="a" />
                  <Bar dataKey="totalLabs" fill={themeColors.tertiary} name="Total Labs" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tools Progress Visual Cards */}
          <div
            className="col-span-5 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm"
            style={{ background: "rgba(132, 94, 247, 0.2)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
          >
            <h2 className="text-xl font-semibold mb-6" style={{ color: themeColors.primary }}>
              Tools Progress
            </h2>
            <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none] pr-2">
              {toolsProgressData.map((tool) => (
                <div key={tool.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    <span style={{ color: getToolColor(tool.name) }}>{Math.round(tool.progress)}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${tool.progress}%`,
                        backgroundColor: getToolColor(tool.name),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lab Progress for Selected Tool */}
        <div
          className="col-span-8 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm"
          style={{ background: themeColors.gradients.card, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: themeColors.primary }}>
              Lab Progress
            </h2>
            <select
              className="rounded-lg px-3 py-1 text-white border border-gray-600/50"
              style={{ background: "rgba(30, 41, 59, 0.8)" }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(9, 209, 199, 0.3)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completion" fill={themeColors.primary} name="Completion %" />
                  <Bar dataKey="questionsCompleted" fill={themeColors.secondary} name="Completed Questions" />
                  <Bar dataKey="totalQuestions" fill={themeColors.tertiary} name="Total Questions" />
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
        <div
          className="col-span-4 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm"
          style={{ background: themeColors.gradients.card, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
        >
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-xl font-semibold" style={{ color: themeColors.primary }}>
              Attempt Statistics
            </h2>
            <div className="flex flex-col gap-2">
              <select
                className="rounded-lg px-3 py-1 text-white border border-gray-600/50 w-full"
                style={{ background: "rgba(30, 41, 59, 0.8)" }}
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
                >
                  {themeColors.chartColors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(9, 209, 199, 0.3)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 text-gray-300">
            <p>
              Average Attempts: {selectedLabData?.attemptStats?.averageAttempts || data.attemptStats.averageAttempts}
            </p>
            <p>Total Questions: {selectedLabData?.totalQuestions || 0}</p>
          </div>
        </div>

        {/* Overall Progress - Tool Question Completion */}
        <div
          className="col-span-12 rounded-xl p-6 border border-gray-700/30 backdrop-blur-sm"
          style={{ background: themeColors.gradients.card, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: themeColors.primary }}>
            Overall Progress by Tool
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolsQuestionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(9, 209, 199, 0.3)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Legend />
                <Bar dataKey="questionsCompleted" fill={themeColors.primary} name="Questions Completed" />
                <Bar dataKey="totalQuestions" fill={themeColors.tertiary} name="Total Questions" />
                <Bar dataKey="completionPercentage" fill={themeColors.secondary} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-300">Overall Completion: {overallCompletion}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview

