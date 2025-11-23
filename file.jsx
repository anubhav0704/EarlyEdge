npm install gh-pages --save-dev
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Lock, 
  Zap, 
  User, 
  Video, 
  MessageSquare, 
  ShieldCheck, 
  Search,
  MapPin,
  IndianRupee,
  TrendingUp,
  Eye,
  Award,
  Bell,
  X,
  Play,
  Users,
  GraduationCap,
  Filter,
  UserPlus,
  Brain,
  Loader2,
  Code,
  Cpu
} from 'lucide-react';

// --- Mock Data ---

const MOCK_JOBS = [
  {
    id: 1,
    title: "Senior React Developer",
    company: "TechFlow Systems",
    location: "Remote (Bangalore)",
    salary: "₹25L - ₹40L",
    postedTime: new Date(Date.now() - 1000 * 60 * 2), // Posted 2 mins ago
    isPremiumExclusive: true, // Currently in the 10-min window
    recruiterScore: 98,
    recruiterOnline: true,
    tags: ["React", "Node.js", "AWS"],
    applicants: 4,
    logo: "bg-blue-600"
  },
  {
    id: 2,
    title: "Product Designer (UI/UX)",
    company: "Creative Hib",
    location: "Mumbai",
    salary: "₹15L - ₹22L",
    postedTime: new Date(Date.now() - 1000 * 60 * 8), // Posted 8 mins ago
    isPremiumExclusive: true,
    recruiterScore: 45,
    recruiterOnline: false,
    tags: ["Figma", "Prototyping"],
    applicants: 12,
    logo: "bg-purple-600"
  },
  {
    id: 3,
    title: "Marketing Manager",
    company: "GrowthRocket",
    location: "Gurgaon",
    salary: "₹10L - ₹15L",
    postedTime: new Date(Date.now() - 1000 * 60 * 45), // Posted 45 mins ago
    isPremiumExclusive: false, // Window passed
    recruiterScore: 88,
    recruiterOnline: true,
    tags: ["SEO", "Content"],
    applicants: 156,
    logo: "bg-green-600"
  }
];

const MOCK_EXPERTS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Staff Engineer @ Google",
    price: "₹2500",
    rating: 4.9,
    image: "SJ",
    bio: "Ex-Netflix. I help candidates crush the system design round."
  },
  {
    id: 2,
    name: "Michael Ross",
    role: "HR Manager @ Deloitte",
    price: "₹1500",
    rating: 4.8,
    image: "MR",
    bio: "I teach you exactly what HR looks for and how to negotiate salary."
  }
];

const MOCK_SQUADS = [
  {
    id: 1,
    name: "React Rangers",
    members: ["Dev", "Dev", "Des"],
    status: "Looking for Backend Dev",
    avgScore: 92
  },
  {
    id: 2,
    name: "Design Dynamos",
    members: ["Des", "Des"],
    status: "Open to Work",
    avgScore: 88
  }
];

const COLLEGE_LEADERBOARD = [
  { rank: 1, name: "IIT Bombay", score: 9850, trend: "+12%" },
  { rank: 2, name: "BITS Pilani", score: 9420, trend: "+5%" },
  { rank: 3, name: "Delhi Univ", score: 8900, trend: "-2%" },
];

// --- Components ---

const Badge = ({ children, className }) => (
  <span className={px-2 py-0.5 rounded text-xs font-medium ${className}}>
    {children}
  </span>
);

