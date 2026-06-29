from datetime import datetime

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Crazy Portfolio")

@app.middleware("http")
async def fix_https(request: Request, call_next):
    # Only force https when behind a proxy (production), not on localhost
    host = request.headers.get("host", "")
    if "localhost" not in host and "127.0.0.1" not in host:
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

OWNER = {
    "name": "Surya Pratap Singh",
    "title": "I build scalable backend systems and AI-powered applications",
    "tagline": "Backend Engineer | Building scalable web apps & AI tools",
    "location": "Kanpur, Uttar Pradesh, India",
    "email": "suryapratapsingh7054039@gmail.com",
    "resume_url": "/resume",
}

PROJECTS = [
    {
    "name": "GitHub OSS Issue Notifier",
    "description": "Backend service that monitors 20+ open source orgs in real-time and delivers hourly email digests of new GitHub issues. Fully automated — push to main triggers CI/CD pipeline, auto-deploys to AWS EC2 via Docker.",
    "tech": ["Python", "Docker", "AWS EC2", "GitHub Actions", "CI/CD"],
    "impact": "Zero-touch deployment pipeline running in production. Monitors 20+ OSS orgs continuously with zero manual intervention since launch.",
    "repo_url": "https://github.com/surya-pratap-singh-dev/github-oss-issue-notifier",
    "note": "// backend service · no UI · live in production",
    "stats": ["20+ OSS orgs", "Hourly digest", "AWS EC2", "Docker CI/CD"],
    "preview_title": "OSS WATCH NODE",
    "preview_lines": ["GitHub API poller", "Digest queue active", "ECR image deployed", "Main branch auto-release"],
    "preview_signal": "PROD",
    },
    {
        "name": "Synthetic Financial Transaction Data Generator (CGAN)",
        "description": "Built a Conditional GAN (CGAN) model to generate realistic synthetic financial transactions for fraud detection training, solving data privacy and scarcity issues.",
        "tech": ["Python", "PyTorch", "Streamlit", "Machine Learning", "GANs"],
        "impact": "Generated 10,000+ realistic transactions maintaining fraud distribution (~3%) for ML model training without exposing sensitive data.",
        "demo_url": "https://cgansynthetic-data-generator-6byxvzuiph4ewfvodtc92i.streamlit.app/",
        "repo_url": "https://github.com/surya-pratap-singh-dev/cgan_synthetic-data-generator",
        "stats": ["10k+ records", "~3% fraud", "CGAN model", "Streamlit UI"],
        "preview_title": "SYNTHETIC LEDGER",
        "preview_lines": ["Fraud class locked", "Generator trained", "Distribution validated", "CSV export ready"],
        "preview_signal": "ML",
    },
    {
        "name": "Cloud Storage Web App",
        "description": "Built a full-stack file storage platform with authentication and cloud storage integration.",
        "tech": ["Node.js", "Express.js", "MongoDB", "Supabase", "REST APIs", "JWT"],
        "impact": "Implemented file upload, download, and user access control.",
        "repo_url": "https://github.com/surya-pratap-singh-dev/drive-clone",
        "stats": ["JWT auth", "File access", "REST APIs", "Supabase"],
        "preview_title": "STORAGE VAULT",
        "preview_lines": ["Token gate verified", "Upload route online", "Access policy checked", "MongoDB session map"],
        "preview_signal": "AUTH",
    },
    {
        "name": "IronMind Habit and Fitness Tracker",
        "description": "Built a habit tracking dashboard with streak analytics and progress visualization.",
        "tech": ["Python", "Streamlit", "Analytics"],
        "impact": "Shipped as a live app with interactive progress views.",
        "demo_url": "https://iron-mind-project-hdecbpjkwcurbtae7fmue5.streamlit.app/",
        "repo_url": "https://github.com/surya-pratap-singh-dev/iron-mind-project",
        "stats": ["Live app", "Streak views", "Progress charts", "Habit logs"],
        "preview_title": "DISCIPLINE GRID",
        "preview_lines": ["Daily streak traced", "Fitness panel synced", "Progress rings loaded", "Habit history online"],
        "preview_signal": "LIVE",
    },
    {
        "name": "SmartRecruitAI Resume Analyzer",
        "description": "Built an application to analyze resumes and suggest job roles using keyword matching.",
        "tech": ["Python", "Text Processing", "Keyword Matching"],
        "impact": "Automated resume-to-role recommendation workflow.",
        "demo_url": "https://smartrecruitai-app.onrender.com/",
        "repo_url": "https://github.com/surya-pratap-singh-dev/smartrecruitai_app",
        "stats": ["Resume parse", "Role match", "Keyword scoring", "Render deploy"],
        "preview_title": "ROLE MATCH ENGINE",
        "preview_lines": ["Resume text parsed", "Skill tokens mapped", "Role score generated", "Recommendation issued"],
        "preview_signal": "AI",
    },
    {
        "name": "AI Interview Coach",
        "description": "Built an AI-powered interview coaching app that simulates real interview scenarios by generating role-specific questions and evaluating user responses via voice input.",
        "tech": ["React", "TypeScript", "Google AI Studio (Gemini API)", "Speech-to-Text"],
        "impact": "Enabled real-time interview practice with AI-generated feedback, improving candidate readiness through interactive voice-based sessions.",
        "repo_url": "https://github.com/surya-pratap-singh-dev/ai-interview-coach",
        "stats": ["Voice input", "Gemini API", "Role prompts", "Realtime feedback"],
        "preview_title": "INTERVIEW SIM",
        "preview_lines": ["Role profile loaded", "Voice response captured", "AI feedback streamed", "Practice loop complete"],
        "preview_signal": "VOICE",
    }
]

