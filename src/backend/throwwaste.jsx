import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const socket = io("http://192.168.1.25:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server");
      setStatus("Connected to server, waiting for detection...");
    });

    socket.on("server_message", (data) => {
      console.log("Received message:", data);

      switch (data.type) {
        case "status":
          setStatus(data.message);
          break;

        case "detection":
          const label = data.label ? data.label.trim().toLowerCase() : "none";
          console.log("Detected label:", label); // Debug logging
          
          if (label === "none") {
            setWasteType(null);
            setStatus("No waste detected. Please place waste in front of camera.");
          } else if (label === syringeLabel) {
            setWasteType(syringeLabel);
            setStatus("Syringe Detected! Please dispose in sharps container.");
          } else if (infectiousWastes.includes(label)) {
            setWasteType("infectious");
            setStatus(`Infectious Waste (${label}) Detected! Please dispose properly.`);
          } else {
            setWasteType("other");
            setStatus(`Other Waste Type (${label}) Detected. THROW IN THE OTHER BIN!`);
          }
          break;

        case "frame":
          if (data.image) {
            setFrameUrl(data.image);
          }
          break;

        case "error":
          console.error("Error from server:", data.message);
          setStatus(`Error: ${data.message}`);
          break;

        default:
          console.warn("Unknown message type:", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setStatus("Disconnected from server. Please refresh.");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setStatus(`Connection error: ${error.message}`);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleAction = (action) => {
    setStatus(`${action} in Progress...`);
  
    if (action === "Sterilization" && socketRef.current) {
      socketRef.current.emit("STERILIZE");
    }
  
    if (action === "Sanitization" && socketRef.current) {
      socketRef.current.emit("SANITIZE"); 
    }
  
    // Reset waste type after action is taken
    if (action === "Throwing Waste") {
      setTimeout(() => {
        setWasteType(null);
        setStatus("Waiting for next waste detection...");
      }, 2000);
    } else {
      setTimeout(() => setStatus(`${action} Completed.`), 5000);
    }
  };

  const getButtonColor = () => {
    if (!wasteType) return "bg-gray-500 cursor-not-allowed";
    if (wasteType === syringeLabel) return "bg-orange-600";
    if (wasteType === "infectious") return "bg-red-600";
    return "bg-yellow-500";
  };

  const getButtonText = () => {
    if (!wasteType) return "Waiting for Detection...";
    if (wasteType === syringeLabel) return "THROW SYRINGE";
    if (wasteType === "infectious") return "THROW INFECTIOUS WASTE";
    return "THROW OTHER WASTE";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/images/background.png')" }}
    >
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
          className={`${getButtonColor()} text-white font-bold py-3 px-8 rounded-full shadow-lg mt-6`}
          disabled={!wasteType}
        >
          {getButtonText()}
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