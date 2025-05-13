import React, { useState, useEffect } from "react";
import { Button } from "../UI/button";
import { Input } from "../UI/input";
import { Label } from "../UI/label";
import { ArrowLeft, Eye, EyeOff, RefreshCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import zxcvbn from "zxcvbn";
import DoodleComp from "../Core/DoodleComp";
import LoadingSpinner from "../UI/LoadingSpinner";
import { RegisterUser } from "../../API/RegisterUser";
import { VerifyOTP } from "../../API/VerifyOTP";
import { LoginUser } from "../../API/LoginUser";
import { ForgotPassword } from "../../API/forgotPassword";

export default function AuthComponent() {
  // State variables
  const [activeForm, setActiveForm] = useState("login");
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState(null);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  // Hooks
  const { signup, RegisterError, RegisterCheck, timerReset } = RegisterUser();
  const { login, loginError } = LoginUser();
  const { PostSignup, VerifyotpError } = VerifyOTP();

  const clearInputs = () => {
    setPassword("");
    setConfirmPassword("");
    setOtp(["", "", "", "", "", ""]);
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Initiating Google sign in...");
      // Implement Google Sign In logic here
    } catch (error) {
      console.error("Google sign in error:", error);
    }
    clearInputs();
  };

  const toggleModal = () => {
    setShowSuccessPopup(!showSuccessPopup);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (activeForm === "signup") {
      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }
      await signup(email, password);
      setOtpError("");
      if (RegisterError == null) {
        console.log("REGCHECK", RegisterCheck)
        setIsLoading(false);
        setShowOTPDialog(true);
      }
      console.log("TIMER",timerReset )
      if(!timerReset) {
        setTimeLeft(120)
      }
    } else {
      await login(email, password);
      setIsLoading(false);
    }
    clearInputs();
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setOtpError("OTP must be 6 digits long and all fields must be filled.");
      setOtp(["", "", "", "", "", ""]);
    } else {
      setOtpError("");
      setIsLoading(true);
      const { success, error } = await PostSignup(email, otpValue);
      setIsLoading(false);

      if (success) {
        console.log("OTP verification successful:", success);
        setTimeLeft(120);
        setShowOTPDialog(false);
        setShowSuccessPopup(true);
        setActiveForm("login");
      } else if (error) {
        console.log("OTP verification failed:", error);
        setOtpError(error);
        setOtp(["", "", "", "", "", ""]);
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value.length === 1 && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const isEmailValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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



  // const formatTime = (seconds) => {
  //   const minutes = Math.floor(seconds / 60);
  //   const remainingSeconds = seconds % 60;
  //   return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  // };

  // Effects
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!isEmailValid(forgotPasswordEmail)) {
      setForgotPasswordStatus({
        success: false,
        message: "Please enter a valid email address",
      });
      return;
    }

    setIsForgotPasswordLoading(true);
    const { forgotPassword } = ForgotPassword();
    const result = await forgotPassword(forgotPasswordEmail);
    setForgotPasswordStatus(result);
    setIsForgotPasswordLoading(false);

    if (result.success) {
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setForgotPasswordStatus(null);
      }, 3000);
    }
  };

  // Render functions
  const renderForm = () => {
    switch (activeForm) {
      case "login":
        return (
          <>
            <div>
              <Label htmlFor="email" className="text-green-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 "
                // required
              />
              {email && !isEmailValid(email) && (
                <p className="text-red-500 text-sm mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password" className="text-green-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-white bg-opacity-20 text-white placeholder-gray-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 "
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
            </div>
            {loginError && (
              <p className="text-red-500 text-s mb-4">{loginError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-gtb hover:text-[#80EE98] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98]"
              disabled={!isEmailValid(email) || !password}
            >
              Log In
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className=" flex justify-center ">
                <span className="text-white text-lg">or </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </>
        );
      case "signup":
        return (
          <>
            <div>
              <Label htmlFor="email" className="text-gtb">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 "
                required
              />
              {email && !isEmailValid(email) && (
                <p className="text-red-500 text-sm mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password" className="text-gtb">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-white bg-opacity-20 text-white placeholder-gray-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 "
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
                  placeholder="Confirm your password"
                  className="bg-white bg-opacity-20 text-white placeholder-gray-300 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
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
            {RegisterError && (
              <p className="text-red-500 text-s mb-4">{RegisterError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98] "
              disabled={
                !isEmailValid(email) ||
                !isPasswordValid(password) ||
                password !== confirmPassword
              }
            >
              Sign Up
            </Button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="text-white text-lg">or </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col  overflow-hidden relative p-4 sm:p-6 md:p-8 ">
        <div className="fixed inset-0 z-0">
          <img
            src="/homebgc.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
        <Link
          to="/"
          className="absolute top-4 left-4 text-white hover:text-[#80EE98] transition-colors flex items-center text-lg z-10"
        >
          <ArrowLeft size={28} className="mr-2" />
          Go back
        </Link>
        {isLoading && <LoadingSpinner />}

        <div className="flex-grow flex items-center justify-center mt-12 md:mt-0">
          <div className="w-full max-w-md  p-4 sm:p-6 md:p-8 rounded-lg bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-xl relative z-10">
            <div className=" text-center text-4xl mb-2 font-bold  ">
              <span className="text-btg z-10">DEV∞OPS Mentor</span>
            </div>
            <h2 className="text-3xl text-center mb-6 text-btg">
              {activeForm === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <div className="relative w-full h-14 bg-gray-700 rounded-full p-1 mb-8">
              <div
                className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7]  hover:from-[#09D1C7] hover:to-[#80EE98] rounded-full transition-transform duration-300 ease-in-out ${
                  activeForm === "signup" ? "transform translate-x-full" : ""
                }`}
              ></div>
              <button
                className={`absolute top-0 left-0 w-1/2 h-full flex items-center justify-center font-semibold z-20 transition-colors duration-300 ${
                  activeForm === "login" ? "text-[#1A202C]" : "text-btg"
                }`}
                onClick={() => {
                  setActiveForm("login");
                }}
              >
                Log In
              </button>
              <button
                className={`absolute top-0 right-0 w-1/2 h-full flex items-center justify-center font-semibold z-20 transition-colors duration-300 ${
                  activeForm === "signup" ? "text-[#1A202C]" : "text-btg"
                }`}
                onClick={() => {
                  setActiveForm("signup");
                }}
              >
                Sign Up
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderForm()}
            </form>
          </div>
        </div>

        {showSuccessPopup && (
          <div
            id="successModal"
            className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-modal md:h-full"
          >
            <div className="relative p-4 w-full max-w-md h-full md:h-auto">
              <div className="relative p-4 text-center bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                <button
                  onClick={toggleModal}
                  className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 p-2 flex items-center justify-center mx-auto mb-3.5">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-green-500 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Success</span>
                </div>
                <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Registration Successful
                </p>
                <Button
                  onClick={toggleModal}
                  className=" bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {RegisterError
            ? null
            : showOTPDialog && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-20"
                >
                  <div className="bg-gray-800 p-8 rounded-lg shadow-2xl relative max-w-lg">
                    <button
                      onClick={() => {
                        setShowOTPDialog(false);
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    >
                      <ArrowLeft size={24} />
                    </button>
                    {RegisterError}
                    <h3 className="text-3xl font-bold mb-4 text-gtb">
                      Verify Your Account
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {RegisterCheck
                        ? `A one-time password was already sent to ${email}. Please check your email and enter the OTP below to complete your registration.`
                        : `We've sent a one-time password to ${email}. Please enter it below to complete your registration.`}
                    </p>
                    <div className="flex justify-between mb-6">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          className="w-12 h-12 text-center bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-red-500 text-s mb-4">{otpError}</p>
                    )}
                    {VerifyotpError && (
                      <p className="text-red-500 text-s mb-4">
                        {VerifyotpError}
                      </p>
                    )}

                    {/* <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        OTP Expires in: {formatTime(timeLeft)}
                      </span>
                      <button
                        onClick={retryOTP}
                        className="text-gtb transition-colors"
                      >
                        <RefreshCcw size={20} />
                      </button>
                    </div> */}

                    <Button
                      onClick={handleVerifyOTP}
                      className="w-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98] rounded-md mt-4 "
                    >
                      Verify OTP
                    </Button>
                  </div>
                </motion.div>
              )}
        </AnimatePresence>
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-20"
            >
              <div className="bg-gray-900 p-8 rounded-lg shadow-2xl relative max-w-md w-full mx-4">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setForgotPasswordStatus(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <h3 className="text-3xl font-bold mb-4 text-gtb">
                  Password Reset
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  To reset your password, enter the email address you use to
                  sign in to your account
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email" className="text-gtb">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isForgotPasswordLoading}
                    />
                  </div>

                  {forgotPasswordStatus && (
                    <p
                      className={`text-sm ${
                        forgotPasswordStatus.success
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {forgotPasswordStatus.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98]"
                    disabled={!forgotPasswordEmail || isForgotPasswordLoading}
                  >
                    {isForgotPasswordLoading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCcw size={20} className="animate-spin mr-2" />
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <DoodleComp />
      </div>
    </>
  );
}
