import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

async function callGeminiWithRetry(contents: string, retries = 2, delayMs = 1500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });
      return response;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        attempt < retries &&
        (msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('UNAVAILABLE'))
      ) {
        console.warn(`Transient Gemini demand spike, retrying attempt ${attempt + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'PlacementPilot AI',
    timestamp: new Date().toISOString(),
  });
});

// 1. Resume Analyzer
app.post('/api/resume/analyze', async (req: Request, res: Response) => {
  try {
    const { resumeText, targetRole, fileName } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 30) {
      return res.status(400).json({
        error: 'Resume text is required and must contain at least 30 characters.',
      });
    }

    const sanitizedRole = (targetRole && typeof targetRole === 'string' ? targetRole.trim() : 'Software Engineer');

    const prompt = `You are a premier campus placement mentor and technical resume evaluator specializing in Indian engineering campus placements (Tier 1, Tier 2, Tier 3 colleges, Product & Service companies like TCS, Infosys, Wipro, Amazon, Google, Flipkart, Microsoft).

Evaluate this student resume truthfully, rigorously, and constructively for the target role: "${sanitizedRole}".
File Name: ${fileName || 'Uploaded_Resume.pdf'}

Student Resume Content:
---
${resumeText.slice(0, 30000)}
---

Provide a truthful, structured analysis in JSON adhering to this exact format:
{
  "candidateName": "string or 'Not specified'",
  "contactInfo": {
    "email": "string or ''",
    "phone": "string or ''",
    "linkedin": "string or ''",
    "github": "string or ''",
    "location": "string or ''"
  },
  "extractedSkills": {
    "technical": ["list of detected languages and core CS concepts"],
    "frameworks": ["list of frameworks, libraries"],
    "tools": ["list of developer tools, Git, Docker, etc."],
    "softSkills": ["list of communication, teamwork, leadership skills evidenced"]
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "branch": "string",
      "year": "string",
      "score": "CGPA or percentage if mentioned, else ''"
    }
  ],
  "projects": [
    {
      "title": "string",
      "technologies": ["string"],
      "summary": "string",
      "critique": "Constructive feedback on bullet point strength or metrics"
    }
  ],
  "experienceOrInternships": [
    {
      "role": "string",
      "company": "string",
      "duration": "string",
      "highlights": ["string"]
    }
  ],
  "achievements": ["string"],
  "strengths": ["3 to 5 realistic strengths evident from the resume"],
  "missingSkills": ["4 to 6 critical skills typically expected for ${sanitizedRole} that are absent"],
  "bulletPointCritique": [
    {
      "original": "Sample weak bullet point from the resume or paraphrase",
      "issue": "What makes it weak (e.g., lacks metrics, passive verbs, vague tech stack)",
      "improved": "Action-oriented STAR format rewritten version without fabricating metrics or false claims"
    }
  ],
  "atsScore": 75,
  "atsAssessment": {
    "readability": "Good/Average/Needs Work",
    "keywordDensity": "High/Moderate/Low",
    "sectionCompleteness": "Score analysis notes",
    "verdict": "Clear summary note explaining this is an ATS-style heuristic evaluation and not guaranteed for any specific corporate scanner."
  },
  "actionableRecommendations": [
    "Step 1: Specific advice",
    "Step 2: Specific advice",
    "Step 3: Specific advice",
    "Step 4: Specific advice"
  ]
}

Ensure the atsScore is an integer between 20 and 95 based on actual content quality. Never fabricate false achievements or claim to be an official ATS filter. Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/resume/analyze:', err);
    return res.status(500).json({
      error: 'Failed to analyze resume. Please verify the content and try again.',
      details: err.message,
    });
  }
});

