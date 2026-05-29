import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./App.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // 🎤 Voice hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // 🎤 Auto analyze after speech ends
  useEffect(() => {
    if (!listening && transcript) {
      setText(transcript);
      analyzeText(transcript);
      resetTranscript();
    }
  }, [listening]);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎤 Start mic
  const startVoice = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Browser not supported");
      return;
    }
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  // 🔊 FEMALE VOICE
  const speakResponse = (msg) => {
    const speech = new SpeechSynthesisUtterance(msg);

    const voices = window.speechSynthesis.getVoices();
    const female = voices.find(v =>
      v.name.toLowerCase().includes("female") ||
      v.name.toLowerCase().includes("zira") ||
      v.name.toLowerCase().includes("samantha") ||
      v.name.toLowerCase().includes("google uk english female")
    );

    if (female) speech.voice = female;

    speech.pitch = 1.2;
    speech.rate = 0.95;
    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
  };

  // 🧠 AI ANALYSIS
  const analyzeText = async (inputText) => {
    if (!inputText.trim()) return;

    setLoading(true);

    const userMsg = {
      type: "user",
      text: inputText,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", {
        text: inputText
      });

      const aiMsg = {
        type: "ai",
        ...res.data,
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMsg]);

      // 🔊 SPEAK RESULT
      if (aiMsg.prediction === "SUICIDE RISK") {
        speakResponse("I am here for you. Please reach out to someone you trust.");
      } else {
        speakResponse("You seem safe. Stay positive and take care.");
      }

    } catch (e) {
      alert("Backend not connected");
    }

    setLoading(false);
    setText("");
  };

  // 📊 CHART DATA
  const riskCount = messages.filter(m => m.prediction === "SUICIDE RISK").length;
  const safeCount = messages.filter(m => m.prediction === "NON-RISK").length;

  const pieData = {
    labels: ["Risk", "Safe"],
    datasets: [
      {
        data: [riskCount, safeCount],
        backgroundColor: ["#ef4444", "#22c55e"]
      }
    ]
  };

  const barData = {
    labels: messages.filter(m=>m.type==="ai").map((_,i)=>`Msg ${i+1}`),
    datasets: [
      {
        label: "Confidence",
        data: messages.filter(m=>m.type==="ai").map(m=>m.confidence),
        backgroundColor: "#3b82f6"
      }
    ]
  };

  return (
    <div style={{
      display:"flex",
      height:"100vh",
      background:"#020617",
      color:"white",
      fontFamily:"Arial"
    }}>

      {/* CHAT */}
      <div style={{width:"70%", padding:"30px"}}>
        <h1>🤖 Early Suicide Risk Detection</h1>

        <div style={{height:"70vh", overflowY:"auto"}}>
          {messages.map((m,i)=>(

            <div key={i} style={{marginTop:"20px"}}>

              {m.type==="user" && (
                <div style={{textAlign:"right"}}>
                  <div style={{
                    display:"inline-block",
                    background:"#2563eb",
                    padding:"12px",
                    borderRadius:"10px"
                  }}>
                    {m.text}
                    <div style={{fontSize:"12px"}}>{m.time}</div>
                  </div>
                </div>
              )}

              {m.type==="ai" && (
                <div style={{
                  background:"#0f172a",
                  padding:"15px",
                  borderRadius:"10px",
                  width:"350px"
                }}>
                  <b style={{
                    color: m.prediction==="SUICIDE RISK"?"#ef4444":"#22c55e"
                  }}>
                    {m.prediction}
                  </b>

                  <div>Confidence: {m.confidence.toFixed(2)}</div>

                  <div style={{
                    height:"8px",
                    background:"#334155",
                    marginTop:"8px",
                    borderRadius:"10px"
                  }}>
                    <div style={{
                      width:`${m.confidence*100}%`,
                      height:"100%",
                      background:m.prediction==="SUICIDE RISK"?"red":"green"
                    }}/>
                  </div>

                  {m.prediction==="SUICIDE RISK" && (
                    <div style={{
                      background:"#7f1d1d",
                      padding:"10px",
                      marginTop:"10px",
                      borderRadius:"8px"
                    }}>
                      ⚠ I'm here for you  
                      <br/>
                      India Helpline: 1800-599-0019
                    </div>
                  )}

                  <div style={{fontSize:"12px", marginTop:"5px"}}>{m.time}</div>
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div style={{marginTop:"20px", color:"#60a5fa"}}>
              🤖 AI analyzing...
            </div>
          )}

          {/* AUTO SCROLL TARGET */}
          <div ref={chatEndRef}></div>

        </div>

        {/* INPUT */}
        <textarea
          value={text}
          onChange={(e)=>setText(e.target.value)}
          rows="3"
          style={{
            width:"100%",
            marginTop:"20px",
            padding:"12px",
            background:"#1e293b",
            color:"white",
            border:"none",
            borderRadius:"8px"
          }}
        />

        <div style={{marginTop:"10px"}}>
          <button onClick={startVoice}
            style={{background:"#10b981",padding:"10px 15px",marginRight:"10px"}}>
            🎤 Speak
          </button>

          <button onClick={()=>analyzeText(text)}
            style={{background:"#2563eb",padding:"10px 20px"}}>
            Analyze
          </button>
        </div>

        {listening && <p>🎤 Listening...</p>}
      </div>

      {/* ANALYTICS */}
      <div style={{width:"30%", padding:"20px"}}>
        <h2>Analytics</h2>
        <Pie data={pieData}/>
        <Bar data={barData}/>
      </div>

    </div>
  );
}

export default App;