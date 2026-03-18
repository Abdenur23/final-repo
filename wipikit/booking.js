:root {
    --primary: #0B6E4F;      /* deep green — prints as gray, signals responsible */
    --primary-dark: #08573e;
    --bg: #FFFFFF;
    --text-dark: #1A1A1A;
    --text-soft: #4A4A4A;
    --border-light: #E0E0E0;
    --gray-bg: #F5F5F5;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--text-dark);
    line-height: 1.5;
}

.site-wrapper {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

/* hero */
.hero {
    padding: 3rem 0 2rem;
}

.hero-headline {
    font-size: clamp(3rem, 8vw, 5rem);
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 1rem;
}

.hero-tagline {
    font-size: 1.5rem;
    color: var(--text-soft);
    margin-bottom: 0.5rem;
}

.hero-subline {
    font-size: 1.8rem;
    font-weight: 500;
    color: var(--primary);
    margin-bottom: 2rem;
}

.btn {
    display: inline-block;
    background: transparent;
    border: 2px solid var(--primary);
    padding: 0.8rem 2.5rem;
    font-size: 1.2rem;
    font-weight: 600;
    border-radius: 40px;
    cursor: pointer;
    background: var(--primary);
    color: white;
    transition: background 0.2s;
}

.btn:hover {
    background: var(--primary-dark);
    border-color: var(--primary-dark);
}

.btn--block {
    width: 100%;
}

/* sections */
.section-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 3rem 0 1.5rem;
    letter-spacing: -0.02em;
}

/* items grid */
.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.item-category {
    padding: 1rem;
    background: var(--gray-bg);
    border-radius: 8px;
    font-weight: 500;
}

.items-note {
    color: var(--primary);
    font-weight: 500;
    margin-top: 1rem;
}

/* steps */
.steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin: 2rem 0 1rem;
}

.step {
    text-align: center;
}

.step-number {
    display: block;
    width: 40px;
    height: 40px;
    background: var(--primary);
    color: white;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 600;
    line-height: 40px;
    margin: 0 auto 1rem;
}

.step-text {
    font-size: 1.1rem;
}

.steps-footer {
    text-align: center;
    font-size: 1.2rem;
    color: var(--primary);
    font-weight: 500;
    margin-top: 2rem;
}

/* modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: 0.2s;
    z-index: 1000;
}

.modal-overlay[aria-hidden="false"] {
    opacity: 1;
    visibility: visible;
}

.modal-card {
    background: white;
    max-width: 450px;
    width: 90%;
    border-radius: 24px;
    padding: 2rem;
    position: relative;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
}

.modal-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--primary);
}

.form-group {
    margin-bottom: 1.2rem;
}

.form-group label, .form-group legend {
    font-weight: 600;
    display: block;
    margin-bottom: 0.3rem;
}

input, select {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid var(--border-light);
    border-radius: 8px;
    font-size: 1rem;
}

input:focus, select:focus {
    outline: 2px solid var(--primary);
    border-color: transparent;
}

.thank-you {
    text-align: center;
    padding: 2rem 0;
}

.thank-you-title {
    font-size: 2rem;
    color: var(--primary);
    margin-bottom: 1rem;
}

/* footer */
.site-footer {
    border-top: 1px solid var(--border-light);
    margin-top: 4rem;
    padding: 2rem;
    text-align: center;
    color: var(--text-soft);
}

.footer-content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.footer-links a {
    color: var(--text-soft);
    text-decoration: none;
}

.footer-links a:hover {
    color: var(--primary);
}

@media (max-width: 600px) {
    .site-wrapper { padding: 1rem; }
    .hero-headline { font-size: 2.8rem; }
    .hero-tagline { font-size: 1.2rem; }
    .hero-subline { font-size: 1.4rem; }
    .steps { grid-template-columns: 1fr; }
    .footer-content { flex-direction: column; }
}