// 2. Job Description and Skill Gap Analyzer
app.post('/api/job-gap/analyze', async (req: Request, res: Response) => {
  try {
    const { jobDescription, resumeText, studentSkills, targetRole, company } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({
        error: 'Job description is required and must contain at least 20 characters.',
      });
    }

    const prompt = `You are an expert technical recruiter and campus placement coach.
Analyze the following Job Description (Company: "${company || 'General'}", Role: "${targetRole || 'Software Development Engineer'}").
Compare it against the student's qualifications (provided skills or resume text).

Target Role: ${targetRole || 'Not specified'}
Company: ${company || 'General Campus Placement'}

Job Description:
---
${jobDescription.slice(0, 20000)}
---

Student Information:
Skills: ${JSON.stringify(studentSkills || [])}
Resume Context:
${(resumeText || '').slice(0, 15000)}

Perform an exhaustive, realistic skill gap analysis. Return valid JSON in this exact structure:
{
  "detectedRoleTitle": "string",
  "companyContext": "string",
  "extractedRequirements": {
    "requiredSkills": ["list of mandatory skills"],
    "preferredSkills": ["nice-to-have or bonus skills"],
    "technologies": ["languages, databases, tools, frameworks"],
    "responsibilities": ["3-5 core duties from the JD"]
  },
  "matchedSkills": ["skills that the student possesses"],
  "missingSkills": ["skills in the JD that the student lacks"],
  "skillGapsWithReason": [
    {
      "skill": "string",
      "importance": "Crucial / High / Medium",
      "whyItMatters": "Why interviewers or screening teams filter for this",
      "learningRecommendation": "Practical suggestion on how a college student can master it in 1-2 weeks"
    }
  ],
  "matchPercentage": 65,
  "screeningVerdict": "Honest assessment of candidate readiness for this JD",
  "priorityRoadmap": [
    {
      "priority": 1,
      "topic": "string",
      "timeframe": "Days 1-5",
      "action": "string"
    },
    {
      "priority": 2,
      "topic": "string",
      "timeframe": "Days 6-12",
      "action": "string"
    },
    {
      "priority": 3,
      "topic": "string",
      "timeframe": "Days 13-20",
      "action": "string"
    }
  ]
}

Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/job-gap/analyze:', err);
    return res.status(500).json({
      error: 'Failed to analyze job description skill gaps.',
      details: err.message,
    });
  }
});

// 3. Personalized 30-Day Learning Roadmap
app.post('/api/roadmap/generate', async (req: Request, res: Response) => {
  try {
    const { targetRole, currentSkills, dailyHours, missingSkills, collegeSemester } = req.body;

    const role = (targetRole && typeof targetRole === 'string' ? targetRole : 'Software Development Engineer');
    const hours = Number(dailyHours) || 3;

    const prompt = `You are an elite Indian Engineering Campus Placement Mentor.
Design an intensive, realistic, daily 30-Day Placement Preparation Plan for a college student aiming for:
Target Role: "${role}"
Daily Study Time: ${hours} hours per day
Current Skills: ${JSON.stringify(currentSkills || [])}
Missing / Focus Skills: ${JSON.stringify(missingSkills || [])}
College Semester / Context: ${collegeSemester || 'Final Year / Pre-final Year'}

Divide the plan into 4 weekly themes and ALL 30 consecutive days.
Categories should include:
- Data Structures & Algorithms (DSA)
- Core Computer Science (OS, DBMS, Computer Networks, OOPs)
- Aptitude & Logical Reasoning (Quantitative, Verbal, Logical)
- Web / Backend / Project Development
- Mock Interview & HR / Communication Preparation

Return ONLY valid JSON matching this structure:
{
  "targetRole": "${role}",
  "dailyHours": ${hours},
  "weeklyMilestones": [
    { "week": 1, "theme": "Foundation & DSA Arrays/Strings + DBMS Basics" },
    { "week": 2, "theme": "Trees, Graphs, Recursion + Operating Systems" },
    { "week": 3, "theme": "Dynamic Programming, System Design Basics + Computer Networks" },
    { "week": 4, "theme": "Full Mock Interviews, Revision, Aptitude Speed Tests & HR Rounds" }
  ],
  "days": [
    // Provide an array of all 30 days (Day 1 to Day 30)
    {
      "day": 1,
      "week": 1,
      "title": "Topic title",
      "category": "DSA", // one of DSA, Core CS, Aptitude, Projects, Mock Prep
      "estimatedMinutes": 180,
      "tasks": [
        { "id": "d1-t1", "text": "Task description 1", "type": "Theory" },
        { "id": "d1-t2", "text": "Task description 2", "type": "Practice" },
        { "id": "d1-t3", "text": "Task description 3", "type": "Revision" }
      ],
      "keyConcepts": ["Concept 1", "Concept 2"],
      "interviewTip": "Indian campus recruitment specific insight"
    }
  ]
}

Every single day from 1 to 30 must be present in the days array with distinct, high-value tasks. Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/roadmap/generate:', err);
    return res.status(500).json({
      error: 'Failed to generate preparation roadmap.',
      details: err.message,
    });
  }
});

