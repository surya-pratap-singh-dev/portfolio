from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Crazy Portfolio")

@app.middleware("http")
async def fix_https(request: Request, call_next):
    request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

OWNER = {
    "name": "Surya Pratap Singh",
    "title": "I build scalable backend systems and AI-powered applications",
    "tagline": "Final-year BTech CSE student focused on backend and cloud-based web applications.",
    "location": "Kanpur, Uttar Pradesh, India",
    "email": "suryapratapsingh7054039@gmail.com",
}

PROJECTS = [
    {
        "name": "Cloud Storage Web App",
        "description": "Built a full-stack file storage platform with authentication and cloud storage integration.",
        "tech": ["Node.js", "Express.js", "MongoDB", "Supabase", "REST APIs", "JWT"],
        "impact": "Implemented file upload, download, and user access control.",
        "demo_url": None,
        "repo_url": "https://github.com/surya-pratap-singh-dev/drive-clone",
    },
    {
        "name": "Synthetic Financial Transaction Data Generator (CGAN)",
        "description": "Built a Conditional GAN (CGAN) model to generate realistic synthetic financial transactions for fraud detection training, solving data privacy and scarcity issues.",
        "tech": ["Python", "PyTorch", "Streamlit", "Machine Learning", "GANs"],
        "impact": "Generated 10,000+ realistic transactions maintaining fraud distribution (~3%) for ML model training without exposing sensitive data.",
        "demo_url": "https://cgansynthetic-data-generator-6byxvzuiph4ewfvodtc92i.streamlit.app/",
        "repo_url": "https://github.com/FAKE-SURYA/cgan_synthetic-data-generator"
    },
    {
        "name": "IronMind Habit and Fitness Tracker",
        "description": "Built a habit tracking dashboard with streak analytics and progress visualization.",
        "tech": ["Python", "Streamlit", "Analytics"],
        "impact": "Shipped as a live app with interactive progress views.",
        "demo_url": "https://iron-mind-project-hdecbpjkwcurbtae7fmue5.streamlit.app/",
        "repo_url": "https://github.com/surya-pratap-singh-dev/iron-mind-project",
    },
    {
        "name": "SmartRecruitAI Resume Analyzer",
        "description": "Built an application to analyze resumes and suggest job roles using keyword matching.",
        "tech": ["Python", "Text Processing", "Keyword Matching"],
        "impact": "Automated resume-to-role recommendation workflow.",
        "demo_url": None,
        "repo_url": "https://github.com/surya-pratap-singh-dev/smartrecruitai_app",
    },
    {
        "name": "AI Interview Coach",
        "description": "Built an AI-powered interview coaching app that simulates real interview scenarios by generating role-specific questions and evaluating user responses via voice input.",
        "tech": ["React", "TypeScript", "Google AI Studio (Gemini API)", "Speech-to-Text"],
        "impact": "Enabled real-time interview practice with AI-generated feedback, improving candidate readiness through interactive voice-based sessions.",
        "demo_url": "https://your-live-demo-link",
        "repo_url": "https://github.com/surya-pratap-singh-dev/ai-interview-coach"
    }
]

SKILL_GROUPS = [
    {
        "category": "Languages",
        "items": [
            {"name": "Python", "level": 90},
            {"name": "JavaScript", "level": 80},
            {"name": "SQL", "level": 78},
        ],
    },
    {
        "category": "Backend",
        "items": [
            {"name": "Node.js", "level": 84},
            {"name": "Express.js", "level": 82},
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
            {"name": "AWS (Basics)", "level": 65},
            {"name": "Git", "level": 86},
            {"name": "GitHub", "level": 85},
            {"name": "Postman", "level": 83},
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
    "I am a final-year BTech CSE student who enjoys building practical software that solves real problems.",
    "Currently focused on backend + cloud systems and actively seeking opportunities to build real-world products",
    "I am now looking to contribute to a strong team and keep improving through real product execution.",
]

BLOG_POSTS = [
    {
        "read_time": "4 MIN READ",
        "title": "Cloud Storage App: Auth Has To Be System-Level",
        "excerpt": "I learned that login is just step one. Real security came from permission checks on every file action and predictable token/session handling.",
        "url": "https://github.com/surya-pratap-singh-dev/drive-clone",
    },
    {
        "read_time": "5 MIN READ",
        "title": "CGAN Project: Data Quality Beats Fancy Models",
        "excerpt": "Most gains came from data prep and evaluation discipline. Balancing fraud classes and validating generated patterns mattered more than architecture tweaks.",
        "url": "https://github.com/FAKE-SURYA/cgan_synthetic-data-generator",
    },
    {
        "read_time": "3 MIN READ",
        "title": "IronMind: UX Clarity Drives Retention",
        "excerpt": "Users stuck with the app when progress looked obvious. Lightweight visuals and streak feedback improved engagement without overcomplicating the product.",
        "url": "https://github.com/surya-pratap-singh-dev/iron-mind-project",
    },
    {
        "read_time": "3 MIN READ",
        "title": "SmartRecruitAI: Relevance Is Better Than Volume",
        "excerpt": "Keyword matching worked best when tuned for role context. Precision in mapping signals to roles outperformed broad, noisy scoring strategies.",
        "url": "https://github.com/surya-pratap-singh-dev/smartrecruitai_app",
    },
    {
        "read_time": "4 MIN READ",
        "title": "AI Interview Coach: Latency Changes Product Feel",
        "excerpt": "Fast response loops made practice feel realistic. I focused on prompt structure and response timing to keep the coaching flow smooth and useful.",
        "url": "https://github.com/surya-pratap-singh-dev/ai-interview-coach",
    },
]

SOCIAL_LINKS = [
    {"label": "GitHub", "url": "https://github.com/FAKE-SURYA"},
    {"label": "LinkedIn", "url": "https://www.linkedin.com/in/surya-pratap-singh-11490332a/"},
]

PROFILE_RECORD = {
    "case_id": "SPS-2026-IN",
    "status": "Final-year BTech CSE student seeking entry-level software roles",
    "class_code": "BTECH_CSE",
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
            "period": "Final Year",
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