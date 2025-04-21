import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const syringeLabel = "syringe";
const infectiousWastes = ["gloves", "head-cap", "disposable-mask"];

function ThrowWaste() {
  const [status, setStatus] = useState("Waiting for Waste Detection...");
  const [wasteType, setWasteType] = useState(null);
  const [frameUrl, setFrameUrl] = useState("");
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const isSyringe = wasteType === syringeLabel;
  const isInfectious = wasteType === "infectious";

  useEffect(() => {
    const socket = io("http://172.20.10.5:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected to server, waiting for detection...");
    });

    socket.on("server_message", (data) => {
      const label = data?.label?.trim()?.toLowerCase();

      switch (data.type) {
        case "status":
          setStatus(data.message);
          break;

        case "detection":
          if (label === "none") {
            setWasteType(null);
            setStatus("No detection found.");
          } else if (label === syringeLabel) {
            setWasteType(syringeLabel);
            setStatus("Syringe Detected!");
          } else if (infectiousWastes.includes(label)) {
            setWasteType("infectious");
            setStatus("Infectious Waste Detected!");
          } else {
            setWasteType(null);
            setStatus("Other Waste Type Detected \n THROW IN THE OTHER BIN!");
          }
          break;

        case "frame":
          setFrameUrl(data.image);
          break;

        case "error":
          setStatus(`Error: ${data.message}`);
          break;

        default:
          console.warn("Unknown message type:", data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAction = (action) => {
    setStatus(`${action} in Progress...`);
    setTimeout(() => setStatus(`${action} Completed.`), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/images/background.png')" }}>
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <h1 className="text-5xl font-bold">
          S3YF <span className="text-blue-300 border-b-4 border-blue-300 pb-2">BIN</span>
        </h1>
        <h2 className="text-3xl mt-4">THROW WASTE</h2>

        <p className="text-2xl font-bold mt-4">{status}</p>

        {frameUrl ? (
          <img
            src={frameUrl}
            className="w-full max-w-lg border-2 border-blue-500 mt-4"
            alt="YOLO Annotated Frame"
          />
        ) : (
          <p className="text-lg mt-4">Waiting for camera stream...</p>
        )}

        <button
          onClick={() => handleAction("Throwing Waste")}
          className={`${
            wasteType
              ? isSyringe
                ? "bg-orange-600"
                : isInfectious
                ? "bg-red-600"
                : "bg-yellow-500"
              : "bg-gray-500 cursor-not-allowed"
          } text-white font-bold py-3 px-8 rounded-full shadow-lg mt-6`}
          disabled={!wasteType}
        >
          {wasteType
            ? `THROW ${isInfectious ? "INFECTIOUS WASTE" : "SYRINGE"}`
            : "Waiting for Detection..."}
        </button>

        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={() => handleAction("Sanitization")}
            className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg"
          >
            SANITIZE
          </button>
          <button
            onClick={() => handleAction("Sterilization")}
            className="bg-purple-400 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg"
          >
            STERILIZE
          </button>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 bg-green-600 hover:bg-green-800 text-white font-bold py-3 px-10 rounded-full shadow-md"
        >
          BACK
        </button>
      </div>
    </div>
  );
}

export default ThrowWaste;