const Navbar = ({ activeTab, setActiveTab, userType }) => (
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">E</div>
            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">EarlyEdge</span>
          </div>
          <div className="hidden md:ml-8 md:flex md:space-x-8">
            {['jobs', 'experts', 'squads'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={${activeTab === tab ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} capitalize inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">Live Feed</span>
          </div>
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-400 cursor-pointer" />
            {userType === 'premium' && <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />}
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">JD</div>
        </div>
      </div>
    </div>
  </nav>
);

const AssessmentModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Testing, 2: Analyzing, 3: Success

  useEffect(() => {
    if (isOpen && step === 1) {
      const timer = setTimeout(() => setStep(2), 2000);
      return () => clearTimeout(timer);
    }
    if (isOpen && step === 2) {
      const timer = setTimeout(() => setStep(3), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {step === 0 && (
          <div className="p-8 text-center">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill Assessment</h2>
            <p className="text-gray-500 text-sm mb-6">
              To unlock Early Access, you must prove your technical competence. This 30-minute test covers React, Node.js, and System Design.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Top 10% Score Required</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-700">Timed Environment</span>
              </div>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Start Challenge
            </button>
          </div>
        )}

        {(step === 1 || step === 2) && (
          <div className="p-8 text-center">
             <div className="mb-6 relative">
               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-600 animate-[width_2s_ease-in-out_infinite] w-1/2"></div>
               </div>
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">
               {step === 1 ? "Running Test Cases..." : "AI Grading Submission..."}
             </h3>
             <p className="text-sm text-gray-500">Please do not close this window.</p>
             <div className="mt-8 grid grid-cols-3 gap-2">
                <div className="h-20 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                   <Code className="h-5 w-5 text-gray-400 mb-1" />
                   <span className="text-[10px] text-gray-400">Syntax</span>
                </div>
                <div className="h-20 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                   <Cpu className="h-5 w-5 text-gray-400 mb-1" />
                   <span className="text-[10px] text-gray-400">Logic</span>
                </div>
                <div className="h-20 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                   <Zap className="h-5 w-5 text-gray-400 mb-1" />
                   <span className="text-[10px] text-gray-400">Speed</span>
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 text-center bg-gradient-to-b from-white to-green-50">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
               <Award className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Passed!</h2>
            <div className="text-4xl font-black text-green-600 mb-2">94<span className="text-lg text-gray-400 font-medium">/100</span></div>
            <p className="text-gray-600 text-sm mb-6">
              You have ranked in the top 5% of candidates. You are now a <b>Verified Premium Member</b>.
            </p>
            <button 
              onClick={onComplete}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
            >
              Unlock Early Access Jobs
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const Sidebar = ({ userType, onOpenAssessment }) => (
  <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
           <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">JD</div>
           <div>
              <h3 className="font-bold text-gray-900">John Doe</h3>
              <p className="text-xs text-gray-500">Full Stack Dev</p>
           </div>
        </div>
        
        {userType === 'premium' ? (
           <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex flex-col gap-2 text-green-700 text-sm font-bold mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Verified Talent
              </div>
              <p className="text-[10px] text-green-600 font-normal leading-tight">
                Early Access Active. You see jobs 10m before others.
              </p>
           </div>
        ) : (
           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-sm">
                 <Brain className="h-4 w-4 text-purple-600" />
                 Qualify for Premium
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                 Premium Early Access is restricted to candidates who pass our technical screening.
              </p>
              <button 
                onClick={onOpenAssessment} 
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                 Take Skill Challenge
              </button>
           </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-2">
           <div className="flex justify-between text-sm">
              <span className="text-gray-500">Profile Views</span>
              <span className="font-bold text-gray-900">42</span>
           </div>
           <div className="flex justify-between text-sm">
              <span className="text-gray-500">Applications</span>
              <span className="font-bold text-gray-900">12</span>
           </div>
        </div>
     </div>

     {/* College Leaderboard Widget */}
     <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
           <GraduationCap className="h-4 w-4 text-purple-600" /> Top Colleges
        </h4>
        <div className="space-y-3">
           {COLLEGE_LEADERBOARD.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono text-xs">{c.rank}</span>
                    <span className="text-gray-700 font-medium">{c.name}</span>
                 </div>
                 <span className="text-green-600 text-xs font-bold">{c.trend}</span>
              </div>
           ))}
        </div>
        <button className="w-full mt-3 text-xs text-purple-600 font-bold hover:underline">View Full Leaderboard</button>
     </div>
  </div>
);

const JobCard = ({ job, userType }) => {
  const isLocked = job.isPremiumExclusive && userType === 'free';
  const timeSincePosted = Math.floor((Date.now() - job.postedTime) / 60000);
  const minutesRemaining = 10 - timeSincePosted;

  return (
    <div className={relative bg-white rounded-xl border transition-all duration-300 ${isLocked ? 'border-gray-200 bg-gray-50 overflow-hidden' : 'border-gray-200 hover:shadow-md hover:border-blue-300'}}>
      
      {/* 1. The Time-Lock Overlay (Modified for Merit Logic) */}
      {isLocked && (
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 z-10 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white p-3 rounded-full shadow-lg mb-3">
            <Lock className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Restricted Access</h3>
          <p className="text-gray-500 text-sm mb-4">
            Posted {timeSincePosted}m ago. This job is currently locked for non-verified candidates.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
             <Brain className="h-3 w-3" />
             Pass Assessment to Unlock
          </div>
        </div>
      )}

      <div className={p-5 ${isLocked ? 'opacity-40 filter blur-[1px]' : ''}}>
        {job.recruiterOnline && !isLocked && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
             <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
             </span>
             Online
          </div>
        )}

        <div className="flex gap-4 mb-3">
          <div className={w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm ${job.logo}}>
            {job.company.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{job.title}</h3>
            <p className="text-gray-500 text-sm">{job.company} • {job.location}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-gray-100 text-gray-600">{job.salary}</Badge>
          {job.tags.map(tag => <Badge key={tag} className="bg-blue-50 text-blue-700">{tag}</Badge>)}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
           <div className="flex items-center gap-1 text-sm text-gray-600">
              <TrendingUp className={h-4 w-4 ${job.recruiterScore > 90 ? 'text-green-500' : 'text-yellow-500'}} />
              <span className="font-medium">{job.recruiterScore}% Response Rate</span>
           </div>
           <button className="text-blue-600 text-sm font-bold hover:underline">Apply Now</button>
        </div>
      </div>
    </div>
  );
};

const ExpertCard = ({ expert }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
     <div className="flex gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xl">{expert.image}</div>
        <div>
           <h3 className="font-bold text-gray-900">{expert.name}</h3>
           <p className="text-sm text-blue-600 font-medium">{expert.role}</p>
           <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <span className="text-yellow-500 font-bold">★ {expert.rating}</span>
              <span>• Video Call • Mock Interview</span>
           </div>
        </div>
        <div className="ml-auto text-right">
           <span className="block font-bold text-gray-900">{expert.price}</span>
           <button className="mt-2 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">Book</button>
        </div>
     </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [userType, setUserType] = useState('free');
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAssessmentComplete = () => {
    setUserType('premium');
    setIsAssessmentOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20 md:pb-10">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userType={userType} />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white px-4 py-3 sticky top-0 z-40 border-b border-gray-200 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
            <span className="font-bold text-lg text-gray-900">EarlyEdge</span>
         </div>
         <div className="flex items-center gap-3">
             <span className={text-xs px-2 py-1 rounded-full font-bold ${userType === 'premium' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}}>
                {userType === 'premium' ? 'Verified' : 'Basic'}
             </span>
             <Bell className="h-5 w-5 text-gray-500" />
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <Sidebar 
            userType={userType} 
            onOpenAssessment={() => setIsAssessmentOpen(true)}
          />

          <main className="flex-1 min-w-0 w-full">
            
            {activeTab === 'jobs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recommended Jobs</h2>
                  <div className="flex items-center gap-2">
                     <span className="hidden sm:inline text-sm text-gray-500">Sort:</span>
                     <select className="text-sm border-none bg-transparent font-medium text-gray-900 cursor-pointer focus:ring-0 pl-0">
                       <option>Newest (EarlyEdge)</option>
                       <option>Relevance</option>
                     </select>
                  </div>
                </div>

                {/* Banner for Free Users */}
                {userType === 'free' && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-xl mb-2">Prove Your Skill. Unlock Access. 🚀</h3>
                      <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
                        Only verified candidates get to see jobs 10 minutes early. Pass our standard assessment to join the elite top 10% of applicants.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsAssessmentOpen(true)}
                      className="w-full sm:w-auto bg-white text-blue-700 px-6 py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      Start Assessment
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {MOCK_JOBS.map(job => (
                    <JobCard key={job.id} job={job} userType={userType} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'experts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900">Expert Marketplace</h2>
                      <p className="text-sm text-gray-500 mt-1">Book mock interviews or watch experts work live.</p>
                   </div>
                   <button className="text-blue-600 text-sm font-medium hover:underline self-start">
                     Filter by Industry
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MOCK_EXPERTS.map(expert => (
                    <ExpertCard key={expert.id} expert={expert} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'squads' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Squad Market</h2>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800">
                       Create Squad
                    </button>
                 </div>
                 <p className="text-sm text-gray-500 mb-4">Join forces with friends. Companies can hire your entire team at once.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_SQUADS.map(squad => (
                       <div key={squad.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                             <h3 className="font-bold text-gray-900">{squad.name}</h3>
                             <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">{squad.avgScore} Score</span>
                          </div>
                          <div className="flex -space-x-2 mb-4">
                             {squad.members.map((m, i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">{m}</div>
                             ))}
                             <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400">
                                <UserPlus className="h-4 w-4" />
                             </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{squad.status}</p>
                          <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">View Team</button>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-xl border border-gray-200 h-96 flex items-center justify-center text-center p-8">
                 <div className="max-w-xs">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <MessageSquare className="h-8 w-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                   <p className="text-gray-500 text-sm">
                     When recruiters respond to your applications (or you ghost them!), threads will appear here.
                   </p>
                 </div>
              </div>
            )}
            
          </main>
        </div>
      </div>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around py-3">
         {['jobs', 'experts', 'squads'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={flex flex-col items-center gap-1 ${activeTab === tab ? 'text-blue-600' : 'text-gray-400'}}
            >
               {tab === 'jobs' && <Briefcase className="h-6 w-6" />}
               {tab === 'experts' && <Video className="h-6 w-6" />}
               {tab === 'squads' && <Users className="h-6 w-6" />}
               <span className="text-[10px] capitalize font-medium">{tab}</span>
            </button>
         ))}
      </div>

      <AssessmentModal 
        isOpen={isAssessmentOpen} 
        onClose={() => setIsAssessmentOpen(false)}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
};

export default App;
