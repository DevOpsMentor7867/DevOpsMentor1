import { useNavigate } from "react-router-dom"
import PricingCard from "./PricingCard";

const plans = [
  {
    name: "Basic",
    price: "$10",
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

export default function Pricing() {
  const navigate = useNavigate()

  const handleSelectPlan = async (planName, price, description) => {
    navigate("/dashboard/checkout", {
      state: {
        plan: {
          name: planName,
          price,
          description,
          features: plans.find((p) => p.name === planName).features,
        },
      },
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img src="/homebgc.jpg" alt="Background" className="w-full h-full object-cover mt-12" />
        <div className="absolute backdrop-blur-lg inset-0 bg-black/70" />
      </div>

      <div className="md:p-8 pl-6 pr-10 pt-10 md:pt-5 backdrop-blur-sm">
        <div className="p-4 md:p-6 md:pt-3 border-gray-400 bg-white/10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gtb">Best Plans For You!</h2>
          <p className="text-base md:text-lg text-btg">We have several plans to showcase your business.</p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.name}
                plan={plan.name}
                price={plan.price}
                description={plan.description}
                features={plan.features}
                isPremium={plan.name === "Premium"}
                onSelectPlan={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