SKILL_GROUPS = [
    {
        "category": "Languages",
        "items": [
            {"name": "Python", "level": 90},
            {"name": "Go", "level": 80},
            {"name": "SQL", "level": 78},
        ],
    },
    {
        "category": "Backend",
        "items": [
            {"name": "Docker, CI/CD", "level": 84},
            {"name": "Linux", "level": 82},
            {"name": "FastAPI", "level": 87},
            {"name": "REST APIs", "level": 88},
            {"name": "JWT Authentication", "level": 82},
        ],
    },
    {
        "category": "Databases, Cloud, and Tools",
        "items": [
            {"name": "MongoDB", "level": 82},
            {"name": "Supabase", "level": 80},
            {"name": "AWS EC2", "level": 65},
            {"name": "Git & GitHub", "level": 86},
        ],
    },
]

EXPERIENCE = [
    {
        "period": "2023 - 2026",
        "role": "B.Tech in Computer Science Engineering",
        "highlights": [
            "Focused on backend development and cloud-oriented web application workflows.",
            "Built practical projects using Python, Node.js, APIs, authentication, and databases.",
            "Strengthened implementation skills through continuous project delivery.",
        ],
    },
    {
        "period": "2024 - Present",
        "role": "Independent Project Developer",
        "org": "Self-directed build track",
        "highlights": [
            "Built 5+ end-to-end projects including AI tools, full-stack apps, and ML models.",
            "Shipped live products with FastAPI, React, Node.js, and cloud deployments.",
            "Contributed security improvements and bug fixes to open source repositories on GitHub.",
        ],
    },
    {
        "period": "2025",
        "role": "Workshops & Hackathons",
        "org": "IIT Roorkee Cognizance × Microsoft, AVALANCHE | Adobe India Hackathon",
        "highlights": [
            "AI/ML workshop with Microsoft and Blockchain workshop with AVALANCHE — Cognizance IIT Roorkee 2025.",
            "Participated in Adobe India Hackathon Round 1 (MCQ + Coding) as Team '404 NOT FOUNDERS'.",
        ],
    },
]

ABOUT_STORY = [
    "I'm a backend engineer who builds practical software that solves real problems — and ships it.",
    "I focus on backend + cloud systems: APIs that don't fall over, CI/CD pipelines that actually deploy, and infra I've configured myself instead of just reading about. Every project on this page is live in production, not a tutorial clone.",
    "I'm now looking to bring that same execution to a real team — solving real problems, shipping real product.",
]

