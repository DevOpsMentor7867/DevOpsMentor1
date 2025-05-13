import { Check } from "lucide-react";

export default function PricingCard({ plan, price, description, features, isPremium, period, onSelectPlan }) {
  const yearlyMultiplier = 10
  const actualPrice = period === "yearly" ? price * yearlyMultiplier : price

  return (
    <div
      className={`
      relative p-6 rounded-xl backdrop-blur-sm transition-all duration-300 overflow-hidden  
      ${
        isPremium
          ? "bg-[#09D1C7]/10 border-2 border-[#09D1C7]/20 "
          : "bg-[#1A202C]/50 border border-[#09D1C7]/10 hover:bg-[#09D1C7]/5"
      }
    `}
    >
      <h3 className={`text-2xl font-bold mb-2 ${isPremium ? "text-[#09D1C7]" : "text-white"}`}>{plan}</h3>
      <p className="text-gray-400 mb-6">{description}</p>

      <div className="flex items-baseline mb-6">
        <span className="text-5xl font-bold text-white">{actualPrice}</span>
        <span className="text-gray-400 ml-2">{period}</span>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-300">
            <Check className="w-5 h-5 mr-3 text-[#09D1C7]" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(plan, actualPrice, description)}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-all
          ${
            isPremium
              ? "bg-[#09D1C7] text-[#1A202C] hover:bg-[#09D1C7]/90"
              : "bg-[#1A202C] text-white border border-[#09D1C7]/20 hover:bg-[#09D1C7]/10"
          }
        `}
      >
        Choose Plan
      </button>
    </div>
  )
}