// 4. AI Mock Interview - Question Generator
app.post('/api/interview/generate-questions', async (req: Request, res: Response) => {
  try {
    const { targetRole, category, difficulty, companyFocus, count = 5 } = req.body;

    const role = targetRole || 'Software Development Engineer';
    const cat = category || 'Technical';
    const diff = difficulty || 'Intermediate';
    const company = companyFocus || 'Top Tech & Campus Recruiters';

    const prompt = `You are a Senior Technical Interviewer conducting campus placement interviews for ${company}.
Candidate Target Role: ${role}
Interview Category: ${cat} (e.g., Technical, HR, DSA, System Design, or Comprehensive)
Difficulty Level: ${diff}
Number of Questions: ${count}

Generate ${count} realistic, challenging interview questions frequently asked in Indian campus placement technical/HR rounds.
Return ONLY valid JSON in this format:
{
  "sessionMeta": {
    "role": "${role}",
    "category": "${cat}",
    "difficulty": "${diff}"
  },
  "questions": [
    {
      "id": "q1",
      "question": "Full question statement",
      "category": "${cat}",
      "difficulty": "${diff}",
      "context": "Context or scenario of why this question is asked",
      "keyEvaluationPoints": [
        "What the interviewer expects to hear",
        "Key terminology or concept to cover"
      ]
    }
  ]
}

Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/interview/generate-questions:', err);
    return res.status(500).json({
      error: 'Failed to generate interview questions.',
      details: err.message,
    });
  }
});

// 5. AI Mock Interview - Answer Evaluation & Follow-up
app.post('/api/interview/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { targetRole, question, studentAnswer, category, difficulty } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({
        error: 'Question and student answer are required for evaluation.',
      });
    }

    const prompt = `You are an experienced campus hiring panelist evaluating a student's answer in a mock interview.
Role: ${targetRole || 'Software Engineer'}
Category: ${category || 'Technical'}
Difficulty: ${difficulty || 'Intermediate'}

Question:
"${question}"

Student's Answer:
"${studentAnswer}"

Evaluate the answer objectively. Provide feedback on:
1. Technical correctness and accuracy
2. Structure and clarity (STAR method for HR/behavioral, logical step-by-step for technical/DSA)
3. Depth of explanation
4. Specific areas where the student can level up
5. A high-quality model answer (clearly designated as a learning reference, not a memorization script)
6. A natural follow-up question that an interviewer would ask based on what the student said.

Return valid JSON adhering strictly to:
{
  "score": 78, // integer 0-100
  "rating": "Strong / Good / Average / Needs Significant Improvement",
  "correctness": "Feedback on accuracy and completeness",
  "clarityAndStructure": "Feedback on communication style and flow",
  "strengths": ["Key positive points observed in the response"],
  "areasToImprove": ["Specific missing details, misconceptions, or vagueness"],
  "modelAnswer": "Comprehensive, structured ideal answer for learning purposes",
  "followUpQuestion": "A probing, realistic follow-up question based on the candidate's answer"
}

Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/interview/evaluate-answer:', err);
    return res.status(500).json({
      error: 'Failed to evaluate interview answer.',
      details: err.message,
    });
  }
});

