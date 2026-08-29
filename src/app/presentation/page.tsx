import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Captions, Download, Maximize, Play, ShieldCheck } from "lucide-react";
import styles from "./presentation.module.css";

export const metadata: Metadata = {
  title: "Problem story",
  description: "A cinematic opener for the PyanThit live product presentation.",
};

const demoSteps = [
  {
    number: "01",
    title: "Choose with confidence",
    description: "Open a verified listing with seller history, condition details, and a 48-hour trial.",
    href: "/marketplace/iphone-13",
    label: "Open verified listing",
  },
  {
    number: "02",
    title: "Keep the deal protected",
    description: "Show how guarded chat flags links, contact sharing, and requests to pay elsewhere.",
    href: "/chat",
    label: "Open protected chat",
  },
  {
    number: "03",
    title: "Inspect before payout",
    description: "Review shipment evidence, the inspection clock, escrow, and the dispute path.",
    href: "/orders",
    label: "Resolve Thiri’s problem",
  },
];

const videoExports = [
  {
    title: "Problem opener",
    duration: "00:55",
    description: "Cinematic setup for a live stage demo.",
    href: "/presentation/pyanthit-problem-story.mp4",
    fileName: "PyanThit-problem-story.mp4",
  },
  {
    title: "Full product demo",
    duration: "02:18",
    description: "Narrated walkthrough of every core product flow.",
    href: "/presentation/pyanthit-full-product-demo.mp4",
    fileName: "PyanThit-full-product-demo.mp4",
  },
  {
    title: "Hackathon presentation",
    duration: "03:14",
    description: "Problem story and complete solution in one upload-ready cut.",
    href: "/presentation/pyanthit-hackathon-presentation.mp4",
    fileName: "PyanThit-hackathon-presentation.mp4",
  },
];

export default function PresentationPage() {
  return (
    <main className={styles.presentation}>
      <section className={styles.intro}>
        <div>
          <div className={styles.kicker}><span /> Presentation opener</div>
          <h1>First, feel<br />the problem.</h1>
        </div>
        <p>
          Play this 55-second story, then move straight into the live PyanThit
          experience to show how trust is designed into every step.
        </p>
      </section>

      <section className={styles.stage} aria-label="PyanThit problem story video">
        <div className={styles.stageHeader}>
          <div className={styles.stageLabel}>
            <span className={styles.liveDot} />
            PROBLEM STORY · 00:55
          </div>
          <div className={styles.stageHints}>
            <span><Captions size={14} /> Captions included</span>
            <span><Maximize size={14} /> Best in full screen</span>
          </div>
        </div>
        <video
          className={styles.video}
          controls
          playsInline
          preload="metadata"
          poster="/presentation/stills/problem-01.jpg"
        >
          <source src="/presentation/pyanthit-problem-story.mp4" type="video/mp4" />
          <track
            default
            kind="captions"
            src="/presentation/captions.vtt"
            srcLang="en"
            label="English"
          />
          Your browser does not support embedded video.
        </video>
        <div className={styles.stageFooter}>
          <div>
            <strong>Presenter cue</strong>
            <span>Let the final frame fade completely before you speak.</span>
          </div>
          <a
            className={styles.download}
            href="/presentation/pyanthit-problem-story.mp4"
            download="PyanThit-problem-story.mp4"
          >
            <Download size={16} /> Download MP4
          </a>
        </div>
      </section>

      <section className={styles.exports} aria-labelledby="video-exports-heading">
        <div className={styles.exportHeading}>
          <div>
            <div className={styles.kicker}><span /> Presentation files</div>
            <h2 id="video-exports-heading">Ready for the stage.<br />Ready to upload.</h2>
          </div>
          <p>All exports are 1080p MP4 files with AI narration, original music, and presentation-safe pacing.</p>
        </div>
        <div className={styles.exportGrid}>
          {videoExports.map((video) => (
            <article className={styles.exportCard} key={video.title}>
              <div className={styles.exportMeta}>
                <Play size={17} fill="currentColor" />
                <span>{video.duration}</span>
              </div>
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <a href={video.href} download={video.fileName}>
                <Download size={16} /> Download MP4
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.handoff}>
        <div className={styles.handoffCopy}>
          <div className={styles.kicker}><span /> Live solution</div>
          <h2>Now, solve it<br />with PyanThit.</h2>
          <p>
            “Thiri should never have needed blind trust. Here is what the same
            purchase looks like when the marketplace protects both sides.”
          </p>
          <Link className={styles.primaryAction} href="/marketplace/iphone-13">
            <Play size={17} fill="currentColor" /> Start the live demo
          </Link>
        </div>

        <div className={styles.steps}>
          {demoSteps.map((step) => (
            <article className={styles.step} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <Link href={step.href}>
                  {step.label} <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.closer}>
        <ShieldCheck size={18} />
        Verified people. Protected payment. Evidence before payout.
      </footer>
    </main>
  );
}
