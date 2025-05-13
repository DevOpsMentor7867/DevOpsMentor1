"use client";

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { getNames } from "country-list";
import { useAuthContext } from "../../../API/UseAuthContext";

const countries = getNames();

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = location.state || { plan: null };
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();

  if (!plan) {
    navigate("/dashboard/pricing");
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    let redirectUrl = "";
    switch (plan.name) {
      case "Premium":
        redirectUrl = "https://buy.stripe.com/test_28EbJ3coe5DWaEl5lQ1gs00";
        break;
      case "Standard":
        redirectUrl = "https://buy.stripe.com/test_28E4gB87Y4zS4fX15A1gs01";
        break;
      case "Basic":
        redirectUrl = "https://buy.stripe.com/test_aFafZjewm0jCcMtaGa1gs02";
        break;
      default:
        console.error("Invalid plan name");
        setLoading(false);
        return;
    }

    window.open(redirectUrl, "_blank");

  };

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute backdrop-blur-lg inset-0 bg-black/70" />
      </div>

      <div className="relative p-8 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <button
            onClick={() => navigate("/dashboard/pricing")}
            className="mb-8 text-[#09D1C7] hover:text-white hover:bg-[#09D1C7]/20 px-4 py-2 rounded-lg flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </button>

          <form onSubmit={handleSubmit}>
            <div className="bg-[#1A202C]/50 border border-[#09D1C7]/20 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-4">
                Order Summary
              </h2>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#09D1C7]">
                    {plan.name} Plan
                  </h3>
                  <p className="text-gray-400">{plan.description}</p>
                </div>
                <span className="text-2xl font-bold text-[#09D1C7]">
                  {plan.price}
                </span>
              </div>

              <div className="border-t border-[#09D1C7]/20 pt-4 mb-6">
                <h4 className="text-white font-medium mb-2">
                  Included Features:
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-[#09D1C7] mr-2 shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-medium transition-all bg-[#09D1C7] text-[#1A202C] hover:bg-[#09D1C7]/90 disabled:opacity-50"
              >
                {loading ? "Processing..." : `Pay ${plan.price}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