// 6. Company and Role Preparation
app.post('/api/company-prep/generate', async (req: Request, res: Response) => {
  try {
    const { companyName, targetRole, verifiedJobDescription } = req.body;

    if (!companyName || typeof companyName !== 'string') {
      return res.status(400).json({ error: 'Company name is required.' });
    }

    const role = targetRole || 'Software Development Engineer';

    const prompt = `You are a campus placement specialist in India with comprehensive knowledge of recruitment rounds across Indian IT majors (TCS, Infosys, Wipro, Cognizant, Tech Mahindra), Tier-1 Product firms (Amazon, Microsoft, Google, Adobe, Flipkart, Uber, Atlassian), and startups.

Generate a preparation guide and round-wise checklist for:
Company: "${companyName}"
Target Role: "${role}"
Verified User-Provided Job Description or Details (if any):
"${(verifiedJobDescription || '').slice(0, 10000)}"

IMPORTANT ETHICAL & TRANSPARENCY GUIDELINES:
- Do not claim to know confidential internal hiring quotas, leak actual questions, or guarantee placement eligibility.
- Clearly note general campus hiring patterns.
- Label unverified or general preparation suggestions explicitly.

Return valid JSON:
{
  "companyName": "${companyName}",
  "roleName": "${role}",
  "isVerifiedJD": ${Boolean(verifiedJobDescription && verifiedJobDescription.trim().length > 30)},
  "companyCategory": "Product / Service / Fintech / High-Growth Startup",
  "overview": "Realistic overview of general expectations for ${companyName} campus recruitment",
  "transparencyNotice": "This preparation roadmap is synthesized based on general campus recruitment practices and public job requirements. It does not reflect confidential or private corporate criteria.",
  "rounds": [
    {
      "roundNumber": 1,
      "roundName": "Online Assessment (OA)",
      "duration": "60-90 minutes",
      "format": "Aptitude + Coding or MCQ",
      "topicsTested": ["Aptitude", "DSA Arrays/Strings", "Core CS MCQs"],
      "strategyTip": "Crucial timing and negative marking advice"
    },
    {
      "roundNumber": 2,
      "roundName": "Technical Interview 1",
      "duration": "45-60 minutes",
      "format": "Live DSA & Problem Solving",
      "topicsTested": ["DSA", "Time & Space Complexity", "Edge Cases"],
      "strategyTip": "How to communicate your approach before coding"
    },
    {
      "roundNumber": 3,
      "roundName": "Technical Interview 2 / Project Round",
      "duration": "45-60 minutes",
      "format": "Resume Deep-Dive & Core CS",
      "topicsTested": ["Projects", "DBMS / SQL Queries", "OS & Networking"],
      "strategyTip": "Defending project architecture and trade-offs"
    },
    {
      "roundNumber": 4,
      "roundName": "HR & Managerial Round",
      "duration": "30 minutes",
      "format": "Behavioral & Cultural Alignment",
      "topicsTested": ["Situational questions", "Why this company", "Willingness to relocate"],
      "strategyTip": "Professional etiquette and genuine enthusiasm"
    }
  ],
  "checklist": [
    {
      "id": "c1",
      "category": "DSA",
      "item": "Specific DSA topic to master",
      "priority": "High",
      "completed": false
    },
    {
      "id": "c2",
      "category": "Core CS",
      "item": "Specific CS subject focus",
      "priority": "High",
      "completed": false
    },
    {
      "id": "c3",
      "category": "Projects",
      "item": "Project presentation check",
      "priority": "Medium",
      "completed": false
    },
    {
      "id": "c4",
      "category": "Aptitude",
      "item": "Speed test target",
      "priority": "Medium",
      "completed": false
    },
    {
      "id": "c5",
      "category": "Company Research",
      "item": "Values and recent news review",
      "priority": "Low",
      "completed": false
    }
  ],
  "commonPitfalls": [
    "Pitfall 1 with preventative advice",
    "Pitfall 2 with preventative advice"
  ]
}

Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/company-prep/generate:', err);
    return res.status(500).json({
      error: 'Failed to generate company preparation guide.',
      details: err.message,
    });
  }
});

// 7. Coding & DSA Practice - Intelligent Code & Approach Review
app.post('/api/dsa/review-code', async (req: Request, res: Response) => {
  try {
    const { problemTitle, problemDescription, userCode, language, userApproach } = req.body;

    if (!problemTitle || !userCode) {
      return res.status(400).json({
        error: 'Problem title and code are required for evaluation.',
      });
    }

    const prompt = `You are a Senior Software Engineer conducting a DSA code review for a student.
Note: We do not execute arbitrary student code directly on the host server. You provide static analysis, algorithmic correctness verification, complexity analysis, and edge-case testing.

Problem: ${problemTitle}
Problem Description:
"${(problemDescription || '').slice(0, 5000)}"

Language: ${language || 'C++ / Java / Python'}
User's Code:
\`\`\`${language || 'text'}
${userCode.slice(0, 10000)}
\`\`\`

User's Stated Approach:
"${userApproach || 'None provided'}"

Perform an expert code review and return valid JSON:
{
  "verdict": "Accepted / Time Limit Exceeded Risk / Syntax or Logic Error / Suboptimal",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "isOptimal": boolean,
  "correctnessAnalysis": "Detailed assessment of whether this code solves all general and edge cases correctly",
  "edgeCasesChecked": [
    {
      "case": "Empty input / single element / duplicates / negative values / overflow",
      "passed": boolean,
      "explanation": "Why it handles or fails this case"
    }
  ],
  "strengths": ["Good aspects of code cleanliness, variable naming, logic"],
  "areasForImprovement": ["Optimization suggestions or bug warnings"],
  "refactoredCleanCode": "Clean, well-commented reference code in ${language || 'the same language'}",
  "interviewAdvice": "How to explain this algorithm and its complexity during a real interview"
}

Return ONLY valid JSON.`;

    const response = await callGeminiWithRetry(prompt);

    const parsed = JSON.parse(response?.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/dsa/review-code:', err);
    return res.status(500).json({
      error: 'Failed to review code.',
      details: err.message,
    });
  }
});

// Serve frontend in dev (via vite middleware) or production static
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static build
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dev mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlacementPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
