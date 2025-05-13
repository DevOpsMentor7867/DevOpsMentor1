  import { useNavigate } from "react-router-dom"
import { Check } from "lucide-react"
import { Button } from "../../UI/button"
import { Card } from "../../UI/Card"
import { CardContent } from "../../UI/CardContent"

const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Ideal for beginners exploring DevOps",
    features: [
      "Access to Git, Linux, and Docker modules",
      "Basic hands-on labs",
      "Community support",
      "Limited progress tracking",
      "Dummy package included",
      "Another free dummy package",
    ],
  },
  {
    name: "Premium",
    price: "$50",
    description: "Best for individuals serious about DevOps",
    features: [
      "Full access to all DevOps modules",
      "Advanced hands-on labs",
      "Personalized dashboard",
      "AI-powered query assistant",
      "Progress tracking system",
      "Priority support",
    ],
  },
  {
    name: "Standard",
    price: "$25",
    description: "Tailored for teams and organizations",
    features: [
      "Team collaboration features",
      "Custom lab environments",
      "Role-based access control",
      "Performance analytics",
      "Dedicated account manager",
      "24/7 premium support",
    ],
  },
]

export default function PricingPage() {
  const navigate = useNavigate()

  const handleChoosePlan = (plan) => {
    navigate("/checkout", { state: { plan } })
  }

  return (
    <div className="min-h-screen bg-[#1A202C] p-8">
      <div className="relative">
        <div className="absolute inset-0 opacity-5" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-[#80EE98] text-5xl font-bold mb-4">Best Plans For You!</h1>
            <p className="text-[#09D1C7] text-xl">We have several plans to showcase your business.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-[#1A202C]/50 border-[#09D1C7]/20 hover:bg-[#09D1C7]/5 transition-colors duration-300`}
              >
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                  <p className="text-[#09D1C7]/80 mb-4">{plan.description}</p>
                  <div className="text-4xl font-bold text-[#80EE98] mb-6">{plan.price}</div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-[#80EE98] mr-2 shrink-0" />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleChoosePlan(plan)}
                    className="w-full bg-gradient-to-r from-[#09D1C7] to-[#80EE98] text-[#1A202C] hover:from-[#80EE98] hover:to-[#09D1C7] transition-all duration-300 font-medium"
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

