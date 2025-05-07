import { useEffect, useState } from "react";
import { BG_BLACK, DARK_PURPLE, PINK, PURPLE } from "./constants";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { formatBytes } from "./utils";
import ProgressBar from "@ramonak/react-progress-bar";
import CountUp from "react-countup";

function App() {
  const [stats, setStats] = useState({ cpuUsage: 0, usedMem: 0, totalMem: 1 });
  const [diskInfo, setDiskInfo] = useState({ total: 0, used: 0, available: 0 });
  const [fileCounts, setFileCounts] = useState({
    Documents: 0,
    Downloads: 0,
    Pictures: 0,
    Music: 0,
  });
  const [sysInfo, setSysInfo] = useState(null);

  // System Info
  useEffect(() => {
    const fetchSystemInfo = async () => {
      const data = await window.ipcRenderer.invoke("get-system-info");
      setSysInfo(data);
    };
    fetchSystemInfo();
  }, []);

  // Disk Info
  useEffect(() => {
    const getDisk = async () => {
      try {
        const data = await window.ipcRenderer.invoke("get-disk-info");
        setDiskInfo(data);
      } catch (error) {
        console.error("Failed to fetch disk info", error);
      }
    };
    getDisk();
  }, []);

  // CPU + Memory
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await window.ipcRenderer.invoke("get-system-stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // File Counts
  useEffect(() => {
    const getFileCounts = async () => {
      try {
        const counts = await window.ipcRenderer.invoke(
          "get-folder-file-counts"
        );
        setFileCounts(counts);
      } catch (error) {
        console.error("Error fetching file counts:", error);
      }
    };
    getFileCounts();
  }, []);

  const memPercent = (stats.usedMem / stats.totalMem) * 100;
  const diskSpace = ((diskInfo.used / diskInfo.total) * 100).toFixed(1);

  return (
    <div
      className="w-screen min-h-screen text-white p-6 pb-12 overflow-y-auto"
      style={{ backgroundColor: BG_BLACK }}
    >
      {/* Top Section: System Info & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12 mt-8">
        {/* System Info Box */}
        <div className="bg-[#1f2937] p-6 rounded-xl shadow-md h-full flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-4 text-center">System Info</h2>
          {sysInfo ? (
            <div className="space-y-2 text-gray-300 text-sm">
              <p>
                OS: <span className="font-bold">{sysInfo.os}</span>
              </p>
              <p>
                Kernel: <span className="font-bold">{sysInfo.linuxKernel}</span>
              </p>
              <p>
                Cinnamon Version:{" "}
                <span className="font-bold">{sysInfo.cinnamonVersion}</span>
              </p>
              <p>
                CPU: <span className="font-bold">{sysInfo.cpu}</span>
              </p>
              <p>
                GPU: <span className="font-bold">{sysInfo.graphics}</span>
              </p>
              <p>
                Total Memory:{" "}
                <span className="font-bold">
                  {formatBytes(sysInfo.totalMem)} GB
                </span>
              </p>
            </div>
          ) : (
            <p>Loading system info...</p>
          )}
        </div>

        {/* CPU, Memory & Disk Usage */}
        <div className="flex flex-col justify-between gap-10 h-full">
          {/* Memory & CPU Usage Side-by-Side */}
          <div className="grid grid-cols-2 gap-6 justify-items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-52 h-52">
                <CircularProgressbar
                  value={memPercent}
                  text={`${memPercent.toFixed(0)}%`}
                  styles={buildStyles({
                    pathColor: PINK,
                    textColor: "#e5e7eb",
                    trailColor: DARK_PURPLE,
                  })}
                />
              </div>
              <p className="text-gray-300 text-sm">
                Memory Usage: {memPercent.toFixed(2)}%
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-52 h-52">
                <CircularProgressbar
                  value={stats.cpuUsage}
                  text={`${stats.cpuUsage.toFixed(0)}%`}
                  styles={buildStyles({
                    pathColor: "#10b981",
                    textColor: "#e5e7eb",
                    trailColor: "#1f2937",
                  })}
                />
              </div>
              <p className="text-gray-300 text-sm">
                CPU Usage: {stats.cpuUsage.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="mt-4 px-4">
            <ProgressBar
              bgColor={PINK}
              baseBgColor={PURPLE}
              completed={Math.round(parseFloat(diskSpace))}
              maxCompleted={100}
              height="30px"
              labelColor="#fff"
              animateOnRender
              labelAlignment="center"
            />
            <p className="text-gray-400 text-sm text-center mt-2">
              Disk Usage: {diskSpace}% | Total: {formatBytes(diskInfo.total)} GB
              | Free: {formatBytes(diskInfo.available)} GB
            </p>
          </div>
        </div>
      </div>

      {/* File Counts Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {[
          { label: "Downloads", value: fileCounts.Downloads },
          { label: "Documents", value: fileCounts.Documents },
          { label: "Pictures", value: fileCounts.Pictures },
          { label: "Music", value: fileCounts.Music },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border-2 border-[#F7374F] shadow-lg rounded-2xl p-10 flex flex-col items-center justify-center h-44 hover:scale-105 transition-transform duration-300"
          >
            <p className="text-gray-400 text-sm mb-2 tracking-wide">{label}</p>
            <h1 className="text-4xl font-bold text-white">
              <CountUp end={value} duration={2} />
            </h1>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
