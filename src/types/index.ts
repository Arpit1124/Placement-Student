export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  targetRole?: string;
  currentSkills?: string[];
  dailyStudyHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeAnalysisResult {
  id?: string;
  candidateName: string;
  contactInfo: {
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    location: string;
  };
  extractedSkills: {
    technical: string[];
    frameworks: string[];
    tools: string[];
    softSkills: string[];
  };
  education: Array<{
    institution: string;
    degree: string;
    branch: string;
    year: string;
    score: string;
  }>;
  projects: Array<{
    title: string;
    technologies: string[];
    summary: string;
    critique: string;
  }>;
  experienceOrInternships: Array<{
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  achievements: string[];
  strengths: string[];
  missingSkills: string[];
  bulletPointCritique: Array<{
    original: string;
    issue: string;
    improved: string;
  }>;
  atsScore: number;
  atsAssessment: {
    readability: string;
    keywordDensity: string;
    sectionCompleteness: string;
    verdict: string;
  };
  actionableRecommendations: string[];
  fileName?: string;
  targetRole?: string;
  createdAt?: string;
}

export interface JobGapAnalysisResult {
  id?: string;
  detectedRoleTitle: string;
  companyContext: string;
  targetRole?: string;
  company?: string;
  jobDescription?: string;
  extractedRequirements: {
    requiredSkills: string[];
    preferredSkills: string[];
    technologies: string[];
    responsibilities: string[];
  };
  matchedSkills: string[];
  missingSkills: string[];
  skillGapsWithReason: Array<{
    skill: string;
    importance: string;
    whyItMatters: string;
    learningRecommendation: string;
  }>;
  matchPercentage: number;
  screeningVerdict: string;
  priorityRoadmap: Array<{
    priority: number;
    topic: string;
    timeframe: string;
    action: string;
  }>;
  createdAt?: string;
}

export interface RoadmapTask {
  id: string;
  text: string;
  type: string;
  completed?: boolean;
}

export interface RoadmapDay {
  day: number;
  week: number;
  title: string;
  category: 'DSA' | 'Core CS' | 'Aptitude' | 'Projects' | 'Mock Prep' | 'System Design' | string;
  estimatedMinutes: number;
  tasks: RoadmapTask[];
  keyConcepts: string[];
  interviewTip: string;
}

export interface RoadmapData {
  id?: string;
  targetRole: string;
  dailyHours: number;
  weeklyMilestones: Array<{
    week: number;
    theme: string;
  }>;
  days: RoadmapDay[];
  completedTasksCount?: number;
  totalTasksCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  context: string;
  keyEvaluationPoints: string[];
  studentAnswer?: string;
  evaluation?: {
    score: number;
    rating: string;
    correctness: string;
    clarityAndStructure: string;
    strengths: string[];
    areasToImprove: string[];
    modelAnswer: string;
    followUpQuestion?: string;
  };
  followUpAnswer?: string;
  followUpEvaluation?: string;
}

export interface MockInterviewSession {
  id?: string;
  targetRole: string;
  category: string;
  difficulty: string;
  questions: InterviewQuestion[];
  overallScore?: number;
  completed: boolean;
  createdAt: string;
}

export interface DsaProblem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  hints: string[];
  popularCompanies: string[];
  starterCode: {
    cpp: string;
    java: string;
    python: string;
    javascript: string;
  };
}

export interface CodeReviewResult {
  verdict: string;
  timeComplexity: string;
  spaceComplexity: string;
  isOptimal: boolean;
  correctnessAnalysis: string;
  edgeCasesChecked: Array<{
    case: string;
    passed: boolean;
    explanation: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  refactoredCleanCode: string;
  interviewAdvice: string;
}

export interface CompanyPrepData {
  id?: string;
  companyName: string;
  roleName: string;
  isVerifiedJD: boolean;
  companyCategory: string;
  overview: string;
  transparencyNotice: string;
  rounds: Array<{
    roundNumber: number;
    roundName: string;
    duration: string;
    format: string;
    topicsTested: string[];
    strategyTip: string;
  }>;
  checklist: Array<{
    id: string;
    category: string;
    item: string;
    priority: 'High' | 'Medium' | 'Low';
    completed: boolean;
  }>;
  commonPitfalls: string[];
  createdAt?: string;
}
