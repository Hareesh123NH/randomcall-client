import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import VideoChat from "./pages/VideoChat";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/call" element={<VideoChat />} />
      </Routes>
    </Router>
  );
}