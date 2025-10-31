import { Routes, Route } from "react-router-dom";
import "./App.css";
import TrackDetail from "./components/TrackDetail";
import MainChart from "./components/MainChart";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainChart />} />
      <Route path="/track/:genre/:title/:artist" element={<TrackDetail />} />
    </Routes>
  );
}