import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import zxcvbn from "zxcvbn";
import { ResetPassword } from "../../API/ResetPassword";
import { Button } from "../UI/button";
import { Input } from "../UI/input";
import { Label } from "../UI/label";
import DoodleComp from "../Core/DoodleComp";

export default function ResetPasswordComponent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const isPasswordValid = (password) => {
    const regex =
      // eslint-disable-next-line
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]{8,}$/;
    return regex.test(password);
  };

  const getPasswordStrength = (password) => {
    const result = zxcvbn(password);
    return result.score;
  };

  const renderPasswordStrength = (password) => {
    const strength = getPasswordStrength(password);
    const width = `${(strength / 4) * 100}%`;
    let color = "bg-red-500";
    if (strength > 2) color = "bg-yellow-500";
    if (strength > 3) color = "bg-green-500";

    return (
      <div className="mt-1">
        <div className="h-1 w-full bg-gray-300 rounded-full">
          <div
            className={`h-1 ${color} rounded-full transition-all duration-300 ease-in-out`}
            style={{ width }}
          ></div>
        </div>
        <p className="text-xs mt-1 text-gray-400">
          {strength === 0 && "Very Weak"}
          {strength === 1 && "Weak"}
          {strength === 2 && "Fair"}
          {strength === 3 && "Good"}
          {strength === 4 && "Strong"}
        </p>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid(password)) {
      setResetStatus({
        success: false,
        message: "Password must meet all requirements",
      });
      return;
    }

    if (password !== confirmPassword) {
      setResetStatus({
        success: false,
        message: "Passwords do not match",
      });
      return;
    }

    setIsLoading(true);
    const { resetPassword } = ResetPassword();
    console.log("feee", token);
    const result = await resetPassword(token, password);
    setResetStatus(result);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative p-4 sm:p-6 md:p-8">
      <div className="fixed inset-0 z-0">
          <img
            src="/homebgc.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      <div className="flex-grow flex items-center justify-center mt-12 md:mt-0">
        <div className="w-full max-w-md p-4 sm:p-6 md:p-8 rounded-lg bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-xl relative z-10">
          <div className="text-center text-4xl mb-2 font-bold">
            <span className="text-btg z-10">DEV∞OPS Mentor</span>
          </div>

          <p className="text-sm text-gray-400 mb-4 mt-4 text-center">
            Enter a new password below to change your password
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-gtb">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="bg-white bg-opacity-20 text-white placeholder-gray-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#80EE98]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password && !isPasswordValid(password) && (
                <p className="text-red-500 text-sm mt-1">
                  Password must be at least 8 characters long and include
                  uppercase, lowercase, number, and special character
                </p>
              )}
              {password && renderPasswordStrength(password)}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gtb">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="bg-white bg-opacity-20 text-white placeholder-gray-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#80EE98]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {resetStatus && (
              <p
                className={`text-sm ${
                  resetStatus.success ? "text-green-500" : "text-red-500"
                }`}
              >
                {resetStatus.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98]"
              disabled={isLoading}
              onClick={isSuccess ? () => navigate("/login") : undefined}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Resetting Password...
                </div>
              ) : isSuccess ? (
                "Redirect to Login Page"
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </div>
      </div>
      <DoodleComp />
    </div>
  );
}
