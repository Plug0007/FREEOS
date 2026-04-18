import React, { useState, useEffect } from 'react';
import API from '../api';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const JobCard = ({ job, onSave, onApply }) => {
  const getTrustColor = (score) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  return (
    <div className="group relative bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Match Score Badge */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-600 rounded-3xl rotate-12 group-hover:rotate-0 transition-all duration-500 flex flex-col items-center justify-center shadow-xl shadow-indigo-200">
        <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">Match</span>
        <span className="text-white text-2xl font-black">{job.matchScore}%</span>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            {job.source?.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{job.title}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{job.source}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {job.skills?.map((skill, idx) => (
          <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            {skill}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`flex items-center space-x-2 p-3 rounded-2xl border ${getTrustColor(job.trustScore)}`}>
          <ShieldCheck size={18} />
          <div>
            <div className="text-[10px] font-black uppercase tracking-tighter opacity-80">Trust Score</div>
            <div className="text-sm font-black">{job.trustScore}%</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-slate-600">
          <DollarSign size={18} />
          <div>
            <div className="text-[10px] font-black uppercase tracking-tighter opacity-80">Budget</div>
            <div className="text-sm font-black">₹{job.budget?.toLocaleString() || 'Quote'}</div>
          </div>
        </div>
      </div>

      <p className="text-slate-500 text-sm mb-8 line-clamp-3 font-medium leading-relaxed italic">
        "{job.explanation || 'Perfect fit for your current skill suite.'}"
      </p>

      <div className="flex space-x-4">
        <button 
           onClick={() => window.open(job.applyUrl, '_blank')}
           className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-200"
        >
          <span>Apply Now</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await API.get('/jobs');
        setJobs(res.data);
      } catch (err) {
        console.error('Jobs fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return (
    <div className="ml-64 p-8 min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Scanning Global Market...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="text-indigo-600 fill-indigo-600" size={32} />
              <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Job Discovery</h2>
            </div>
            <p className="text-slate-500 font-medium italic">High-intent opportunities matched to your profile</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live API Feeds Syncing</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <Search size={64} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest">No matching opportunities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
