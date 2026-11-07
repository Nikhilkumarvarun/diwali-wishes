import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import Scene from "./Scene";
import { dev, wish } from "./config";

export default function App() {
  const [lit, setLit] = useState(false);
  const [label, setLabel] = useState("Share this wish");
  const url = location.href.split(/[?#]/)[0];

  const light = () => {
    setLit(true);
    window.DeviceOrientationEvent?.requestPermission?.()?.catch(() => {}); // iPhone tilt permission
  };
  const share = async () => {
    const d = {
      title: "Happy Diwali 🪔",
      text: "Wishing you a Diwali full of light ✨",
      url,
    };
    try {
      if (navigator.share) await navigator.share(d);
      else {
        await navigator.clipboard.writeText(url);
        setLabel("Link copied");
      }
    } catch {}
  };
  const whatsapp = () =>
    open(
      "https://wa.me/?text=" +
        encodeURIComponent(
          "Happy Diwali! 🪔✨ I lit a little diya for you: " + url,
        ),
      "_blank",
      "noopener",
    );

  return (
    <div className={lit ? "app lit" : "app"}>
      <Canvas
        flat
        dpr={[1, 1.75]}
        camera={{ fov: 48, position: [0, 3.4, 9.5] }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <Scene lit={lit} onLight={light} />
      </Canvas>
      <main className="ui">
        <header>
          <h1 className="reveal" style={{ "--d": ".2s" }}>
            शुभ दीपावली
          </h1>
          <p className="sub reveal" style={{ "--d": ".5s" }}>
            Happy Diwali
          </p>
          <p className="msg reveal" style={{ "--d": ".8s" }}>
            {wish}
          </p>
        </header>
        <button className="start" onClick={light}>
          Light the diya
        </button>
        <div className="bot">
          <div className="row send reveal" style={{ "--d": "1.2s" }}>
            <button onClick={share}>{label}</button>
            <button className="alt" onClick={whatsapp}>
              Send on WhatsApp
            </button>
          </div>
          <footer className="dev">
            <span>
              Made with love by <b>{dev.name}</b>, {dev.role}
            </span>
            <nav>
              {dev.links.map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noopener noreferrer">
                  {l}
                </a>
              ))}
            </nav>
          </footer>
        </div>
      </main>
    </div>
  );
}
