
import Link from "next/link";
import styles from "./page.module.css";

const features = [
    {
        number: "01",
        icon: "✦",
        title: "Real-time collaboration",
        description:
            "Work together on documents with live updates, presence, and synchronized changes.",
    },
    {
        number: "02",
        icon: "◷",
        title: "Document versioning",
        description:
            "Keep track of document revisions and revisit previous versions whenever needed.",
    },
    {
        number: "03",
        icon: "⌘",
        title: "Simple sharing",
        description:
            "Share documents and collaborate with other people from one workspace.",
    },
    {
        number: "04",
        icon: "⌁",
        title: "Built for reliability",
        description:
            "A backend designed around authentication, persistent storage, and real-time connections.",
    },
];

export default function Home() {
    return (
        <main className={styles.page}>
            <nav className={styles.nav}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandIcon}>C</span>
                    <span>CollabSpace</span>
                </Link>

                <div className={styles.navLinks}>
                    <a href="#features">Features</a>
                    <a href="#about">About</a>
                </div>

                <div className={styles.navActions}>
                    <Link href="/login" className={styles.login}>
                        Log in
                    </Link>
                    <Link href="/register" className={styles.navButton}>
                        Get started <span>↗</span>
                    </Link>
                </div>
            </nav>

            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.eyebrow}>
                        <span className={styles.liveDot} />
                        YOUR WORKSPACE, CONNECTED
                    </div>

                    <h1>
                        Great work happens
                        <br />
                        <span>together.</span>
                    </h1>

                    <p className={styles.heroDescription}>
                        Create, share, and collaborate on documents in
                        real time. One workspace to bring your team&apos;s
                        ideas together.
                    </p>

                    <div className={styles.heroActions}>
                        <Link href="/register" className={styles.primaryButton}>
                            Start collaborating <span>→</span>
                        </Link>
                        <Link href="/login" className={styles.secondaryButton}>
                            Sign in
                        </Link>
                    </div>

                    <div className={styles.heroNote}>
                        <span>✦</span> Built for teams that create together.
                    </div>
                </div>

                <div className={styles.preview}>
                    <div className={styles.previewWindow}>
                        <div className={styles.windowTop}>
                            <div className={styles.windowDots}>
                                <i /><i /><i />
                            </div>
                            <span>YOUR WORKSPACE</span>
                            <span className={styles.windowMenu}>•••</span>
                        </div>

                        <div className={styles.workspace}>
                            <aside className={styles.sidebar}>
                                <div className={styles.sideBrand}>
                                    <span>C</span> Workspace
                                </div>
                                <div className={styles.sideLabel}>WORKSPACE</div>
                                <div className={styles.sideItemActive}>▤ &nbsp; All documents</div>
                                <div className={styles.sideItem}>☆ &nbsp; Shared with me</div>
                                <div className={styles.sideItem}>◷ &nbsp; Recent</div>
                                <div className={styles.sideLabel}>COLLECTIONS</div>
                                <div className={styles.sideItem}>▧ &nbsp; Projects</div>
                                <div className={styles.sideItem}>▧ &nbsp; Team notes</div>
                            </aside>

                            <div className={styles.documentArea}>
                                <div className={styles.documentHeader}>
                                    <div>
                                        <span className={styles.documentCaption}>DOCUMENT / PROJECTS</span>
                                        <h3>Product vision</h3>
                                    </div>
                                    <div className={styles.avatars}>
                                        <span>R</span><span>A</span><span>S</span>
                                    </div>
                                </div>

                                <div className={styles.editor}>
                                    <span className={styles.editorTag}>DOCUMENT</span>
                                    <h2>Building better<br />things, together.</h2>
                                    <p>
                                        Great ideas become reality when people
                                        work together. This is where our next
                                        chapter begins.
                                    </p>
                                    <div className={styles.editorLine} />
                                    <h4>Our shared vision</h4>
                                    <p>
                                        Bring ideas, people, and work into one
                                        connected space.
                                    </p>
                                    <div className={styles.cursor}>
                                        <span />
                                        Rohan
                                    </div>
                                </div>

                                <div className={styles.previewFooter}>
                                    <span><i /> All changes saved</span>
                                    <span>Last edited just now</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.floatCard}>
                        <span className={styles.floatIcon}>✦</span>
                        <div>
                            <strong>Work in sync</strong>
                            <small>Ideas move forward together.</small>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.trustStrip}>
                <span>ONE WORKSPACE</span>
                <i />
                <span>REAL-TIME UPDATES</span>
                <i />
                <span>SHARED DOCUMENTS</span>
                <i />
                <span>VERSION HISTORY</span>
            </section>

            <section className={styles.features} id="features">
                <div className={styles.sectionHeading}>
                    <span className={styles.sectionEyebrow}>MADE FOR COLLABORATION</span>
                    <h2>Everything your team needs<br />to move ideas forward.</h2>
                    <p>Less switching between tools. More meaningful work, together.</p>
                </div>

                <div className={styles.featureGrid}>
                    {features.map((feature) => (
                        <article className={styles.featureCard} key={feature.number}>
                            <div className={styles.featureTop}>
                                <span className={styles.featureIcon}>{feature.icon}</span>
                                <span className={styles.featureNumber}>{feature.number}</span>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                            <span className={styles.featureArrow}>↗</span>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.cta} id="about">
                <div>
                    <span className={styles.sectionEyebrow}>YOUR NEXT CHAPTER STARTS HERE</span>
                    <h2>Make collaboration<br />your team&apos;s superpower.</h2>
                    <p>Bring your ideas into one shared workspace.</p>
                </div>
                <Link href="/register" className={styles.ctaButton}>
                    Create your workspace <span>→</span>
                </Link>
            </section>

            <footer className={styles.footer}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandIcon}>C</span>
                    <span>CollabSpace</span>
                </Link>
                <span>Built for better collaboration.</span>
                <span>© 2026 CollabSpace</span>
            </footer>
        </main>
    );
}
