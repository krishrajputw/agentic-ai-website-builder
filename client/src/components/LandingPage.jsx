
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const features = [
  ["ϟ", "AI-Powered Generation", "Describe your idea and generate a complete website with modern code."],
  ["</>", "Full Code Access", "Edit your generated code whenever you want. You stay in control."],
  ["◎", "Live Preview", "See your website and review your changes in the workspace."],
  ["▣", "Responsive Design", "Build layouts designed to work across desktop, tablet and mobile."],
];

const steps = [
  ["01", "Describe Your Idea", "Tell WebGenie what you want to build, from a portfolio to a business website."],
  ["02", "Generate With AI", "Let AI turn your description into website code that you can customize."],
  ["03", "Edit & Preview", "Open your files, make changes, preview the result and save your project."],
];

function WorkspacePreview() {
  return (
    <div className="lp-workspace-wrap">
      <div className="lp-float lp-float-ai">✧ &nbsp; AI Powered</div>
      <div className="lp-float lp-float-code">〈/〉 &nbsp; No Coding Required</div>

      <div className="lp-workspace">
        <div className="lp-workspace-head">
          <b>✦ WebGenie</b>
          <div>
            <span>▣ Preview</span>
            <span>〈/〉 Code editor</span>
            <span className="lp-save">Save changes</span>
          </div>
        </div>

        <div className="lp-workspace-main">
          <aside className="lp-sidebar">
            <small>◈ Projects</small>
            {["My Website", "Portfolio", "Landing Page", "Business Site", "E-commerce"].map((x, i) => (
              <div className={i === 0 ? "lp-side-active" : ""} key={x}>
                <span>▧</span> {x}
              </div>
            ))}
            <small className="lp-new-project">＋ New Project</small>
          </aside>

          <div className="lp-code-panel">
            <div className="lp-panel-title">◈ src / App.jsx</div>
            <pre>
              <span>import</span> React <span>from</span> "react";{"\n"}
              <span>import</span> Hero <span>from</span> "./Hero";{"\n\n"}
              <span>function</span> App() {"{"}{"\n"}
              {"  "}return ({"\n"}
              {"    "}&lt;div className="website"&gt;{"\n"}
              {"      "}&lt;Hero /&gt;{"\n"}
              {"      "}&lt;Features /&gt;{"\n"}
              {"    "}&lt;/div&gt;{"\n"}
              {"  "});{"\n"}
              {"}"}{"\n\n"}
              <span>export default</span> App;
            </pre>
          </div>

          <div className="lp-site-preview">
            <div className="lp-browser-dots"><i /><i /><i /></div>
            <div className="lp-site-nav">
              <b>YourBrand</b>
              <small>Home　 About　 Services</small>
            </div>
            <div className="lp-site-hero">
              <div className="lp-mountain mountain-one" />
              <div className="lp-mountain mountain-two" />
              <h3>Build Amazing<br />Web Experiences</h3>
              <p>Modern. Fast. Responsive.</p>
              <span>Get Started →</span>
            </div>
            <div className="lp-site-bottom">
              <div>✧<small>Fast Performance</small></div>
              <div>▣<small>Responsive Design</small></div>
              <div>❋<small>Modern UI</small></div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-float lp-float-live">◎ &nbsp; Live Preview</div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const handleAuthButton = () => {
    if (localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
    } else {
      navigate("/login");
    }
  };

  const handleStartBuilding = () => {
  if (localStorage.getItem("token")) {
    navigate("/builder");
  } else {
    navigate("/login");
  }
};

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll(".lp-reveal");

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("lp-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  const scrollToHow = () => {
    document.getElementById("lp-how")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const scrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToShowcase = () => {
    document.querySelector(".lp-showcase")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const loginButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    minWidth: "100px",
    minHeight: "42px",
    padding: "11px 20px",
    border: "1px solid #ffbd88",
    borderRadius: "999px",
    background: "linear-gradient(110deg, #ffca94, #ff9850)",
    color: "#17100b",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    cursor: "pointer",
    visibility: "visible",
    opacity: 1,
    position: "relative",
    zIndex: 9999,
  };

  const authLabel = isLoggedIn ? "Logout" : "Login";

  return (
    <main className="webgenie-landing">
      <header className="lp-navbar">
        <div className="lp-nav-inner">
          <a className="lp-brand" href="#" onClick={scrollToTop}>
            <span>✦</span> WebG<span>enie</span>
          </a>

          <div className="lp-tagline">Ideas to Websites in Minutes</div>

          <div className="lp-nav-actions">
            <div className="lp-trial">
              ♔ &nbsp; 5 free generations per day (trial)
            </div>

            <button
              type="button"
              onClick={handleAuthButton}
              style={loginButtonStyle}
              aria-label={authLabel}
            >
              {authLabel}
            </button>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <div className="lp-badge">AI-Powered Website Builder</div>

            <h1>
              Turn Your Ideas Into <span>Beautiful Websites</span>
            </h1>

            <p className="lp-description">
              WebGenie is an AI-powered platform that helps you create
              modern, responsive websites in minutes. Just describe what
              you want, and let AI do the magic — no coding required!
            </p>

            <div className="lp-trial-box">
              <div className="lp-gift">♔</div>
              <div>
                <b>Try it Free – 5 Generations <span>Per Day</span></b>
                <p>You can generate up to 5 websites per day during your trial.</p>
              </div>
            </div>

            <div className="lp-hero-actions">
              <button className="lp-button lp-primary" onClick={scrollToHow}>
                Explore Features <span>→</span>
              </button>

              <button className="lp-button lp-secondary" onClick={scrollToShowcase}>
                ▷ &nbsp; See How It Works
              </button>
            </div>

            <div className="lp-trust-line">
              ✦ &nbsp; AI powered &nbsp; · &nbsp; Live preview &nbsp; · &nbsp; Full code access
            </div>
          </div>

          <div className="lp-hero-visual">
            <WorkspacePreview />
          </div>
        </div>

        <div className="lp-scroll-cue"><span /> SCROLL TO EXPLORE <span /></div>
      </section>

      <section className="lp-section lp-features lp-reveal">
        <div className="lp-section-heading">
          <div className="lp-kicker">WHY WEBGENIE</div>
          <h2>Everything You Need to <span>Build With AI</span></h2>
          <p>Everything you need to build your dream website, powered by AI.</p>
        </div>

        <div className="lp-feature-grid">
          {features.map(([icon, title, desc], i) => (
            <article
              className="lp-feature-card"
              style={{ "--delay": `${i * 100}ms` }}
              key={title}
            >
              <div className="lp-feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className="lp-card-arrow">↗</div>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-how lp-reveal" id="lp-how">
        <div className="lp-section-heading">
          <div className="lp-kicker">YOUR IDEA, REALIZED</div>
          <h2>From Prompt to Website <span>in 3 Steps</span></h2>
          <p>A simple workflow that keeps you in control at every step.</p>
        </div>

        <div className="lp-steps">
          {steps.map(([num, title, desc], i) => (
            <article
              className="lp-step-card"
              style={{ "--delay": `${i * 140}ms` }}
              key={num}
            >
              <div className="lp-step-number">{num}</div>
              <div className="lp-step-line" />
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-showcase lp-reveal">
        <div className="lp-showcase-inner">
          <div className="lp-showcase-copy">
            <div className="lp-kicker">MADE FOR YOUR WORKFLOW</div>
            <h2>Not just a design.<br /><span>Your code, your control.</span></h2>
            <p>
              Start with AI-generated code and continue shaping your project
              in the editor. Preview your work and save changes as you go.
            </p>

            <ul>
              <li><span>✓</span> Edit your website files</li>
              <li><span>✓</span> Check changes in the live preview</li>
              <li><span>✓</span> Save your project as you work</li>
            </ul>

            <button
  className="lp-button lp-primary"
  onClick={handleStartBuilding}
>
  Start Building <span>→</span>
</button>
          </div>

          <div className="lp-showcase-card">
            <div className="lp-showcase-top">
              <span /> <span /> <span /><b>your-project / src / App.jsx</b>
            </div>

            <div className="lp-showcase-code">
              <div><i>01</i> <span>import</span> React <span>from</span> 'react';</div>
              <div><i>02</i></div>
              <div><i>03</i> <span>function</span> <strong>MyWebsite</strong>() {"{"}</div>
              <div><i>04</i>　 return (</div>
              <div><i>05</i>　　&lt;main className="app"&gt;</div>
              <div><i>06</i>　　 &lt;h1&gt;My Big Idea&lt;/h1&gt;</div>
              <div><i>07</i>　　 &lt;p&gt;Built with WebGenie&lt;/p&gt;</div>
              <div><i>08</i>　　&lt;/main&gt;</div>
              <div><i>09</i>　 );</div>
              <div><i>10</i> {"}"}</div>
              <div><i>11</i></div>
              <div><i>12</i> <span>export default</span> MyWebsite;</div>
            </div>

            <div className="lp-showcase-status">
              <span /> Project ready to customize <b>● Saved</b>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-capabilities lp-reveal">
        <div className="lp-section-heading">
          <div className="lp-kicker">ONE WORKSPACE</div>
          <h2>Built for Your <span>Next Big Idea</span></h2>
          <p>Move from a simple idea to a website you can keep improving.</p>
        </div>

        <div className="lp-cap-grid">
          <article><span>⌘</span><h3>Project Workspace</h3><p>Keep your website work organized and return to saved projects.</p></article>
          <article><span>〈/〉</span><h3>Code Editor</h3><p>Read and edit your generated source code directly.</p></article>
          <article><span>◉</span><h3>Instant Preview</h3><p>Review your website and refine your ideas as you build.</p></article>
          <article><span>↗</span><h3>Keep Creating</h3><p>Continue improving your website with your own changes.</p></article>
        </div>
      </section>

      <section className="lp-final lp-reveal">
        <div className="lp-final-orb" />
        <div className="lp-kicker">YOUR NEXT PROJECT STARTS HERE</div>
        <h2>Have an Idea? <span>Let's Build It.</span></h2>
        <p>Start with a prompt. Shape it with your ideas. Create something of your own.</p>

        <button
  className="lp-button lp-primary"
  onClick={handleStartBuilding}
>
  Start Your Project <span>→</span>
</button>

        <small>5 generations per day during trial · No credit card required</small>
      </section>

      <footer className="lp-footer">
        <a className="lp-brand" href="#" onClick={scrollToTop}>
          <span>✦</span> WebG<span>enie</span>
        </a>

        <p>Turn your ideas into websites with AI.</p>

        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Back to Top ↑
        </button>

        <small>© {new Date().getFullYear()} WebGenie</small>
      </footer>
    </main>
  );
}
