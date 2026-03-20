import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import VideoChat from "./pages/VideoChat";
import AudioRecorder from "./components/AudioTest";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/call" element={<VideoChat />} />
        <Route path="/test" element={<AudioRecorder />} />
      </Routes>
    </Router>
  );
}