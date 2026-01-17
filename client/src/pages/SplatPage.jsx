import { useNavigate, useLocation } from "react-router-dom";
import SplatViewer from "../components/SplatViewer";
import { ArrowLeft } from "lucide-react";

export default function SplatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Use URL passed from state, or fallback to default
  const splatURL =
    location.state?.splatUrl ||
    "https://pub-f5270a1d5aa2439ca1077ffd1882ef75.r2.dev/sync-6ae2382c-ad8c-4d51-91be-f54b7ef42892-e1_2.ply";
  const description =
    location.state?.description || "Interacting with Gaussian Splat";

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          color: "white",
          backdropFilter: "blur(5px)",
        }}
      >
        <ArrowLeft size={24} />
      </button>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          color: "white",
          background: "rgba(0, 0, 0, 0.5)",
          padding: "10px 20px",
          borderRadius: "20px",
          backdropFilter: "blur(5px)",
          pointerEvents: "none",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Gaussian Splat Viewer</h2>
        <p style={{ margin: "5px 0 0 0", opacity: 0.8, fontSize: "0.9rem" }}>
          {description}
        </p>
      </div>

      <SplatViewer url={splatURL} />
    </div>
  );
}
