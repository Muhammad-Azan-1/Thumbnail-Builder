import HomeClient from "@/components/home/home-client/home-client";
import Navbar from "@/components/navbar/Navbar";
import styles from "@/components/home/home-client/home-client.module.css";
export default function Home() {
  return (


    <>
           <Navbar />
     <main className="studio-shell">
      <div className="grain" aria-hidden="true" />
      <header className={styles.studioHeader}>
        <div className="brand-mark" aria-hidden="true">
          TB
        </div>
        <div>
          <p className="eyebrow font-mono">AI CREATIVE STUDIO</p>
          <h1>Thumbnail Builder</h1>
          <p className="font-mono subtitle">Generate YouTube thumbnails with AI</p>
        </div>
        <div className={`${styles.headerStatus} font-mono`}>
          <span /> Ready to create
        </div>
      </header>
      <HomeClient />
      </main>

    </>
  
  )
}
