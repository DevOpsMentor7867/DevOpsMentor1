import React, { useEffect, useState } from "react";

const Doodle = ({ path, x, y, size, rotation }) => (
  <svg
    className="absolute animate-float opacity-40  transition-opacity"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      transform: `rotate(${rotation}deg)`,
    }}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d={path} />
  </svg>
);

const doodlePaths = [
  "M20 30 H80 V70 H20 V30 M20 75 H80 M45 75 H55", // Monitor
  "M50 20 C30 20 25 35 25 45 C25 55 35 65 50 65 C65 65 75 55 75 45 C75 35 70 20 50 20 M40 65 L40 80 L60 80 L60 65", // Light bulb
  "M20 20 L20 80 L80 80 M30 60 L45 40 L60 50 L75 30", // Chart
  "M50 25 L55 25 L57 35 L65 30 L70 35 L65 43 L75 50 L70 57 L65 65 L57 60 L55 70 L45 70 L43 60 L35 65 L30 57 L35 50 L25 43 L30 35 L35 30 L43 35 L45 25 Z", // Gear
  "M35 20 H65 V80 H35 V20 M45 25 H55", // Mobile device
  "M40 40 C60 40 60 60 40 60 C20 60 20 80 40 80 M45 30 V90", // Dollar sign
  "M30 50 C30 40 40 35 50 35 C60 35 65 40 70 45 C80 45 85 50 85 60 C85 70 75 75 65 75 C55 75 45 75 35 75 C25 75 15 70 15 60 C15 50 20 45 30 50", // Cloud
  "M25 40 H75 V70 H25 V40 M20 70 H80 L75 80 H25 L20 70", // Laptop
  "M20 80 L20 30 L35 30 L35 80 M40 80 L40 40 L55 40 L55 80 M60 80 L60 20 L75 20 L75 80", // Graph bars
];

export default function BusinessDoodles() {
  const [doodle, setDoodle] = useState(null);

  useEffect(() => {
    // Function to generate a new doodle with random properties
    const generateDoodle = () => ({
      path: doodlePaths[Math.floor(Math.random() * doodlePaths.length)],
      x: Math.random() * 70,
      y: Math.random() * 70,
      size: Math.random() * 30 + 90,
      rotation: Math.random() * 20 + 10,
    });

    // Set an initial doodle
    setDoodle(generateDoodle());

    // Set interval to change doodle every 2 seconds
    const intervalId = setInterval(() => {
      setDoodle(generateDoodle());
    }, 2000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
//     <div className="absolute inset-0 -z-10 opacity-10">
//     <img src="doodle.png" alt="Background Doodle" className="w-full h-full object-cover" />
//   </div>

    <div className="text-blue-100">
      {/* <img src="doodle.png" alt="" /> */}
      {doodle && <Doodle {...doodle} />}
    </div>
  );
}