BLOG_POSTS = [
    {
    "read_time": "5 MIN READ",
    "title": "I Built a Bot That Watches GitHub 24/7 So I Don't Have To",
    "excerpt": "Automated open-source issue tracking with Python, Docker, and AWS EC2. A self-hosted CI/CD pipeline that sends hourly email digests of new GitHub issues.",
    "url": "https://medium.com/@suryabhaisince2002/i-built-a-bot-that-watches-github-24-7-so-i-dont-have-to-3258f1e62ada",
    "related": "GitHub OSS Issue Notifier",
    },
    {
        "read_time": "4 MIN READ",
        "title": "Cloud Storage App: Auth Has To Be System-Level",
        "excerpt": "I learned that login is just step one. Real security came from permission checks on every file action and predictable token/session handling.",
        "url": "https://github.com/surya-pratap-singh-dev/drive-clone",
        "related": "Cloud Storage Web App",
    },
    {
        "read_time": "5 MIN READ",
        "title": "CGAN Project: Data Quality Beats Fancy Models",
        "excerpt": "Most gains came from data prep and evaluation discipline. Balancing fraud classes and validating generated patterns mattered more than architecture tweaks.",
        "url": "https://medium.com/@suryabhaisince2002/i-built-a-gan-that-generates-fake-bank-fraud-data-heres-what-actually-happened-9ed58400c6f5",
        "related": "CGAN Generator",
    },
    {
        "read_time": "3 MIN READ",
        "title": "IronMind: UX Clarity Drives Retention",
        "excerpt": "Users stuck with the app when progress looked obvious. Lightweight visuals and streak feedback improved engagement without overcomplicating the product.",
        "url": "https://github.com/surya-pratap-singh-dev/iron-mind-project",
        "related": "IronMind Tracker",
    },
    {
        "read_time": "3 MIN READ",
        "title": "SmartRecruitAI: Relevance Is Better Than Volume",
        "excerpt": "Keyword matching worked best when tuned for role context. Precision in mapping signals to roles outperformed broad, noisy scoring strategies.",
        "url": "https://github.com/surya-pratap-singh-dev/smartrecruitai_app",
        "related": "SmartRecruitAI",
    },
    {
        "read_time": "4 MIN READ",
        "title": "AI Interview Coach: Latency Changes Product Feel",
        "excerpt": "Fast response loops made practice feel realistic. I focused on prompt structure and response timing to keep the coaching flow smooth and useful.",
        "url": "https://github.com/surya-pratap-singh-dev/ai-interview-coach",
        "related": "AI Interview Coach",
    },
]

SOCIAL_LINKS = [
    {"label": "GitHub", "url": "https://github.com/surya-pratap-singh-dev"},
    {"label": "LinkedIn", "url": "https://www.linkedin.com/in/surya-pratap-singh-11490332a/"},
    {"label": "Medium", "url": "https://medium.com/@suryabhaisince2002"},
]

PROFILE_RECORD = {
    "case_id": "SPS-2026-IN",
    "status": "Backend Engineer | Shipping scalable apps with Python Fast API & Node.js",
    "class_code": "CSE GRADUATE '26",
    "xp_level": "BACKEND",
    "availability": "OPEN TO WORK",
    "languages": [
        {"label": "LANG_1", "value": "English"},
        {"label": "LANG_2", "value": "Hindi"},
    ],
    "education": [
        {
            "label": "B.Tech Computer Science Engineering",
            "period": "2023 - 2026",
        },
        {
            "label": "Current Focus",
            "period": "Backend Systems ",
            "detail": "Backend systems, cloud-based web applications, and API-driven architecture.",
        },
    ],
    "soft_skills": [
        "Problem Solving",
        "Ownership",
        "Adaptability",
        "Team Collaboration",
        "Fast Iteration",
        "Consistency",
    ],
}


RESUME_PATH = Path(__file__).resolve().parent / "static" / "Surya_Pratap_Singh_Resume.pdf"


@app.get("/resume")
async def download_resume():
    """Serve the resume PDF as a direct download."""
    return FileResponse(
        path=RESUME_PATH,
        filename="Surya_Pratap_Singh_Resume.pdf",
        media_type="application/pdf",
    )


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    hard_skills = [item["name"] for group in SKILL_GROUPS for item in group["items"]]
    context = {
        "request": request,
        "owner": OWNER,
        "projects": PROJECTS,
        "skill_groups": SKILL_GROUPS,
        "experience_items": EXPERIENCE,
        "about_story": ABOUT_STORY,
        "blog_posts": BLOG_POSTS,
        "social_links": SOCIAL_LINKS,
        "profile_record": PROFILE_RECORD,
        "profile_hard_skills": hard_skills[:12],
        "year": datetime.now().year,
    }
    return templates.TemplateResponse("index.html", context)
